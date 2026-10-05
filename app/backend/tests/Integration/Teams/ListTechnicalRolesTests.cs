using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 / US3 — catálogo de roles de solo lectura.</summary>
[Collection(PostgresCollection.Name)]
public class ListTechnicalRolesTests : IDisposable
{
    private const string Route = "/api/technical-roles";

    private readonly TeamsApiFactory _api;

    public ListTechnicalRolesTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Listar_DebeDevolverDesarrolloYQaConSusIdentificadoresFijos()
    {
        var watch = Stopwatch.StartNew();
        var response = await _api.AuthenticatedClient().GetAsync(Route);
        watch.Stop();

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        items.Select(i => (i.GetProperty("id").GetGuid(), i.GetProperty("name").GetString())).Should().Equal(
            (TechnicalRoleSeed.DevelopmentId, "Desarrollo"),
            (TechnicalRoleSeed.QaId, "QA"));
        items.SelectMany(i => i.EnumerateObject().Select(p => p.Name)).Distinct().Should().BeEquivalentTo("id", "name");
        watch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(10), "incluye el arranque del host");
    }

    [Fact]
    public async Task Listar_NoDebeModificarElCatalogo()
    {
        await _api.AuthenticatedClient().GetAsync(Route);

        (await _api.CountAsync("teams.\"TechnicalRoles\"")).Should().Be(2);
    }

    [Theory]
    [InlineData("POST")]
    [InlineData("PUT")]
    [InlineData("DELETE")]
    public async Task NoDebeExistirAltaEdicionNiBorradoDeRoles(string method)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), Route) { Content = JsonContent.Create(new { name = "Chef" }) };

        var response = await _api.AuthenticatedClient().SendAsync(request);

        response.StatusCode.Should().BeOneOf(HttpStatusCode.NotFound, HttpStatusCode.MethodNotAllowed);
        (await _api.CountAsync("teams.\"TechnicalRoles\"")).Should().Be(2);
    }
}
