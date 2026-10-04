using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-004 / US3 — 400 con detalle por campo y 404 diferenciado; nunca se persiste nada.</summary>
[Collection(PostgresCollection.Name)]
public class AssignItemToSprintValidationTests : IDisposable
{
    private static readonly DateOnly Start = new(2026, 10, 5);
    private const string ProblemJson = "application/problem+json";

    private readonly SprintsApiFactory _api;

    public AssignItemToSprintValidationTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private async Task AssertBadRequestOnAsync(HttpResponseMessage response, string field)
    {
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType!.MediaType.Should().Be(ProblemJson);
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("errors").TryGetProperty(field, out var messages).Should().BeTrue();
        messages.GetArrayLength().Should().BeGreaterThan(0);
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }

    [Theory]
    [InlineData("no-es-guid")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public async Task Asignar_ConSprintIdMalformadoOVacio_DebeResponder400ConErrorBajoSprintId(string sprintId)
    {
        // Arrange
        var itemId = await _api.SeedBacklogItemAsync();

        // Act
        var response = await _api.AuthenticatedClient().PostAsJsonAsync($"/api/sprints/{sprintId}/items", new { itemId });

        // Assert
        await AssertBadRequestOnAsync(response, "sprintId");
    }

    [Theory]
    [InlineData("""{ "itemId": "no-es-guid" }""")]
    [InlineData("""{ "itemId": "00000000-0000-0000-0000-000000000000" }""")]
    [InlineData("""{ "itemId": null }""")]
    [InlineData("""{ }""")]
    public async Task Asignar_ConItemIdMalformadoVacioOAusente_DebeResponder400ConErrorBajoItemId(string json)
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);

        // Act
        var response = await _api.AuthenticatedClient().PostAsync(
            $"/api/sprints/{sprintId}/items", new StringContent(json, Encoding.UTF8, "application/json"));

        // Assert
        await AssertBadRequestOnAsync(response, "itemId");
    }

    [Fact]
    public async Task Asignar_ConSprintInexistente_DebeResponder404ProblemJsonQueDistingueElSprint()
    {
        // Arrange
        var itemId = await _api.SeedBacklogItemAsync();

        // Act
        var response = await _api.AuthenticatedClient().PostAsJsonAsync($"/api/sprints/{Guid.NewGuid()}/items", new { itemId });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType!.MediaType.Should().Be(ProblemJson);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString().Should().Contain("Sprint");
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_ConElementoInexistente_DebeResponder404ProblemJsonQueDistingueElElemento()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);

        // Act
        var response = await _api.AuthenticatedClient().PostAsJsonAsync($"/api/sprints/{sprintId}/items", new { itemId = Guid.NewGuid() });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType!.MediaType.Should().Be(ProblemJson);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString().Should().Contain("elemento");
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_ConSprintYElementoInexistentes_DebeGanarElMensajeDelSprint()
    {
        // Act
        var response = await _api.AuthenticatedClient().PostAsJsonAsync($"/api/sprints/{Guid.NewGuid()}/items", new { itemId = Guid.NewGuid() });

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("detail").GetString().Should().Contain("Sprint");
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }
}
