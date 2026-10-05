using System.Net;
using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-015 / US5 — las tres operaciones responden 401 sin credenciales válidas y sin leer ni escribir (escenario 9).</summary>
[Collection(PostgresCollection.Name)]
public class ItemAssignmentsAuthTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public ItemAssignmentsAuthTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private HttpClient ClientWith(string? authorization)
    {
        var client = _api.AnonymousClient();
        if (authorization is not null) client.DefaultRequestHeaders.Add("Authorization", authorization);
        return client;
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Bearer invalid-or-expired")]
    [InlineData(TestAuthHandler.NoSubjectToken)]
    public async Task Asignar_SinCredencialesValidas_DebeResponder401SinEscribir(string? authorization)
    {
        var item = _api.Items.Add();
        var ana = await _api.SeedMemberAsync("Ana", TechnicalRoleSeed.DevelopmentId);

        var response = await ClientWith(authorization).AssignAsync(item, ana);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredAssignmentsAsync()).Should().BeEmpty();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Bearer invalid-or-expired")]
    public async Task Consultar_SinCredencialesValidas_DebeResponder401SinLeerElContrato(string? authorization)
    {
        var ana = await _api.SeedMemberAsync("Ana", TechnicalRoleSeed.DevelopmentId);
        var item = _api.Items.Add();
        await ItemAssignmentsSupport.InsertAssignmentAsync(_api.ConnectionString, item, ana);
        var client = ClientWith(authorization);

        var byItem = await client.GetAsync(ItemAssignmentsSupport.AssigneesRoute(item));
        var byMember = await client.GetAsync($"/api/team-members/{ana}/items");

        byItem.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        byMember.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await byItem.Content.ReadAsStringAsync()).Should().NotContain("Ana");
        _api.Items.GetItemsCalls.Should().Be(0);
    }
}
