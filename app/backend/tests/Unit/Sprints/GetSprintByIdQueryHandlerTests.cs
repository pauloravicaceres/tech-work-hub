using FluentAssertions;
using Shared.Exceptions;
using Sprints.Features.Sprints;
using Sprints.Features.Sprints.GetSprintById;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-003 / FR-008, FR-009 — detalle por identificador sobre el contexto real del módulo.</summary>
public class GetSprintByIdQueryHandlerTests
{
    [Fact]
    public async Task Handle_ConIdExistente_DebeDevolverElSprintConSusCuatroDatos()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        await SprintsInMemoryDb.SeedAsync(db, "Otro", new DateOnly(2026, 9, 21));
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint 2026-01", new DateOnly(2026, 10, 5));

        // Act
        var result = await new GetSprintByIdQueryHandler(db).Handle(new GetSprintByIdQuery(sprint.Id), CancellationToken.None);

        // Assert
        result.Should().Be(new SprintResponse(sprint.Id, "Sprint 2026-01", new DateOnly(2026, 10, 5), new DateOnly(2026, 10, 18)));
    }

    [Fact]
    public async Task Handle_ConIdInexistente_DebeLanzarNotFound()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));

        // Act
        var act = () => new GetSprintByIdQueryHandler(db).Handle(new GetSprintByIdQuery(Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>().WithMessage(GetSprintByIdQueryHandler.NotFoundMessage);
    }
}
