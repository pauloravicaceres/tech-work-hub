using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Integration.Sprints;

/// <summary>
/// HU-004 / US1 y US3 (escenarios 4 y 5) — asignación contra el host real y PostgreSQL real: 201, conservación de datos,
/// 409 por reasignación (mismo u otro Sprint) y concurrencia: exactamente un 201 y el resto 409 (FR-017).
/// </summary>
[Collection(PostgresCollection.Name)]
public class AssignItemToSprintTests : IDisposable
{
    private static readonly DateOnly Start = new(2026, 10, 5);
    private const string ConflictMessage = "El elemento ya está asignado a un Sprint.";

    private readonly SprintsApiFactory _api;

    public AssignItemToSprintTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private Task<HttpResponseMessage> AssignAsync(Guid sprintId, Guid itemId, HttpClient? client = null) =>
        (client ?? _api.AuthenticatedClient()).PostAsJsonAsync($"/api/sprints/{sprintId}/items", new { itemId });

    [Fact]
    public async Task Asignar_ConSprintYElementoValidos_DebeResponder201ConCuerpoLocationYAuditoria()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint 2026-01", Start);
        var itemId = await _api.SeedBacklogItemAsync();

        // Act
        var response = await AssignAsync(sprintId, itemId);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        response.Headers.Location!.ToString().Should().Be($"/api/sprints/{sprintId}/items");
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("sprintId").GetGuid().Should().Be(sprintId);
        body.GetProperty("itemId").GetGuid().Should().Be(itemId);
        body.EnumerateObject().Select(p => p.Name).Should().BeEquivalentTo(["sprintId", "itemId"]);

        var rows = await _api.StoredSprintItemsAsync();
        var row = rows.Should().ContainSingle().Subject;
        row.SprintId.Should().Be(sprintId);
        row.ItemId.Should().Be(itemId);
        row.CreatedBy.Should().Be(TestAuthHandler.UserId);
        row.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(1));
    }

    [Fact]
    public async Task Asignar_NoDebeModificarElElementoDelBacklogNiElSprint()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync("Historia", "UserStory", 5, 3);
        var itemBefore = await _api.BacklogItemSnapshotAsync(itemId);
        var sprintBefore = await _api.SprintSnapshotAsync(sprintId);

        // Act
        var response = await AssignAsync(sprintId, itemId);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);
        (await _api.BacklogItemSnapshotAsync(itemId)).Should().Be(itemBefore);
        (await _api.SprintSnapshotAsync(sprintId)).Should().Be(sprintBefore);
    }

    [Fact]
    public async Task Asignar_DosElementosDistintosAlMismoSprint_DebeCrearDosFilas()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var first = await _api.SeedBacklogItemAsync("Uno");
        var second = await _api.SeedBacklogItemAsync("Dos");

        // Act
        var r1 = await AssignAsync(sprintId, first);
        var r2 = await AssignAsync(sprintId, second);

        // Assert
        r1.StatusCode.Should().Be(HttpStatusCode.Created);
        r2.StatusCode.Should().Be(HttpStatusCode.Created);
        (await _api.StoredSprintItemsAsync()).Select(r => r.ItemId).Should().BeEquivalentTo([first, second]);
    }

    [Fact]
    public async Task Asignar_ElMismoElementoAlMismoSprint_DebeResponder409ConUnaSolaFila()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync();
        (await AssignAsync(sprintId, itemId)).StatusCode.Should().Be(HttpStatusCode.Created);

        // Act
        var response = await AssignAsync(sprintId, itemId);

        // Assert
        await AssertConflictAsync(response);
        (await _api.StoredSprintItemsAsync()).Should().ContainSingle();
    }

    [Fact]
    public async Task Asignar_ElMismoElementoAOtroSprint_DebeResponder409ConElMismoMensajeSinRevelarElSprintDueno()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint A", Start);
        var otherSprintId = await _api.SeedSprintAsync("Sprint B", Start.AddDays(14));
        var itemId = await _api.SeedBacklogItemAsync();
        (await AssignAsync(sprintId, itemId)).StatusCode.Should().Be(HttpStatusCode.Created);

        // Act
        var response = await AssignAsync(otherSprintId, itemId);

        // Assert
        await AssertConflictAsync(response);
        var raw = await response.Content.ReadAsStringAsync();
        raw.Should().NotContain(sprintId.ToString()).And.NotContain("Sprint A");
        var rows = await _api.StoredSprintItemsAsync();
        rows.Should().ContainSingle().Which.SprintId.Should().Be(sprintId);
    }

    [Fact]
    public async Task Asignar_SolicitudesSimultaneasDelMismoElemento_DebeResponderExactamenteUn201YElRestante409()
    {
        // Arrange
        var sprintA = await _api.SeedSprintAsync("Sprint A", Start);
        var sprintB = await _api.SeedSprintAsync("Sprint B", Start.AddDays(14));
        var itemId = await _api.SeedBacklogItemAsync();

        // Act
        var responses = await Task.WhenAll(Enumerable.Range(0, 10)
            .Select(i => Task.Run(() => AssignAsync(i % 2 == 0 ? sprintA : sprintB, itemId))));

        // Assert
        responses.Count(r => r.StatusCode == HttpStatusCode.Created).Should().Be(1);
        responses.Count(r => r.StatusCode == HttpStatusCode.Conflict).Should().Be(9);
        (await _api.StoredSprintItemsAsync()).Should().ContainSingle();
    }

    private static async Task AssertConflictAsync(HttpResponseMessage response)
    {
        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        var problem = await response.Content.ReadFromJsonAsync<JsonElement>();
        problem.GetProperty("status").GetInt32().Should().Be(409);
        problem.GetProperty("title").GetString().Should().Be("Conflict");
        problem.GetProperty("detail").GetString().Should().Be(ConflictMessage);
    }
}
