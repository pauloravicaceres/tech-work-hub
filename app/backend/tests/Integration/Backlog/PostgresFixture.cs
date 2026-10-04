using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace Integration.Backlog;

/// <summary>
/// Un único contenedor PostgreSQL por suite (ICollectionFixture). Cada prueba obtiene su propia base de datos
/// vacía dentro del mismo contenedor, de modo que no hay estado compartido ni un arranque de contenedor por prueba.
/// </summary>
public sealed class PostgresFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder().WithImage("postgres:16-alpine").Build();

    public Task InitializeAsync() => _postgres.StartAsync();

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

[CollectionDefinition(Name)]
public sealed class PostgresCollection : ICollectionFixture<PostgresFixture>
{
    public const string Name = "postgres";
}
