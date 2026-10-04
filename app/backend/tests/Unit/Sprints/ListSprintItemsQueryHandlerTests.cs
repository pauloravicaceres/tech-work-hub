using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Shared.Exceptions;
using Sprints.Data;
using Sprints.Features.SprintItems;
using Sprints.Features.SprintItems.ListSprintItems;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-004 / US2 — consulta de elementos asignados con doble manual del contrato.</summary>
public class ListSprintItemsQueryHandlerTests
{
    private readonly FakeBacklogModuleApi _backlog = new();

    private ListSprintItemsQueryHandler Handler(ISprintsDbContext db) =>
        new(db, _backlog, NullLogger<ListSprintItemsQueryHandler>.Instance);

    [Fact]
    public async Task Handle_ConElementosAsignados_DebeDevolverExactamenteEsosConLosCincoCampos()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var other = await SprintsInMemoryDb.SeedAsync(db, "Otro", new DateOnly(2026, 10, 19));
        var a = _backlog.Add(Guid.NewGuid(), "Login", "UserStory", 5, 3);
        var b = _backlog.Add(Guid.NewGuid(), "Refactor", "TechDebt", 2, 0);
        var foreign = _backlog.Add(Guid.NewGuid(), "De otro Sprint");
        var now = DateTime.UtcNow;
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, a.Id, now);
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, b.Id, now.AddSeconds(1));
        await SprintsInMemoryDb.SeedItemAsync(db, other.Id, foreign.Id, now);

        // Act
        var result = await Handler(db).Handle(new ListSprintItemsQuery(sprint.Id), CancellationToken.None);

        // Assert
        result.Should().Equal(
            new SprintItemResponse(a.Id, "Login", "UserStory", 5, 3),
            new SprintItemResponse(b.Id, "Refactor", "TechDebt", 2, 0));
    }

    [Fact]
    public async Task Handle_DebeOrdenarPorFechaDeAsignacionYLuegoPorId()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var now = DateTime.UtcNow;
        var late = _backlog.Add(Guid.NewGuid(), "Tarde");
        var early = _backlog.Add(Guid.NewGuid(), "Temprano");
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, late.Id, now.AddMinutes(5));
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, early.Id, now);

        // Act
        var result = await Handler(db).Handle(new ListSprintItemsQuery(sprint.Id), CancellationToken.None);

        // Assert
        result.Select(r => r.Title).Should().Equal("Temprano", "Tarde");
    }

    [Fact]
    public async Task Handle_ConSprintSinElementos_DebeDevolverListaVaciaSinInvocarElContrato()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));

        // Act
        var result = await Handler(db).Handle(new ListSprintItemsQuery(sprint.Id), CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
        _backlog.SummariesCalls.Should().Be(0);
    }

    [Fact]
    public async Task Handle_ConSprintInexistente_DebeLanzarNotFound()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();

        // Act
        var act = () => Handler(db).Handle(new ListSprintItemsQuery(Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<NotFoundException>();
        _backlog.TotalCalls.Should().Be(0);
    }

    [Fact]
    public async Task Handle_DebeInvocarElContratoUnaSolaVezConTodosLosIds()
    {
        // Arrange (sin N+1)
        await using var db = SprintsInMemoryDb.Create();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var ids = Enumerable.Range(0, 5).Select(_ => _backlog.Add(Guid.NewGuid()).Id).ToList();
        foreach (var id in ids) await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, id);

        // Act
        await Handler(db).Handle(new ListSprintItemsQuery(sprint.Id), CancellationToken.None);

        // Assert
        _backlog.SummariesCalls.Should().Be(1);
        _backlog.LastRequestedIds.Should().BeEquivalentTo(ids);
    }

    [Fact]
    public async Task Handle_ConIdQueElContratoNoDevuelve_DebeOmitirloSinInventarTitulo()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var known = _backlog.Add(Guid.NewGuid(), "Conocido");
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, known.Id, DateTime.UtcNow);
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, Guid.NewGuid(), DateTime.UtcNow.AddSeconds(1)); // huérfano

        // Act
        var result = await Handler(db).Handle(new ListSprintItemsQuery(sprint.Id), CancellationToken.None);

        // Assert
        result.Should().ContainSingle().Which.Id.Should().Be(known.Id);
    }

    [Fact]
    public async Task Handle_CuandoElContratoFalla_DebePropagarLaExcepcion()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.Create();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, Guid.NewGuid());
        _backlog.ExceptionToThrow = new InvalidOperationException("backlog caído");

        // Act
        var act = () => Handler(db).Handle(new ListSprintItemsQuery(sprint.Id), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>();
    }
}
