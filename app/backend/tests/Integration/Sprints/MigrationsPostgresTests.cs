using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Shared;
using Sprints;
using Sprints.Data;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-003 / FR-015 (ventana del Sprint) y HU-004 / FR-017 (unicidad de la asignación por elemento) — la migración Code-First y la restricción CK_Sprints_Window sobre PostgreSQL real (Testcontainers).</summary>
[Collection(PostgresCollection.Name)]
public sealed class MigrationsPostgresTests(PostgresFixture postgres)
{
    private const string CheckViolation = "23514";
    private static readonly DateOnly Start = new(2026, 10, 5);

    private static ServiceProvider BuildServices(string connectionString)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ConnectionStrings:{SprintsModule.ConnectionStringName}"] = connectionString
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSharedInfrastructure();
        services.AddSprintsModule(configuration);
        return services.BuildServiceProvider();
    }

    private static async Task<List<string>> SprintsTablesAsync(string connectionString)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT table_schema || '.' || table_name FROM information_schema.tables WHERE table_schema = 'sprints'", connection);
        await using var reader = await command.ExecuteReaderAsync();
        var tables = new List<string>();
        while (await reader.ReadAsync()) tables.Add(reader.GetString(0));
        return tables;
    }

    private async Task<string> MigratedDatabaseAsync()
    {
        var connectionString = await postgres.CreateDatabaseAsync();
        await using var provider = BuildServices(connectionString);
        await provider.MigrateSprintsModuleAsync();
        return connectionString;
    }

    [Fact]
    public async Task Migracion_SobrePostgresVacio_DebeCrearElSchemaSprintsConSuTablaEHistorial()
    {
        // Act
        var connectionString = await MigratedDatabaseAsync();

        // Assert
        (await SprintsTablesAsync(connectionString)).Should().BeEquivalentTo(["sprints.Sprints", "sprints.SprintItems", "sprints.__EFMigrationsHistory"]);
    }

    [Fact]
    public async Task Migracion_AplicadaDosVeces_DebeSerIdempotenteYSinCambiosPendientes()
    {
        // Arrange
        var connectionString = await postgres.CreateDatabaseAsync();
        await using var provider = BuildServices(connectionString);
        await provider.MigrateSprintsModuleAsync();

        // Act
        var act = () => provider.MigrateSprintsModuleAsync();

        // Assert
        await act.Should().NotThrowAsync();
        await using var scope = provider.CreateAsyncScope();
        var pending = await scope.ServiceProvider.GetRequiredService<SprintsDbContext>().Database.GetPendingMigrationsAsync();
        pending.Should().BeEmpty();
    }

    [Theory]
    [InlineData(12)] // ventana de 13 días
    [InlineData(14)] // ventana de 15 días
    [InlineData(6)]  // ventana de 7 días
    [InlineData(0)]  // fin = inicio
    [InlineData(-3)] // fin < inicio
    public async Task Insercion_ConVentanaDistintaDe14Dias_DebeSerRechazadaPorLaRestriccionCheck(int endOffsetDays)
    {
        // Arrange
        var connectionString = await MigratedDatabaseAsync();

        // Act
        var act = () => SprintsSql.InsertAsync(connectionString, "Sprint", Start, Start.AddDays(endOffsetDays));

        // Assert
        var ex = await act.Should().ThrowAsync<PostgresException>();
        ex.Which.SqlState.Should().Be(CheckViolation);
        ex.Which.ConstraintName.Should().Be("CK_Sprints_Window");
    }

    [Fact]
    public async Task Insercion_ConVentanaDe14Dias_DebeAceptarse()
    {
        // Arrange
        var connectionString = await MigratedDatabaseAsync();

        // Act
        var id = await SprintsSql.InsertAsync(connectionString, "Sprint", Start, Start.AddDays(13));

        // Assert
        id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task Insercion_ConIdentificacionRepetida_DebeAceptarse()
    {
        // Arrange (ADR-006: sin índice único sobre Identification)
        var connectionString = await MigratedDatabaseAsync();
        await SprintsSql.InsertAsync(connectionString, "Sprint", Start, Start.AddDays(13));

        // Act
        var act = () => SprintsSql.InsertAsync(connectionString, "Sprint", Start, Start.AddDays(13));

        // Assert
        await act.Should().NotThrowAsync();
    }
}
