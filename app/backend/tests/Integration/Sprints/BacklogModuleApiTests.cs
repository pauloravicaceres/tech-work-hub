using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Sprints.Contracts;
using Xunit;

namespace Integration.Sprints;

/// <summary>HU-004 — implementación REAL del contrato in-process (Backlog) sobre PostgreSQL real.</summary>
[Collection(PostgresCollection.Name)]
public class BacklogModuleApiTests : IDisposable
{
    private readonly SprintsApiFactory _api;

    public BacklogModuleApiTests(PostgresFixture postgres) => _api = new SprintsApiFactory(postgres);

    public void Dispose() => _api.Dispose();

    private async Task<T> WithApiAsync<T>(Func<IBacklogModuleApi, Task<T>> action)
    {
        using var scope = _api.Services.CreateScope();
        return await action(scope.ServiceProvider.GetRequiredService<IBacklogModuleApi>());
    }

    [Fact]
    public async Task ExistsAsync_ConElementoExistente_DebeSerVerdadero()
    {
        // Arrange
        var id = await _api.SeedBacklogItemAsync();

        // Act / Assert
        (await WithApiAsync(api => api.ExistsAsync(id, CancellationToken.None))).Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_ConElementoInexistente_DebeSerFalso()
    {
        // Arrange
        await _api.SeedBacklogItemAsync();

        // Act / Assert
        (await WithApiAsync(api => api.ExistsAsync(Guid.NewGuid(), CancellationToken.None))).Should().BeFalse();
    }

    [Fact]
    public async Task GetSummariesAsync_DebeDevolverSoloLosIdsExistentesConSusCamposYTipoComoTexto()
    {
        // Arrange
        var story = await _api.SeedBacklogItemAsync("Historia", "UserStory", 5, 3);
        var debt = await _api.SeedBacklogItemAsync("Deuda", "TechDebt", 2, null);
        await _api.SeedBacklogItemAsync("No pedido");
        var missing = Guid.NewGuid();

        // Act
        var result = await WithApiAsync(api => api.GetSummariesAsync([story, debt, missing], CancellationToken.None));

        // Assert
        result.Should().BeEquivalentTo(
        [
            new BacklogItemSummary(story, "Historia", "UserStory", 5, 3),
            new BacklogItemSummary(debt, "Deuda", "TechDebt", 2, null)
        ]);
    }

    [Fact]
    public async Task GetSummariesAsync_ConPuntosDecimales_DebePreservarElValorExactoSinRedondear()
    {
        // Arrange
        var id = await _api.SeedBacklogItemAsync("Decimal", "UserStory", 2.5m, 0.4m);

        // Act
        var result = await WithApiAsync(api => api.GetSummariesAsync([id], CancellationToken.None));

        // Assert
        result.Should().ContainSingle().Which.Should().Be(new BacklogItemSummary(id, "Decimal", "UserStory", 2.5m, 0.4m));
    }

    [Fact]
    public async Task GetSummariesAsync_ConQaNulo_DebeDevolverNuloYNoCero()
    {
        // Arrange
        var id = await _api.SeedBacklogItemAsync("Sin QA", "TechDebt", 2.5m, null);

        // Act
        var result = await WithApiAsync(api => api.GetSummariesAsync([id], CancellationToken.None));

        // Assert
        var summary = result.Should().ContainSingle().Subject;
        summary.DevPoints.Should().Be(2.5m);
        summary.QAPoints.Should().BeNull();
    }

    [Fact]
    public async Task GetSummariesAsync_ConListaVacia_DebeDevolverVacioSinConsultar()
    {
        // Act / Assert
        (await WithApiAsync(api => api.GetSummariesAsync([], CancellationToken.None))).Should().BeEmpty();
    }
}
