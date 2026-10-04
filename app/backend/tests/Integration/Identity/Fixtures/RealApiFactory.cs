using Application.Data;
using Backlog.Data;
using Backlog.Domain.BacklogItems;
using Integration.Identity.Support;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Integration.Identity.Fixtures;

/// <summary>
/// Hospeda el <c>Program</c> REAL del Bootstrapper con autenticación Keycloak real y catálogo real del módulo
/// Application sobre PostgreSQL real. Solo se inyectan por configuración la cadena de conexión, la migración al
/// arrancar y la URL del Keycloak del contenedor; no se sustituye ningún servicio (sin ConfigureTestServices).
///
/// Spike T008 (R5/D4), resultado verificado: con <c>Keycloak:ssl-required=external</c> el host lanza
/// "The MetadataAddress or Authority must use HTTPS" ante el Keycloak HTTP del contenedor. Por eso la ÚNICA
/// relajación es <c>Keycloak:ssl-required=none</c>; <c>verify-token-audience</c>, <c>realm</c> y <c>resource</c>
/// se dejan intactos (los protege <c>ProductionConfigGuardTests</c>).
/// </summary>
public sealed class RealApiFactory : WebApplicationFactory<Program>
{
    // Un entorno distinto de Development para que NO se apliquen appsettings.Development.json
    // (que relaja verify-token-audience): el host usa la configuración base de producción.
    private const string TestingEnvironment = "Testing";
    private const string ConnectionStringKey = "ConnectionStrings:Database";
    private const string MigrateOnStartupKey = "Database:MigrateOnStartup";
    private const string KeycloakAuthServerUrlKey = "Keycloak:auth-server-url";
    private const string KeycloakSslRequiredKey = "Keycloak:ssl-required";
    private const string SslNotRequired = "none";

    private readonly string _connectionString;
    private readonly string _keycloakBaseAddress;

    public RealApiFactory(KeycloakFixture keycloak, PostgresFixture postgres)
    {
        _keycloakBaseAddress = keycloak.BaseAddress;
        _connectionString = postgres.CreateDatabaseAsync().GetAwaiter().GetResult();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(TestingEnvironment);
        builder.UseSetting(ConnectionStringKey, _connectionString);
        builder.UseSetting(MigrateOnStartupKey, "true");
        builder.UseSetting(KeycloakAuthServerUrlKey, _keycloakBaseAddress);
        builder.UseSetting(KeycloakSslRequiredKey, SslNotRequired);
    }

    public HttpClient ClientWithBearer(string? token)
    {
        var client = CreateClient();
        if (token is not null) client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
        return client;
    }

    /// <summary>Lee lo realmente persistido en Backlog, con un contexto nuevo (sin seguimiento).</summary>
    public async Task<List<BacklogItem>> StoredItemsAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<BacklogDbContext>();
        return await db.BacklogItems.AsNoTracking().ToListAsync();
    }

    /// <summary>Cuenta las filas del catálogo real (schema application).</summary>
    public async Task<int> ApplicationCountAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        return await db.Applications.AsNoTracking().CountAsync();
    }

    public Task<IReadOnlyList<Guid>> SeedApplicationsAsync(params string[] names) =>
        CatalogSeeder.SeedAsync(Services, names);
}
