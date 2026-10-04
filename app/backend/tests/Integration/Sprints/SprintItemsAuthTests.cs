using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-004 / US4 — 401 sin credenciales válidas en POST y GET, sin leer ni escribir, y regresión del formato de errores.</summary>
[Collection(PostgresCollection.Name)]
public class SprintItemsAuthTests : IDisposable
{
    private static readonly DateOnly Start = new(2026, 10, 5);

    private readonly SprintsApiFactory _api;

    public SprintItemsAuthTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

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
    public async Task Asignar_SinTokenOConTokenInvalido_DebeResponder401SinEscribir(string? authorization)
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync();

        // Act
        var response = await ClientWith(authorization).PostAsJsonAsync($"/api/sprints/{sprintId}/items", new { itemId });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_ConTokenSinClaimDeIdentidad_DebeResponder401SinEscribir()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync();

        // Act
        var response = await _api.AuthenticatedClient(TestAuthHandler.NoSubjectToken)
            .PostAsJsonAsync($"/api/sprints/{sprintId}/items", new { itemId });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("Bearer invalid-or-expired")]
    public async Task Listar_SinTokenOConTokenInvalido_DebeResponder401(string? authorization)
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync("Elemento");
        await _api.SeedSprintItemAsync(sprintId, itemId);

        // Act
        var response = await ClientWith(authorization).GetAsync($"/api/sprints/{sprintId}/items");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await response.Content.ReadAsStringAsync()).Should().NotContain("Elemento");
    }

    [Fact]
    public async Task Regresion_ElFormatoDe404YDe400DeSprintsSeConservaTrasAnadirElConflict()
    {
        // Act
        var notFound = await _api.AuthenticatedClient().GetAsync($"/api/sprints/{Guid.NewGuid()}");
        var badRequest = await _api.AuthenticatedClient().PostAsJsonAsync("/api/sprints", new { identification = "", startDate = "2026-10-05" });

        // Assert
        notFound.StatusCode.Should().Be(HttpStatusCode.NotFound);
        notFound.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        badRequest.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        badRequest.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }
}
