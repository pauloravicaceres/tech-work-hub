using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Sprints.Contracts;
using Xunit;

namespace Integration.Sprints;

/// <summary>
/// HU-004 (QA-AUTO) — fidelidad de las estimaciones por rol (FR-008, FR-013, SC-005).
/// BacklogItem.DevPoints/QAPoints son decimal?; el Tech Design (W-01) exige propagarlos sin truncar ni falsear nulos.
/// </summary>
[Collection(PostgresCollection.Name)]
public class SprintItemsEstimationFidelityTests : IDisposable
{
    private readonly SprintsApiFactory _api;

    public SprintItemsEstimationFidelityTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private async Task<BacklogItemSummary> GetSummaryAsync(Guid id)
    {
        using var scope = _api.Services.CreateScope();
        var api = scope.ServiceProvider.GetRequiredService<IBacklogModuleApi>();
        return (await api.GetSummariesAsync([id], CancellationToken.None)).Single();
    }

    [Fact]
    public async Task GetSummariesAsync_ConPuntosDecimales_DebePreservarElValorExacto()
    {
        // Arrange
        var id = await _api.SeedBacklogItemAsync("Decimal", "UserStory", 2.5m, 0.4m);

        // Act
        var summary = await GetSummaryAsync(id);

        // Assert
        summary.DevPoints.Should().Be(2.5m);
        summary.QAPoints.Should().Be(0.4m);
    }

    [Fact]
    public async Task GetSummariesAsync_ConQaNulo_NoDebeFalsearloComoCero()
    {
        // Arrange
        var id = await _api.SeedBacklogItemAsync("Deuda", "TechDebt", 2, null);

        // Act
        var summary = await GetSummaryAsync(id);

        // Assert
        summary.QAPoints.Should().BeNull("un ítem técnico sin QA se muestra como guion, no como 0 (UX B-02)");
    }
}
