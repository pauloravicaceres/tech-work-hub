using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-003 / FR-008, FR-009, FR-010 — detalle contra el host real y PostgreSQL real.</summary>
[Collection(PostgresCollection.Name)]
public class GetSprintByIdTests : IDisposable
{
    private readonly SprintsApiFactory _api;

    public GetSprintByIdTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task GetSprintById_ConIdExistente_DebeResponder200ConLosCuatroDatos()
    {
        // Arrange
        await _api.SeedSprintAsync("Otro", new DateOnly(2026, 9, 21));
        var id = await _api.SeedSprintAsync("Sprint 2026-01", new DateOnly(2026, 10, 5));

        // Act
        var response = await _api.AuthenticatedClient().GetAsync($"/api/sprints/{id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("id").GetGuid().Should().Be(id);
        body.GetProperty("identification").GetString().Should().Be("Sprint 2026-01");
        body.GetProperty("startDate").GetString().Should().Be("2026-10-05");
        body.GetProperty("endDate").GetString().Should().Be("2026-10-18");
    }

    [Fact]
    public async Task GetSprintById_ConIdInexistente_DebeResponder404ProblemJson()
    {
        // Arrange
        await _api.SeedSprintAsync("Sprint", new DateOnly(2026, 10, 5));

        // Act
        var response = await _api.AuthenticatedClient().GetAsync($"/api/sprints/{Guid.NewGuid()}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetInt32().Should().Be(404);
    }

    [Fact]
    public async Task GetSprintById_SinCredenciales_DebeResponder401()
    {
        // Arrange
        var id = await _api.SeedSprintAsync("Sprint", new DateOnly(2026, 10, 5));

        // Act
        var response = await _api.AnonymousClient().GetAsync($"/api/sprints/{id}");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetSprintById_ConIdentificadorQueNoEsGuid_NoDebeCoincidirConLaRuta()
    {
        // Act
        var response = await _api.AuthenticatedClient().GetAsync("/api/sprints/no-es-un-guid");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
