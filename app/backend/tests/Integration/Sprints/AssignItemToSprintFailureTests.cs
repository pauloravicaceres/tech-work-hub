using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Sprints.Contracts;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-004 / US4 — fallos de persistencia o del contrato terminan en 500 sin traza y sin fila parcial.</summary>
[Collection(PostgresCollection.Name)]
public class AssignItemToSprintFailureTests : IDisposable
{
    private static readonly DateOnly Start = new(2026, 10, 5);

    private readonly SprintsApiFactory _api;

    public AssignItemToSprintFailureTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private sealed class ThrowingBacklogModuleApi : IBacklogModuleApi
    {
        public Task<bool> ExistsAsync(Guid itemId, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("fallo simulado del contrato");

        public Task<IReadOnlyList<BacklogItemSummary>> GetSummariesAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken cancellationToken) =>
            throw new InvalidOperationException("fallo simulado del contrato");
    }

    private static async Task AssertProblem500SinTrazaAsync(HttpResponseMessage response)
    {
        response.StatusCode.Should().Be(HttpStatusCode.InternalServerError);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/problem+json");
        var body = await response.Content.ReadAsStringAsync();
        body.Should().NotContainEquivalentOf("stackTrace").And.NotContain(" at ").And.NotContain("fallo simulado");
    }

    [Fact]
    public async Task Asignar_CuandoElContratoDeBacklogFalla_DebeResponder500SinTrazaNiFila()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync();
        var client = _api.AuthenticatedClientWith(s => s.AddScoped<IBacklogModuleApi, ThrowingBacklogModuleApi>());

        // Act
        var response = await client.PostAsJsonAsync($"/api/sprints/{sprintId}/items", new { itemId });

        // Assert
        await AssertProblem500SinTrazaAsync(response);
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Asignar_CuandoLaPersistenciaFallaPorOtraRestriccion_DebeResponder500NoConflictNiFila()
    {
        // Arrange: un sub de 300 caracteres excede varchar(255) de CreatedBy (22001), no el índice único
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync();
        var client = _api.AuthenticatedClient(TestAuthHandler.LongSubjectToken);

        // Act
        var response = await client.PostAsJsonAsync($"/api/sprints/{sprintId}/items", new { itemId });

        // Assert
        await AssertProblem500SinTrazaAsync(response);
        (await _api.StoredSprintItemsAsync()).Should().BeEmpty();
    }

    [Fact]
    public async Task Listar_CuandoElContratoDeBacklogFalla_DebeResponder500SinTraza()
    {
        // Arrange
        var sprintId = await _api.SeedSprintAsync("Sprint", Start);
        var itemId = await _api.SeedBacklogItemAsync();
        await _api.SeedSprintItemAsync(sprintId, itemId);
        var client = _api.AuthenticatedClientWith(s => s.AddScoped<IBacklogModuleApi, ThrowingBacklogModuleApi>());

        // Act
        var response = await client.GetAsync($"/api/sprints/{sprintId}/items");

        // Assert
        await AssertProblem500SinTrazaAsync(response);
    }
}
