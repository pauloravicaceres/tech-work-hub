using System.Security.Claims;
using System.Text.Encodings.Web;
using Backlog.Domain.BacklogItems;
using Backlog.Features.BacklogItems.CreateBacklogItem;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Integration.Backlog;

/// <summary>BD y catálogo de aplicaciones en memoria: permiten inspeccionar qué se persistió realmente.</summary>
public sealed class FakeBacklogDb : IBacklogDbContext
{
    public List<BacklogItem> Items { get; } = new();
    public int SaveCalls { get; private set; }

    public Task AddAsync<T>(T entity, CancellationToken cancellationToken = default) where T : class
    {
        if (entity is BacklogItem item) Items.Add(item);
        return Task.CompletedTask;
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        SaveCalls++;
        return Task.FromResult(1);
    }
}

public sealed class FakeApplicationCatalog : IApplicationModuleApi
{
    public HashSet<Guid> Known { get; } = new();
    public Task<bool> ExistsAsync(Guid applicationId, CancellationToken cancellationToken = default) =>
        Task.FromResult(Known.Contains(applicationId));
}

/// <summary>Esquema de prueba: autentica solo si llega "Authorization: Bearer valid-token".</summary>
public sealed class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger, UrlEncoder encoder)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string Scheme = "Test";

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header = Request.Headers.Authorization.ToString();
        if (header != "Bearer valid-token") return Task.FromResult(AuthenticateResult.NoResult());

        var identity = new ClaimsIdentity([new Claim("sub", "user-1")], Scheme);
        return Task.FromResult(AuthenticateResult.Success(
            new AuthenticationTicket(new ClaimsPrincipal(identity), Scheme)));
    }
}

/// <summary>
/// Hospeda en memoria el endpoint REAL (CreateBacklogItemEndpoint) + MediatR + handler real.
/// Solo se registra lo que el código de producción entrega hoy: sin ValidationBehavior ni exception handler.
/// </summary>
public sealed class BacklogApiFactory : IAsyncDisposable
{
    private readonly WebApplication _app;
    public FakeBacklogDb Db { get; } = new();
    public FakeApplicationCatalog Apps { get; } = new();

    public BacklogApiFactory()
    {
        var builder = WebApplication.CreateBuilder();
        builder.WebHost.UseTestServer();
        builder.Services.AddSingleton<IBacklogDbContext>(Db);
        builder.Services.AddSingleton<IApplicationModuleApi>(Apps);
        builder.Services.AddMediatR(c => c.RegisterServicesFromAssemblyContaining<CreateBacklogItemCommand>());
        builder.Services.AddAuthentication(TestAuthHandler.Scheme)
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.Scheme, _ => { });
        builder.Services.AddAuthorization();

        _app = builder.Build();
        _app.UseAuthentication();
        _app.UseAuthorization();
        new CreateBacklogItemEndpoint().AddRoutes(_app);
        _app.StartAsync().GetAwaiter().GetResult();
    }

    public HttpClient AnonymousClient() => _app.GetTestClient();

    public HttpClient AuthenticatedClient()
    {
        var client = _app.GetTestClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer valid-token");
        return client;
    }

    public async ValueTask DisposeAsync() => await _app.DisposeAsync();
}
