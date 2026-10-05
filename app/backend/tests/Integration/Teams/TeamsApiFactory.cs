using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Npgsql;
using Teams;
using Teams.Contracts;
using Teams.Data;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TeamMembers;

namespace Integration.Teams;

/// <summary>
/// Esquema de prueba que sustituye a Keycloak/JWT: "Bearer valid-token" autentica con claim sub=user-1;
/// "Bearer no-sub-token" autentica sin claim de identidad (→ 401).
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
public sealed class TeamsApiFactory : WebApplicationFactory<Program>
{
    public string ConnectionString { get; }

    /// <summary>Doble del contrato <see cref="IBacklogItemLookup"/>: las pruebas de Teams no dependen del módulo Backlog.</summary>
    public FakeBacklogItemLookup Items { get; } = new();

    public TeamsApiFactory(PostgresFixture postgres)
    {
        ConnectionString = postgres.CreateDatabaseAsync().GetAwaiter().GetResult();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting($"ConnectionStrings:{TeamsModule.ConnectionStringName}", ConnectionString);
        builder.UseSetting("Database:MigrateOnStartup", "true");

        builder.ConfigureTestServices(services =>
        {
            services.AddAuthentication(options =>
                {
                    options.DefaultScheme = TestAuthHandler.SchemeName;
                    options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.SchemeName, _ => { });

            services.RemoveAll<IBacklogItemLookup>();
            services.AddSingleton<IBacklogItemLookup>(Items);
        });
    }

    /// <summary>Lo realmente persistido en <c>ItemAssignments</c>, con un contexto nuevo (solo lectura).</summary>
    public async Task<List<ItemAssignment>> StoredAssignmentsAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TeamsDbContext>();
        return await db.ItemAssignments.AsNoTracking().ToListAsync();
    }

    public HttpClient AnonymousClient() => CreateClient();

    public HttpClient AuthenticatedClient(string authorization = TestAuthHandler.ValidToken)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", authorization);
        return client;
    }

    /// <summary>Lee lo realmente persistido, con un contexto nuevo (solo lectura, sin caché de seguimiento).</summary>
    public async Task<List<TeamMember>> StoredMembersAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TeamsDbContext>();
        return await db.TeamMembers.AsNoTracking().ToListAsync();
    }

    /// <summary>Siembra un miembro por SQL directo (las pruebas de lectura no dependen del endpoint de alta).</summary>
    public Task<Guid> SeedMemberAsync(string name, Guid roleId)
    {
        _ = Services; // el host (y con él la migración de arranque) se crea de forma perezosa
        return TeamsSql.InsertMemberAsync(ConnectionString, name, roleId);
    }

    /// <summary>Recuento de filas de una tabla cualquiera (schema.tabla ya entrecomillado), para pruebas de no regresión.</summary>
    public async Task<long> CountAsync(string qualifiedTable)
    {
        _ = Services;
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand($"SELECT count(*) FROM {qualifiedTable}", connection);
        return (long)(await command.ExecuteScalarAsync())!;
    }
}

internal static class TeamsSql
{
    public static async Task<Guid> InsertMemberAsync(string connectionString, string name, Guid roleId)
    {
        var id = Guid.NewGuid();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            """
            INSERT INTO teams."TeamMembers" ("Id", "Name", "TechnicalRoleId", "CreatedAt", "CreatedBy")
            VALUES (@id, @name, @roleId, now(), 'seed-user')
            """,
            connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("name", name);
        command.Parameters.AddWithValue("roleId", roleId);
        await command.ExecuteNonQueryAsync();
        return id;
    }
}
