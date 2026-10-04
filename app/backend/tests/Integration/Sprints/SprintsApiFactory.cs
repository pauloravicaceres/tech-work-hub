using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using Sprints;
using Sprints.Data;
using Sprints.Domain.Sprints;

namespace Integration.Sprints;

/// <summary>
/// Esquema de prueba que sustituye a Keycloak/JWT: "Bearer valid-token" autentica con claim sub=user-1;
/// "Bearer no-sub-token" autentica sin claim de identidad (FR-010 → 401).
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
/// CustomExceptionHandler) sobre PostgreSQL real (Testcontainers) con migraciones aplicadas al arrancar.
/// Solo se sustituye Keycloak por un esquema de autenticación de prueba.
/// </summary>
public sealed class SprintsApiFactory : WebApplicationFactory<Program>
{
    public string ConnectionString { get; }

    public SprintsApiFactory(PostgresFixture postgres)
    {
        ConnectionString = postgres.CreateDatabaseAsync().GetAwaiter().GetResult();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting($"ConnectionStrings:{SprintsModule.ConnectionStringName}", ConnectionString);
        builder.UseSetting("Database:MigrateOnStartup", "true");

        builder.ConfigureTestServices(services =>
            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = TestAuthHandler.SchemeName;
                    options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { }));
    }

    public HttpClient AnonymousClient() => CreateClient();

    public HttpClient AuthenticatedClient(string authorization = TestAuthHandler.ValidToken)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", authorization);
        return client;
    }

    /// <summary>Lee lo realmente persistido, con un contexto nuevo (solo lectura, sin caché de seguimiento).</summary>
    public async Task<List<Sprint>> StoredSprintsAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SprintsDbContext>();
        return await db.Sprints.AsNoTracking().ToListAsync();
    }

    /// <summary>Siembra un Sprint por SQL directo (las pruebas de lectura no dependen del endpoint de creación).</summary>
    public Task<Guid> SeedSprintAsync(string identification, DateOnly start)
    {
        _ = Services; // el host (y con él la migración de arranque) se crea de forma perezosa
        return SprintsSql.InsertAsync(ConnectionString, identification, start, start.AddDays(SprintRules.WindowDays - 1));
    }

    public async Task<long> BacklogItemCountAsync()
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT count(*) FROM backlog.\"BacklogItems\"", connection);
        return (long)(await command.ExecuteScalarAsync())!;
    }
}

internal static class SprintsSql
{
    public static async Task<Guid> InsertAsync(string connectionString, string identification, DateOnly start, DateOnly end)
    {
        var id = Guid.NewGuid();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO sprints."Sprints" ("Id", "Identification", "StartDate", "EndDate", "CreatedAt", "CreatedBy")
            VALUES (@id, @identification, @start, @end, now(), 'seed-user')
            """,
            connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("identification", identification);
        command.Parameters.AddWithValue("start", start);
        command.Parameters.AddWithValue("end", end);
        await command.ExecuteNonQueryAsync();
        return id;
    }
}
