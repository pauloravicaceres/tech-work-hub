using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-004 / US2 — consulta de elementos asignados contra el host real y PostgreSQL real.</summary>
[Collection(PostgresCollection.Name)]
public class ListSprintItemsTests : IDisposable
{
    private static readonly DateOnly Start = new(2026, 10, 5);

    private readonly SprintsApiFactory _api;

    public ListSprintItemsTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    [Fact]
    public async Task Listar_ConDosElementosAsignados_DebeDevolverExactamenteEsosConSusCampos()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint 1", Start);
        var otherSprintId = await _api.SeedSprintAsync("Sprint 2", Start.AddDays(14));
        var first = await _api.SeedBacklogItemAsync("Historia uno", "UserStory", 5, 3);
        var second = await _api.SeedBacklogItemAsync("Defecto dos", "Bug", 2, 1);
        var foreign = await _api.SeedBacklogItemAsync("Ajeno");
        await _api.SeedBacklogItemAsync("Sin asignar");
        await _api.SeedSprintItemAsync(sprintId, first);
        await _api.SeedSprintItemAsync(sprintId, second);
        await _api.SeedSprintItemAsync(otherSprintId, foreign);
        var backlogBefore = await _api.BacklogItemSnapshotAsync(first);

        // Act
        var response = await _api.AuthenticatedClient().GetAsync($"/api/sprints/{sprintId}/items");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var items = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().ToList();
        items.Select(i => i.GetProperty("id").GetGuid()).Should().BeEquivalentTo([first, second]);
        var one = items.Single(i => i.GetProperty("id").GetGuid() == first);
        one.EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo(["id", "title", "type", "devPoints", "qaPoints"]);
        one.GetProperty("title").GetString().Should().Be("Historia uno");
        one.GetProperty("type").GetString().Should().Be("UserStory");
        one.GetProperty("devPoints").GetDecimal().Should().Be(5m);
        one.GetProperty("qaPoints").GetDecimal().Should().Be(3m);
        (await _api.BacklogItemSnapshotAsync(first)).Should().Be(backlogBefore);
    }

    [Fact]
    public async Task Listar_ConEstimacionDecimalYQaNulo_DebePreservarDecimalYNuloSinRedondear()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint fidelidad", Start);
        var item = await _api.SeedBacklogItemAsync("Deuda", "TechDebt", 2.5m, null);
        await _api.SeedSprintItemAsync(sprintId, item);

        // Act
        var response = await _api.AuthenticatedClient().GetAsync($"/api/sprints/{sprintId}/items");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var one = (await response.Content.ReadFromJsonAsync<JsonElement>()).EnumerateArray().Single();
        one.GetProperty("devPoints").GetDecimal().Should().Be(2.5m);
        one.GetProperty("qaPoints").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task Listar_ConSprintSinElementos_DebeResponder200ConArregloVacio()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint vacío", Start);

        // Act
        var response = await _api.AuthenticatedClient().GetAsync($"/api/sprints/{sprintId}/items");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(0);
    }

    [Fact]
    public async Task Listar_ConSprintInexistente_DebeResponder404ProblemJson()
    {
        // Act
        var response = await _api.AuthenticatedClient().GetAsync($"/api/sprints/{Guid.NewGuid()}/items");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
    }

    [Fact]
    public async Task Listar_ConSprintIdQueNoEsGuid_DebeResponder404()
    {
        // Act
        var response = await _api.AuthenticatedClient().GetAsync("/api/sprints/no-es-guid/items");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Listar_Con100ElementosAsignados_DebeResponderEnMenosDe2Segundos()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint grande", Start);
        for (var i = 0; i < 100; i++)
        {
            var itemId = await _api.SeedBacklogItemAsync($"Elemento {i}");
            await _api.SeedSprintItemAsync(sprintId, itemId);
        }
        var client = _api.AuthenticatedClient();
        await client.GetAsync($"/api/sprints/{sprintId}/items"); // calienta el host

        // Act
        var stopwatch = Stopwatch.StartNew();
        var response = await client.GetAsync($"/api/sprints/{sprintId}/items");
        stopwatch.Stop();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        (await response.Content.ReadFromJsonAsync<JsonElement>()).GetArrayLength().Should().Be(100);
        stopwatch.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(2));
    }
}
