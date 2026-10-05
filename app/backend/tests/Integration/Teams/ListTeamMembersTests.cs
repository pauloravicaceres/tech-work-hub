using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 / US2 — consulta de miembros sobre el host real.</summary>
[Collection(PostgresCollection.Name)]
public class ListTeamMembersTests : IDisposable
{
    private const string Route = "/api/team-members";

    private readonly TeamsApiFactory _api;

    public ListTeamMembersTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Listar_SinMiembros_DebeResponder200ConListaVacia()
    {
        var response = await _api.AuthenticatedClient().GetAsync(Route);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task Listar_ConDosMiembros_DebeDevolverExactamenteIdNombreYRol()
    {
        var ana = await _api.SeedMemberAsync("Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var luis = await _api.SeedMemberAsync("Luis Rojas", TechnicalRoleSeed.QaId);

        var response = await _api.AuthenticatedClient().GetAsync(Route);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        items.Should().HaveCount(2);
        items.SelectMany(i => i.EnumerateObject().Select(p => p.Name)).Distinct().Should().BeEquivalentTo("id", "name", "role");
        items.Select(i => (i.GetProperty("id").GetGuid(), i.GetProperty("name").GetString(), i.GetProperty("role").GetString()))
            .Should().BeEquivalentTo(new[]
            {
                (ana, "Ana Torres", "Desarrollo"),
                (luis, "Luis Rojas", "QA"),
            });
    }

    [Fact]
    public async Task Listar_NoDebeModificarDatos()
    {
        await _api.SeedMemberAsync("Ana", TechnicalRoleSeed.QaId);
        var before = await _api.CountAsync("teams.\"TeamMembers\"");

        await _api.AuthenticatedClient().GetAsync(Route);

        (await _api.CountAsync("teams.\"TeamMembers\"")).Should().Be(before);
    }

    [Fact]
    public async Task Listar_ConCienMiembros_DebeResponderEnMenosDeDosSegundos()
    {
        for (var i = 0; i < 100; i++) await _api.SeedMemberAsync($"Miembro {i}", TechnicalRoleSeed.DevelopmentId);
        var client = _api.AuthenticatedClient();
        await client.GetAsync(Route); // calienta el host

        var watch = Stopwatch.StartNew();
        var response = await client.GetAsync(Route);
        watch.Stop();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(100);
        watch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(2));
    }
}
