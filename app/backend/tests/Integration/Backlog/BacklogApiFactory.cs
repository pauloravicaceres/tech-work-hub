using System.Security.Claims;
using System.Text.Encodings.Web;
using Backlog.Contracts;
using Backlog.Data;
using Backlog.Domain.BacklogItems;
using Backlog.Domain.BacklogItems.Events;
using MediatR;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Shared.Data.Interceptors;

namespace Integration.Backlog;

/// <summary>Catálogo de aplicaciones del módulo Application (otro módulo): se simula solo ese borde.</summary>
public sealed class FakeApplicationCatalog : IApplicationModuleApi
{
    public HashSet<Guid> Known { get; } = [];

    /// <summary>Si es true, ExistsAsync espera hasta que se cancele el token de la solicitud.</summary>
    public bool BlockUntilCancelled { get; set; }
    public TaskCompletionSource Started { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);
    public TaskCompletionSource<bool> SawCancellation { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

    public async Task<bool> ExistsAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        if (BlockUntilCancelled)
        {
            Started.TrySetResult();
            try
            {
                await Task.Delay(Timeout.Infinite, cancellationToken);
            }
            catch (OperationCanceledException)
            {
                SawCancellation.TrySetResult(true);
                throw;
            }
        }

        return Known.Contains(applicationId);
    }
}

/// <summary>Registra los eventos de dominio que llegan por el pipeline real de MediatR.</summary>
public sealed class RecordingCreatedHandler : INotificationHandler<BacklogItemCreatedDomainEvent>
{
    public List<BacklogItemCreatedDomainEvent> Events { get; } = [];

    public Task Handle(BacklogItemCreatedDomainEvent notification, CancellationToken cancellationToken)
    {
        Events.Add(notification);
        return Task.CompletedTask;
    }
}

/// <summary>
/// Esquema de prueba que sustituye a Keycloak/JWT: "Bearer valid-token" autentica con claim sub=user-1;
/// "Bearer no-sub-token" autentica sin claim de identidad (FR-009 → 401).
/// </summary>
public sealed class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "Test";
    public const string ValidToken = "Bearer valid-token";
    public const string NoSubjectToken = "Bearer no-sub-token";
    public const string UserId = "user-1";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        Claim[] claims = header switch
        {
            ValidToken => [new Claim("sub", UserId)],
            NoSubjectToken => [new Claim("name", "anonimo")],
            _ => []
        };
        if (claims.Length == 0) return Task.FromResult(AuthenticateResult.NoResult());

        var identity = new ClaimsIdentity(claims, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(
            new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
    }
}

/// <summary>
/// Hospeda el <c>Program</c> REAL del Bootstrapper (Carter + MediatR + ValidationBehavior + interceptores de Shared +
/// CustomExceptionHandler + JsonStringEnumConverter). Solo se sustituyen PostgreSQL (SQLite en memoria),
/// Keycloak (esquema de prueba) y el módulo Application.
/// </summary>
public sealed class BacklogApiFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    public FakeApplicationCatalog Apps { get; } = new();
    public RecordingCreatedHandler CreatedEvents { get; } = new();

    public BacklogApiFactory()
    {
        _connection.Open();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Database:MigrateOnStartup", "false");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<DbContextOptions<BacklogDbContext>>();
            services.AddDbContext<BacklogDbContext>((provider, options) => options
                .UseSqlite(_connection)
                .AddInterceptors(
                    provider.GetRequiredService<AuditableEntityInterceptor>(),
                    provider.GetRequiredService<DispatchDomainEventsInterceptor>()));

            services.RemoveAll<IApplicationModuleApi>();
            services.AddSingleton<IApplicationModuleApi>(Apps);
            services.AddSingleton<INotificationHandler<BacklogItemCreatedDomainEvent>>(CreatedEvents);

            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = TestAuthHandler.SchemeName;
                    options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        using var scope = host.Services.CreateScope();
        scope.ServiceProvider.GetRequiredService<BacklogDbContext>().Database.EnsureCreated();
        return host;
    }

    public HttpClient AnonymousClient() => CreateClient();

    public HttpClient AuthenticatedClient(string authorization = TestAuthHandler.ValidToken)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", authorization);
        return client;
    }

    /// <summary>Lee lo realmente persistido, con un contexto nuevo (sin caché de seguimiento).</summary>
    public async Task<List<BacklogItem>> StoredItemsAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BacklogDbContext>();
        return await db.BacklogItems.AsNoTracking().ToListAsync();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _connection.Dispose();
    }
}
