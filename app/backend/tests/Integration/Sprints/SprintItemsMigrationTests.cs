using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Shared;
using Sprints;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-004 — la migración AddSprintItems y sus restricciones sobre PostgreSQL real (Testcontainers).</summary>
[Collection(PostgresCollection.Name)]
public sealed class SprintItemsMigrationTests(PostgresFixture postgres)
{
    private const string UniqueViolation = "23505";
    private const string ForeignKeyViolation = "23503";
    private static readonly DateOnly Start = new(2026, 10, 5);

    private async Task<string> MigratedDatabaseAsync()
    {
        var connectionString = await postgres.CreateDatabaseAsync();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ConnectionStrings:{SprintsModule.ConnectionStringName}"] = connectionString
            })
            .Build();
        var services = new ServiceCollection();
        services.AddSharedInfrastructure();
        services.AddSprintsModule(configuration);
        await using var provider = services.BuildServiceProvider();
        await provider.MigrateSprintsModuleAsync();
        return connectionString;
    }

    private static async Task<List<string>> TablesAsync(string connectionString, string schema)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = @schema", connection);
        command.Parameters.AddWithValue("schema", schema);
        await using var reader = await command.ExecuteReaderAsync();
        var tables = new List<string>();
        while (await reader.ReadAsync()) tables.Add(reader.GetString(0));
        return tables;
    }

    [Fact]
    public async Task Migracion_DebeCrearSprintItemsSinTocarLosSchemasBacklogNiApplication()
    {
        // Act
        var connectionString = await MigratedDatabaseAsync();

        // Assert
        (await TablesAsync(connectionString, "sprints")).Should().BeEquivalentTo(["Sprints", "SprintItems", "__EFMigrationsHistory"]);
        (await TablesAsync(connectionString, "backlog")).Should().BeEmpty();
        (await TablesAsync(connectionString, "application")).Should().BeEmpty();
    }

    [Fact]
    public async Task Insercion_ConItemIdRepetido_DebeViolarElIndiceUnicoAunConOtroSprint()
    {
        // Arrange
        var connectionString = await MigratedDatabaseAsync();
        var first = await SprintsSql.InsertAsync(connectionString, "Uno", Start, Start.AddDays(13));
        var second = await SprintsSql.InsertAsync(connectionString, "Dos", Start.AddDays(14), Start.AddDays(27));
        var itemId = Guid.NewGuid();
        await SprintsSql.InsertSprintItemAsync(connectionString, first, itemId);

        // Act
        var act = () => SprintsSql.InsertSprintItemAsync(connectionString, second, itemId);

        // Assert
        var ex = await act.Should().ThrowAsync<PostgresException>();
        ex.Which.SqlState.Should().Be(UniqueViolation);
        ex.Which.ConstraintName.Should().Be("UX_SprintItems_ItemId");
    }

    [Fact]
    public async Task Insercion_ConSprintInexistente_DebeViolarLaClaveForanea()
    {
        // Arrange
        var connectionString = await MigratedDatabaseAsync();

        // Act
        var act = () => SprintsSql.InsertSprintItemAsync(connectionString, Guid.NewGuid(), Guid.NewGuid());

        // Assert
        (await act.Should().ThrowAsync<PostgresException>()).Which.SqlState.Should().Be(ForeignKeyViolation);
    }

    [Fact]
    public async Task Insercion_ConItemIdSinFilaEnBacklog_DebeAceptarse()
    {
        // Arrange (ItemId no tiene FK: la existencia la verifica el contrato in-process)
        var connectionString = await MigratedDatabaseAsync();
        var sprint = await SprintsSql.InsertAsync(connectionString, "Sprint", Start, Start.AddDays(13));

        // Act
        var act = () => SprintsSql.InsertSprintItemAsync(connectionString, sprint, Guid.NewGuid());

        // Assert
        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Insercion_DeVariosElementosEnElMismoSprint_DebeAceptarse()
    {
        // Arrange
        var connectionString = await MigratedDatabaseAsync();
        var sprint = await SprintsSql.InsertAsync(connectionString, "Sprint", Start, Start.AddDays(13));
        await SprintsSql.InsertSprintItemAsync(connectionString, sprint, Guid.NewGuid());

        // Act
        var act = () => SprintsSql.InsertSprintItemAsync(connectionString, sprint, Guid.NewGuid());

        // Assert
        await act.Should().NotThrowAsync();
    }
}
