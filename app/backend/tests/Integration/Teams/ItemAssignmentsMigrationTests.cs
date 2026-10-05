using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Shared;
using Teams;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 — la migración AddItemAssignments y sus restricciones sobre PostgreSQL real (Testcontainers).</summary>
[Collection(PostgresCollection.Name)]
public sealed class ItemAssignmentsMigrationTests(PostgresFixture postgres)
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

    private static async Task<List<string>> ScalarListAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();
        var values = new List<string>();
        while (await reader.ReadAsync()) values.Add(reader.GetString(0));
        return values;
    }

    [Fact]
    public async Task Migracion_DebeCrearLaTablaYLosDosIndicesSinTocarOtrosSchemas()
    {
        var connectionString = await MigratedDatabaseAsync();

        (await ScalarListAsync(connectionString,
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'teams'"))
            .Should().BeEquivalentTo(["TechnicalRoles", "TeamMembers", "ItemAssignments", "__EFMigrationsHistory"]);
        (await ScalarListAsync(connectionString,
                "SELECT indexname FROM pg_indexes WHERE schemaname = 'teams' AND tablename = 'ItemAssignments'"))
            .Should().Contain([ItemAssignmentRules.PairUniqueIndexName, ItemAssignmentRules.MemberIdIndexName]);
        foreach (var other in new[] { "backlog", "sprints", "application" })
        {
            (await ScalarListAsync(connectionString,
                    $"SELECT table_name FROM information_schema.tables WHERE table_schema = '{other}'"))
                .Should().BeEmpty($"el schema {other} no debe cambiar");
        }
    }

    [Fact]
    public async Task Insercion_ConElMismoParItemMiembro_DebeViolarElIndiceUnico()
    {
        var connectionString = await MigratedDatabaseAsync();
        var member = await TeamsSql.InsertMemberAsync(connectionString, "Ana", TechnicalRoleSeed.DevelopmentId);
        var item = Guid.NewGuid();
        await ItemAssignmentsSupport.InsertAssignmentAsync(connectionString, item, member);

        var act = () => ItemAssignmentsSupport.InsertAssignmentAsync(connectionString, item, member);

        var ex = (await act.Should().ThrowAsync<PostgresException>()).Which;
        ex.SqlState.Should().Be(UniqueViolation);
        ex.ConstraintName.Should().Be(ItemAssignmentRules.PairUniqueIndexName);
    }

    [Fact]
    public async Task Insercion_MismoElementoConOtroMiembroYMismoMiembroConOtroElemento_DebePermitirse()
    {
        var connectionString = await MigratedDatabaseAsync();
        var ana = await TeamsSql.InsertMemberAsync(connectionString, "Ana", TechnicalRoleSeed.DevelopmentId);
        var luis = await TeamsSql.InsertMemberAsync(connectionString, "Luis", TechnicalRoleSeed.QaId);
        var item = Guid.NewGuid();

        await ItemAssignmentsSupport.InsertAssignmentAsync(connectionString, item, ana);
        var otherMember = () => ItemAssignmentsSupport.InsertAssignmentAsync(connectionString, item, luis);
        var otherItem = () => ItemAssignmentsSupport.InsertAssignmentAsync(connectionString, Guid.NewGuid(), ana);

        await otherMember.Should().NotThrowAsync();
        await otherItem.Should().NotThrowAsync();
    }

    [Fact]
    public async Task Insercion_ConMiembroInexistente_DebeViolarLaClaveForanea()
    {
        var connectionString = await MigratedDatabaseAsync();

        var act = () => ItemAssignmentsSupport.InsertAssignmentAsync(connectionString, Guid.NewGuid(), Guid.NewGuid());

        (await act.Should().ThrowAsync<PostgresException>()).Which.SqlState.Should().Be(ForeignKeyViolation);
    }
}
