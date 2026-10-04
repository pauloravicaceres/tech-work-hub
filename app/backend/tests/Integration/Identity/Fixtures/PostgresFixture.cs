using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace Integration.Identity.Fixtures;

/// <summary>
/// Un único contenedor PostgreSQL por suite. Cada prueba obtiene su propia base de datos vacía dentro del mismo
/// contenedor. Si Docker o PostgreSQL no están disponibles la suite FALLA con un mensaje explícito (nunca se omite).
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder().WithImage("postgres:16-alpine").Build();

    public async Task InitializeAsync()
    {
        var timeout = StartupTimeout.FromEnvironment();
        using var cts = new CancellationTokenSource(timeout);
        try
        {
            await _postgres.StartAsync(cts.Token);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException(
                "No se pudo arrancar PostgreSQL/Docker para la suite Identity.IntegrationTests. " +
                $"Verifique que Docker esté en ejecución (timeout {timeout.TotalSeconds}s).", ex);
        }
    }

    public Task DisposeAsync() => _postgres.DisposeAsync().AsTask();

    /// <summary>Crea una base de datos nueva y vacía y devuelve su cadena de conexión.</summary>
    public async Task<string> CreateDatabaseAsync()
    {
        var name = $"t_{Guid.NewGuid():N}";
        await using var admin = new NpgsqlConnection(_postgres.GetConnectionString());
        await admin.OpenAsync();
        await using var command = new NpgsqlCommand($"CREATE DATABASE \"{name}\"", admin);
        await command.ExecuteNonQueryAsync();

        return new NpgsqlConnectionStringBuilder(_postgres.GetConnectionString()) { Database = name, Pooling = false }
            .ConnectionString;
    }
}

/// <summary>Timeout de arranque de contenedores, configurable con IDENTITY_TESTS_STARTUP_TIMEOUT_SECONDS (defecto 120).</summary>
internal static class StartupTimeout
{
    public const string EnvironmentVariable = "IDENTITY_TESTS_STARTUP_TIMEOUT_SECONDS";
    private const int DefaultSeconds = 120;

    public static TimeSpan FromEnvironment() =>
        int.TryParse(Environment.GetEnvironmentVariable(EnvironmentVariable), out var seconds) && seconds > 0
            ? TimeSpan.FromSeconds(seconds)
            : TimeSpan.FromSeconds(DefaultSeconds);
}
