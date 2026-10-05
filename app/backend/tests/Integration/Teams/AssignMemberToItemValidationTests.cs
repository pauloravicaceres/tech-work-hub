using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / US4 — 400 por campo y 404 distinguiendo miembro de elemento, sin persistir nada (escenarios 7 y 8).</summary>
[Collection(PostgresCollection.Name)]
public class AssignMemberToItemValidationTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public AssignMemberToItemValidationTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private static async Task<JsonElement> ProblemAsync(HttpResponseMessage response)
    {
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        return await response.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("no-es-un-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public async Task Asignar_ConMiembroAusenteOMalformado_DebeResponder400ConErrorEnMemberId(string? memberId)
    {
        var item = _api.Items.Add();

        var response = await _api.AuthenticatedClient()
            .PostAsJsonAsync(ItemAssignmentsSupport.AssigneesRoute(item), new { memberId });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ProblemAsync(response)).GetProperty("errors").TryGetProperty(ItemAssignmentRules.MemberIdField, out _).Should().BeTrue();
        (await _api.StoredAssignmentsAsync()).Should().BeEmpty();
    }

    [Theory]
    [InlineData("no-es-un-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public async Task Asignar_ConElementoMalformadoOVacio_DebeResponder400ConErrorEnItemId(string itemId)
    {
        var ana = await _api.SeedMemberAsync("Ana", TechnicalRoleSeed.DevelopmentId);

        var response = await _api.AuthenticatedClient()
            .PostAsJsonAsync($"/api/backlog-items/{itemId}/assignees", new { memberId = ana });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        (await ProblemAsync(response)).GetProperty("errors").TryGetProperty(ItemAssignmentRules.ItemIdField, out _).Should().BeTrue();
        (await _api.StoredAssignmentsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_ConMiembroInexistente_DebeResponder404ConMensajeDeMiembro()
    {
        var item = _api.Items.Add();

        var response = await _api.AuthenticatedClient().AssignAsync(item, Guid.NewGuid());

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await ProblemAsync(response)).GetProperty("detail").GetString().Should().Be(ItemAssignmentRules.MemberNotFoundMessage);
        (await _api.StoredAssignmentsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_ConElementoInexistente_DebeResponder404ConMensajeDeElemento()
    {
        var ana = await _api.SeedMemberAsync("Ana", TechnicalRoleSeed.DevelopmentId);

        var response = await _api.AuthenticatedClient().AssignAsync(Guid.NewGuid(), ana);

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await ProblemAsync(response)).GetProperty("detail").GetString().Should().Be(ItemAssignmentRules.ItemNotFoundMessage);
        (await _api.StoredAssignmentsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_ConAmbosInexistentes_DebeGanarElMensajeDeMiembro()
    {
        var response = await _api.AuthenticatedClient().AssignAsync(Guid.NewGuid(), Guid.NewGuid());

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await ProblemAsync(response)).GetProperty("detail").GetString().Should().Be(ItemAssignmentRules.MemberNotFoundMessage);
        (await _api.StoredAssignmentsAsync()).Should().BeEmpty();
    }
}
