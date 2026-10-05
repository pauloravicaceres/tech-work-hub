using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Shared;
using Teams;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 — la migración InitialTeamsSchema y sus restricciones sobre PostgreSQL real (Testcontainers).</summary>
[Collection(PostgresCollection.Name)]
public sealed class TeamsMigrationTests(PostgresFixture postgres)
{
    private const string UniqueViolation = "23505";
    private const string ForeignKeyViolation = "23503";

    private async Task<string> MigratedDatabaseAsync()
    {
        var connectionString = await postgres.CreateDatabaseAsync();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ConnectionStrings:{TeamsModule.ConnectionStringName}"] = connectionString
            })
            .Build();
        var services = new ServiceCollection();
        services.AddSharedInfrastructure();
        services.AddTeamsModule(configuration);
        await using var provider = services.BuildServiceProvider();
        await provider.MigrateTeamsModuleAsync();
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
    public async Task Migracion_DebeCrearSoloObjetosDelSchemaTeams()
    {
        var connectionString = await MigratedDatabaseAsync();

        (await TablesAsync(connectionString, "teams")).Should().BeEquivalentTo(["TechnicalRoles", "TeamMembers", "ItemAssignments", "__EFMigrationsHistory"]);
        foreach (var other in new[] { "backlog", "sprints", "application" })
        {
            (await TablesAsync(connectionString, other)).Should().BeEmpty($"el schema {other} no debe cambiar");
        }
    }

    [Fact]
    public async Task Migracion_DebeSembrarExactamenteDesarrolloYQaConSusGuidFijos()
    {
        var connectionString = await MigratedDatabaseAsync();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand("SELECT \"Id\", \"Name\" FROM teams.\"TechnicalRoles\" ORDER BY \"Name\"", connection);
        await using var reader = await command.ExecuteReaderAsync();
        var roles = new List<(Guid Id, string Name)>();
        while (await reader.ReadAsync()) roles.Add((reader.GetGuid(0), reader.GetString(1)));

        roles.Should().Equal(
            (TechnicalRoleSeed.DevelopmentId, TechnicalRoleSeed.DevelopmentName),
            (TechnicalRoleSeed.QaId, TechnicalRoleSeed.QaName));
    }

    [Fact]
    public async Task Insercion_ConNombreDeRolRepetido_DebeViolarElIndiceUnico()
    {
        var connectionString = await MigratedDatabaseAsync();
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(
            "INSERT INTO teams.\"TechnicalRoles\" (\"Id\", \"Name\") VALUES (@id, 'QA')", connection);
        command.Parameters.AddWithValue("id", Guid.NewGuid());

        var act = () => command.ExecuteNonQueryAsync();

        (await act.Should().ThrowAsync<PostgresException>()).Which.SqlState.Should().Be(UniqueViolation);
    }

    [Fact]
    public async Task Insercion_ConRolInexistente_DebeViolarLaClaveForanea()
    {
        var connectionString = await MigratedDatabaseAsync();

        var act = () => TeamsSql.InsertMemberAsync(connectionString, "Ana", Guid.NewGuid());

        (await act.Should().ThrowAsync<PostgresException>()).Which.SqlState.Should().Be(ForeignKeyViolation);
    }

    [Fact]
    public async Task Insercion_ConNombresRepetidos_DebePermitirseSinUnicidad()
    {
        var connectionString = await MigratedDatabaseAsync();

        await TeamsSql.InsertMemberAsync(connectionString, "Ana", TechnicalRoleSeed.QaId);
        var act = () => TeamsSql.InsertMemberAsync(connectionString, "Ana", TechnicalRoleSeed.QaId);

        await act.Should().NotThrowAsync();
    }
}
