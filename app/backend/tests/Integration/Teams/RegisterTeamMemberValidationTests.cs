using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.TeamMembers;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 / US4 — todo rechazo es 400 problem+json y no persiste nada.</summary>
[Collection(PostgresCollection.Name)]
public class RegisterTeamMemberValidationTests : IDisposable
{
    private const string Route = "/api/team-members";

    private readonly TeamsApiFactory _api;

    public RegisterTeamMemberValidationTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private static StringContent Json(string body) => new(body, Encoding.UTF8, "application/json");

    private async Task<string[]> AssertBadRequestAsync(string body, string field)
    {
        var response = await _api.AuthenticatedClient().PostAsync(Route, Json(body));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("status").GetInt32().Should().Be(400);
        problem.TryGetProperty("errors", out var errors).Should().BeTrue("todo 400 incluye errors{}");
        errors.TryGetProperty(field, out var messages).Should().BeTrue($"errors debe incluir la clave '{field}'");
        (await _api.StoredMembersAsync()).Should().BeEmpty("un rechazo nunca persiste un miembro");
        return messages.EnumerateArray().Select(m => m.GetString()!).ToArray();
    }

    [Fact]
    public async Task Registrar_ConRolInexistente_DebeResponder400ConElMensajeDelRol()
    {
        var messages = await AssertBadRequestAsync("""{"name":"Ana","role":"Chef"}""", TeamMemberRules.RoleField);

        messages.Should().ContainSingle().Which.Should().Be("El rol indicado no es válido.");
    }

    [Fact]
    public async Task Registrar_ConRolEnOtraCapitalizacion_DebeResponder400()
    {
        await AssertBadRequestAsync("""{"name":"Ana","role":"qa"}""", TeamMemberRules.RoleField);
    }

    [Theory]
    [InlineData("""{"role":"QA"}""")]
    [InlineData("""{"name":"   ","role":"QA"}""")]
    [InlineData("""{"name":"","role":"QA"}""")]
    public async Task Registrar_ConNombreAusenteOVacio_DebeResponder400SobreName(string body)
    {
        await AssertBadRequestAsync(body, TeamMemberRules.NameField);
    }

    [Theory]
    [InlineData("""{"name":"Ana"}""")]
    [InlineData("""{"name":"Ana","role":"   "}""")]
    [InlineData("""{"name":"Ana","role":""}""")]
    public async Task Registrar_ConRolAusenteOVacio_DebeResponder400SobreRole(string body)
    {
        await AssertBadRequestAsync(body, TeamMemberRules.RoleField);
    }

    [Fact]
    public async Task Registrar_ConNombreInvalidoYRolInexistente_DebeGanarElValidador()
    {
        // El validador corta antes de consultar el catálogo: solo se reporta el nombre.
        var response = await _api.AuthenticatedClient().PostAsync(Route, Json("""{"name":"  ","role":"Chef"}"""));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var errors = (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("errors");
        errors.TryGetProperty(TeamMemberRules.NameField, out _).Should().BeTrue();
        (await _api.StoredMembersAsync()).Should().BeEmpty();
    }
}
