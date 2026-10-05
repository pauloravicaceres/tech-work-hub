using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / US3 — GET /api/team-members/{memberId}/items (escenario 6).</summary>
[Collection(PostgresCollection.Name)]
public class ListMemberItemsTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public ListMemberItemsTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Listar_ConDosElementos_DebeResponder200ConExactamenteItem101EItem102EnUnaSolaLlamadaDeLote()
    {
        var item101 = _api.Items.Add("item-101", "UserStory");
        var item102 = _api.Items.Add("item-102", "Bug");
        var other = _api.Items.Add("item-103");
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var luis = await _api.SeedMemberAsync("Luis Rojas", TechnicalRoleSeed.QaId);
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, item101, ana, DateTime.UtcNow.AddMinutes(-2));
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, item102, ana, DateTime.UtcNow.AddMinutes(-1));
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, other, luis);
        var before = await _api.StoredAssignmentsAsync();

        var response = await _api.AuthenticatedClient().GetAsync($"/api/team-members/{ana}/items");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        body.Select(e => (e.GetProperty("id").GetGuid(), e.GetProperty("title").GetString(), e.GetProperty("type").GetString()))
            .Should().Equal((item101, "item-101", "UserStory"), (item102, "item-102", "Bug"));
        body.Should().OnlyContain(e => e.EnumerateObject().Count() == 3);
        _api.Items.GetItemsCalls.Should().Be(1);
        (await _api.StoredAssignmentsAsync()).Should().BeEquivalentTo(before); // FR-008: solo lectura
    }

    [Fact]
    public async Task Listar_MiembroSinElementos_DebeResponder200VacioSinLlamarAlContrato()
    {
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);

        var response = await _api.AuthenticatedClient().GetAsync($"/api/team-members/{ana}/items");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadAsStringAsync()).Should().Be("[]");
        _api.Items.GetItemsCalls.Should().Be(0);
    }

    [Fact]
    public async Task Listar_ConUnElementoQueYaNoExisteEnBacklog_DebeOmitirloSinInventarTitulo()
    {
        var kept = _api.Items.Add("item-101");
        var gone = _api.Items.Add("item-fantasma");
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, kept, ana, DateTime.UtcNow.AddMinutes(-2));
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, gone, ana, DateTime.UtcNow.AddMinutes(-1));
        _api.Items.Remove(gone);

        var response = await _api.AuthenticatedClient().GetAsync($"/api/team-members/{ana}/items");

        var body = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        body.Should().ContainSingle().Which.GetProperty("id").GetGuid().Should().Be(kept);
    }
}
