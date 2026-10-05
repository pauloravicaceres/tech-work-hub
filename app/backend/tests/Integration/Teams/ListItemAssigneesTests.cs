using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / US2 — GET /api/backlog-items/{itemId}/assignees (escenarios 4 y 5).</summary>
[Collection(PostgresCollection.Name)]
public class ListItemAssigneesTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public ListItemAssigneesTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Listar_ConDosResponsables_DebeResponder200ConExactamenteAnaYLuis()
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var luis = await _api.SeedMemberAsync("Luis Rojas", TechnicalRoleSeed.QaId);
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, item, ana, DateTime.UtcNow.AddMinutes(-2));
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, item, luis, DateTime.UtcNow.AddMinutes(-1));
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, Guid.NewGuid(), ana);
        var before = await _api.StoredAssignmentsAsync();

        var response = await _api.AuthenticatedClient().GetAsync(ItemAssignmentsSupport.AssigneesRoute(item));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        body.Select(e => (e.GetProperty("id").GetGuid(), e.GetProperty("name").GetString(), e.GetProperty("role").GetString()))
            .Should().Equal((ana, "Ana Torres", "Desarrollo"), (luis, "Luis Rojas", "QA"));
        body.Should().OnlyContain(e => e.EnumerateObject().Count() == 3);
        (await _api.StoredAssignmentsAsync()).Should().BeEquivalentTo(before); // FR-008: solo lectura
    }

    [Fact]
    public async Task Listar_ElementoSinResponsablesOInexistente_DebeResponder200ConColeccionVacia()
    {
        var item = _api.Items.Add();

        var empty = await _api.AuthenticatedClient().GetAsync(ItemAssignmentsSupport.AssigneesRoute(item));
        var unknown = await _api.AuthenticatedClient().GetAsync(ItemAssignmentsSupport.AssigneesRoute(Guid.NewGuid()));

        empty.StatusCode.Should().Be(HttpStatusCode.OK);
        (await empty.Content.ReadAsStringAsync()).Should().Be("[]");
        unknown.StatusCode.Should().Be(HttpStatusCode.OK);
        (await unknown.Content.ReadAsStringAsync()).Should().Be("[]");
    }

    [Fact]
    public async Task Listar_ConElementoMalformado_NoDebeEnrutar()
    {
        var response = await _api.AuthenticatedClient().GetAsync("/api/backlog-items/no-es-guid/assignees");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
