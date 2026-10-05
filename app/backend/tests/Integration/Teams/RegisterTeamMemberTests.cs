using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 / US1 — alta de miembros sobre el host real.</summary>
[Collection(PostgresCollection.Name)]
public class RegisterTeamMemberTests : IDisposable
{
    private const string Route = "/api/team-members";

    private readonly TeamsApiFactory _api;

    public RegisterTeamMemberTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Theory]
    [InlineData("Ana Torres", "Desarrollo")]
    [InlineData("Luis Rojas", "QA")]
    public async Task Registrar_ConRolDelCatalogo_DebeResponder201ConIdNombreYRol(string name, string role)
    {
        var response = await _api.AuthenticatedClient().PostAsJsonAsync(Route, new { name, role });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("id").GetGuid().Should().NotBe(Guid.Empty);
        body.GetProperty("name").GetString().Should().Be(name);
        body.GetProperty("role").GetString().Should().Be(role);
        body.EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo("id", "name", "role");
        response.Headers.Location!.ToString().Should().Be(Route);
    }

    [Fact]
    public async Task Registrar_DebePersistirAuditoriaDesdeElClaimNuncaDelCuerpo()
    {
        var before = DateTime.UtcNow.AddSeconds(-5);

        var response = await _api.AuthenticatedClient()
            .PostAsJsonAsync(Route, new { name = "Ana Torres", role = "Desarrollo", createdBy = "intruso" });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var stored = (await _api.StoredMembersAsync()).Should().ContainSingle().Subject;
        stored.CreatedBy.Should().Be(TestAuthHandler.UserId);
        stored.CreatedAt.Should().BeAfter(before).And.BeBefore(DateTime.UtcNow.AddSeconds(5));
        stored.TechnicalRoleId.Should().Be(TechnicalRoleSeed.DevelopmentId);
    }

    [Fact]
    public async Task Registrar_ConNombreConEspacios_DebeGuardarloRecortado()
    {
        var response = await _api.AuthenticatedClient().PostAsJsonAsync(Route, new { name = "  Ana Torres  ", role = "QA" });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("name").GetString().Should().Be("Ana Torres");
        (await _api.StoredMembersAsync()).Should().ContainSingle().Which.Name.Should().Be("Ana Torres");
    }

    [Fact]
    public async Task Registrar_DosVecesElMismoNombre_DebeCrearAmbosMiembros()
    {
        var client = _api.AuthenticatedClient();

        var first = await client.PostAsJsonAsync(Route, new { name = "Ana", role = "QA" });
        var second = await client.PostAsJsonAsync(Route, new { name = "Ana", role = "QA" });

        first.StatusCode.Should().Be(HttpStatusCode.Created);
        second.StatusCode.Should().Be(HttpStatusCode.Created);
        (await _api.StoredMembersAsync()).Select(m => m.Id).Should().OnlyHaveUniqueItems().And.HaveCount(2);
    }

    [Fact]
    public async Task Registrar_ConNombreMuyLargo_NoDebeRechazarlo()
    {
        var response = await _api.AuthenticatedClient().PostAsJsonAsync(Route, new { name = new string('a', 5000), role = "QA" });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
