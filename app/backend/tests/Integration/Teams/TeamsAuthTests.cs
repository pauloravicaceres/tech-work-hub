using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Teams;

/// <summary>HU-012 / US5 — las tres rutas responden 401 sin credenciales válidas y sin leer ni escribir.</summary>
[Collection(PostgresCollection.Name)]
public class TeamsAuthTests : IDisposable
{
    private readonly TeamsApiFactory _api;

    public TeamsAuthTests(PostgresFixture postgres) => _api = new TeamsApiFactory(postgres);

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
    public async Task Registrar_SinTokenOConTokenInvalido_DebeResponder401SinEscribir(string? authorization)
    {
        var response = await ClientWith(authorization).PostAsJsonAsync("/api/team-members", new { name = "Ana", role = "QA" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredMembersAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Registrar_ConTokenSinClaimDeIdentidad_DebeResponder401SinEscribir()
    {
        var response = await ClientWith(TestAuthHandler.NoSubjectToken)
            .PostAsJsonAsync("/api/team-members", new { name = "Ana", role = "QA" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredMembersAsync()).Should().BeEmpty();
    }

    [Theory]
    [InlineData("/api/team-members", null)]
    [InlineData("/api/team-members", "Bearer invalid-or-expired")]
    [InlineData("/api/technical-roles", null)]
    [InlineData("/api/technical-roles", "Bearer invalid-or-expired")]
    public async Task Consultar_SinTokenOConTokenInvalido_DebeResponder401(string route, string? authorization)
    {
        var response = await ClientWith(authorization).GetAsync(route);

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await response.Content.ReadAsStringAsync()).Should().NotContain("Ana");
    }
}
