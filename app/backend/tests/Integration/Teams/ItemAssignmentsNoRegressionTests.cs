using System.Net;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / FR-013, FR-014, escenario 13 — asignar no altera backlog, Sprints, miembros ni roles.</summary>
[Collection(PostgresCollection.Name)]
public class ItemAssignmentsNoRegressionTests : IDisposable
{
    private static readonly string[] OtherTables =
    [
        "backlog.\"BacklogItems\"",
        "sprints.\"Sprints\"",
        "sprints.\"SprintItems\"",
        "teams.\"TeamMembers\"",
        "teams.\"TechnicalRoles\"",
    ];

    private readonly TeamsApiFactory _api;

    public ItemAssignmentsNoRegressionTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Asignar_NoDebeAlterarLasTablasDeBacklogSprintsMiembrosNiRoles()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var before = new List<long>();
        foreach (var table in OtherTables) before.Add(await _api.CountAsync(table));
        var client = _api.AuthenticatedClient();

        var created = await client.AssignAsync(item, ana);
        var repeated = await client.AssignAsync(item, ana);
        await client.GetAsync(ItemAssignmentsSupport.AssigneesRoute(item));
        await client.GetAsync($"/api/team-members/{ana}/items");

        created.StatusCode.Should().Be(HttpStatusCode.Created);
        repeated.StatusCode.Should().Be(HttpStatusCode.OK);
        var after = new List<long>();
        foreach (var table in OtherTables) after.Add(await _api.CountAsync(table));
        after.Should().Equal(before);
        (await _api.StoredMembersAsync()).Should().ContainSingle().Which.TechnicalRoleId.Should().Be(TechnicalRoleSeed.DevelopmentId);
    }
}
