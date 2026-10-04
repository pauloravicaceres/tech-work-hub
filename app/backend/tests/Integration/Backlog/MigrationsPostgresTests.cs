using Application;
using Backlog;
using Backlog.Data;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Shared;
using Xunit;

namespace Integration.Backlog;

/// <summary>#18 — las migraciones Code-First de ambos módulos se aplican sobre PostgreSQL real (Testcontainers).</summary>
[Collection(PostgresCollection.Name)]
public sealed class MigrationsPostgresTests(PostgresFixture postgres)
{

    private string _connectionString = null!;

    private ServiceProvider BuildServices()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ConnectionStrings:{BacklogModule.ConnectionStringName}"] = _connectionString
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSharedInfrastructure();
        services.AddBacklogModule(configuration);
        services.AddApplicationModule(configuration);
        return services.BuildServiceProvider();
    }

    private async Task<List<string>> TablesAsync()
    {
        await using var connection = new NpgsqlConnection(_connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT table_schema || '.' || table_name FROM information_schema.tables WHERE table_schema IN ('backlog','application')",
            connection);
        await using var reader = await command.ExecuteReaderAsync();
        var tables = new List<string>();
        while (await reader.ReadAsync()) tables.Add(reader.GetString(0));
        return tables;
    }

    [Fact]
    public async Task Migraciones_SobrePostgresVacio_DebenCrearLosSchemasYTablasDeCadaModulo()
    {
        // Arrange
        _connectionString = await postgres.CreateDatabaseAsync();
        await using var provider = BuildServices();

        // Act
        await provider.MigrateApplicationModuleAsync();
        await provider.MigrateBacklogModuleAsync();

        // Assert
        var tables = await TablesAsync();
        tables.Should().Contain(["backlog.BacklogItems", "backlog.__EFMigrationsHistory", "application.Applications", "application.__EFMigrationsHistory"]);
    }

    [Fact]
    public async Task Migraciones_AplicadasDosVeces_DebenSerIdempotentesYSinCambiosPendientes()
    {
        // Arrange
        _connectionString = await postgres.CreateDatabaseAsync();
        await using var provider = BuildServices();
        await provider.MigrateBacklogModuleAsync();

        // Act
        var act = () => provider.MigrateBacklogModuleAsync();

        // Assert
        await act.Should().NotThrowAsync();
        await using var scope = provider.CreateAsyncScope();
        var pending = await scope.ServiceProvider.GetRequiredService<BacklogDbContext>().Database.GetPendingMigrationsAsync();
        pending.Should().BeEmpty();
    }
}
