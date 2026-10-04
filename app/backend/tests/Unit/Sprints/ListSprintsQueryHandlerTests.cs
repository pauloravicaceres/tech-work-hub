using FluentAssertions;
using Sprints.Features.Sprints;
using Sprints.Features.Sprints.ListSprints;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-003 / FR-007 — consulta del listado sobre el contexto real del módulo.</summary>
public class ListSprintsQueryHandlerTests
{
    [Fact]
    public async Task Handle_SinSprints_DebeDevolverListaVacia()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();

        // Act
        var result = await new ListSprintsQueryHandler(db).Handle(new ListSprintsQuery(), CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ConSprintsRegistrados_DebeDevolverExactamenteEsosConSusCuatroDatosOrdenadosPorInicio()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        var later = await SprintsInMemoryDb.SeedAsync(db, "Sprint B", new DateOnly(2026, 11, 2));
        var earlier = await SprintsInMemoryDb.SeedAsync(db, "Sprint A", new DateOnly(2026, 10, 5));

        // Act
        var result = await new ListSprintsQueryHandler(db).Handle(new ListSprintsQuery(), CancellationToken.None);

        // Assert
        result.Should().Equal(
            new SprintResponse(earlier.Id, "Sprint A", earlier.StartDate, earlier.EndDate),
            new SprintResponse(later.Id, "Sprint B", later.StartDate, later.EndDate));
    }

    [Fact]
    public async Task Handle_ConIdentificacionesRepetidas_DebeDevolverAmbosSprints()
    {
        // Arrange (ADR-006: la identificación no es única)
        await using var db = SprintsInMemoryDb.Create();
        await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));

        // Act
        var result = await new ListSprintsQueryHandler(db).Handle(new ListSprintsQuery(), CancellationToken.None);

        // Assert
        result.Should().HaveCount(2).And.OnlyHaveUniqueItems(r => r.Id);
    }
}
