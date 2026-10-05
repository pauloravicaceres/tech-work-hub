using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 / FR-014, SC-006 — registrar un miembro no altera backlog ni Sprints.</summary>
[Collection(PostgresCollection.Name)]
public class RegisterTeamMemberNoRegressionTests : IDisposable
{
    private static readonly string[] OtherTables =
    [
        "backlog.\"BacklogItems\"",
        "sprints.\"Sprints\"",
        "sprints.\"SprintItems\"",
    ];

    private readonly TeamsApiFactory _api;

    public RegisterTeamMemberNoRegressionTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Registrar_NoDebeAlterarLasTablasDeBacklogNiSprints()
    {
        var before = new List<long>();
        foreach (var table in OtherTables) before.Add(await _api.CountAsync(table));

        var response = await _api.AuthenticatedClient().PostAsJsonAsync("/api/team-members", new { name = "Ana", role = "QA" });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var after = new List<long>();
        foreach (var table in OtherTables) after.Add(await _api.CountAsync(table));
        after.Should().Equal(before);
    }
}
