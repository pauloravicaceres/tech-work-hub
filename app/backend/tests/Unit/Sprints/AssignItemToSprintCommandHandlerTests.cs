using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using NSubstitute;
using Shared.Exceptions;
using Shared.Identity;
using Sprints.Contracts;
using Sprints.Data;
using Sprints.Domain.SprintItems;
using Sprints.Features.SprintItems;
using Sprints.Features.SprintItems.AssignItemToSprint;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-004 / US1, US3, US4 — handler de asignación con contexto EF en memoria y doble manual del contrato.</summary>
public class AssignItemToSprintCommandHandlerTests
{
    private const string UniqueViolation = "23505";
    private const string StringTooLong = "22001";
    private const string ValidGuid = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

    private readonly ICurrentUser _user = Substitute.For<ICurrentUser>();
    private readonly FakeBacklogModuleApi _backlog = new();

    public AssignItemToSprintCommandHandlerTests() => _user.UserId.Returns("user-1");

    private AssignItemToSprintCommandHandler Handler(ISprintsDbContext db) => new(db, _backlog, _user);

    private static AssignItemToSprintCommand Command(Guid sprintId, Guid itemId) =>
        new(sprintId.ToString(), itemId.ToString());

    private static DbUpdateException PostgresFailure(string sqlState, string constraintName) =>
        new("fallo de persistencia", new PostgresException(
            "violación", "ERROR", "ERROR", sqlState, constraintName: constraintName));

    // ---------- US1: asignar ----------

    [Fact]
    public async Task Handle_ConSprintYElementoValidos_DebeDevolverIdsYPersistirUnaFilaConAuditoria()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.CreateAudited(_user);
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var itemId = Guid.NewGuid();
        _backlog.Add(itemId);

        // Act
        var response = await Handler(db).Handle(Command(sprint.Id, itemId), CancellationToken.None);

        // Assert
        response.Should().Be(new AssignedItemResponse(sprint.Id, itemId));
        var rows = await db.SprintItems.AsNoTracking().ToListAsync();
        rows.Should().ContainSingle();
        rows[0].SprintId.Should().Be(sprint.Id);
        rows[0].ItemId.Should().Be(itemId);
        rows[0].CreatedBy.Should().Be("user-1");
        rows[0].Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task Handle_ConElementoYaAsignado_DebeLanzarConflictSinSegundaFila()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.CreateAudited(_user);
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var otherSprint = await SprintsInMemoryDb.SeedAsync(db, "Otro", new DateOnly(2026, 10, 19));
        var itemId = Guid.NewGuid();
        _backlog.Add(itemId);
        await SprintsInMemoryDb.SeedItemAsync(db, sprint.Id, itemId);

        // Act
        var sameSprint = () => Handler(db).Handle(Command(sprint.Id, itemId), CancellationToken.None);
        var otherOne = () => Handler(db).Handle(Command(otherSprint.Id, itemId), CancellationToken.None);

        // Assert: mismo mensaje en ambos casos y sin revelar el Sprint dueño
        (await sameSprint.Should().ThrowAsync<ConflictException>()).Which.Message.Should().Be(SprintItemRules.ItemAlreadyAssignedMessage);
        (await otherOne.Should().ThrowAsync<ConflictException>()).Which.Message.Should().Be(SprintItemRules.ItemAlreadyAssignedMessage);
        (await db.SprintItems.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Handle_CuandoLaBdRechazaPorElIndiceUnico_DebeTraducirloAConflict()
    {
        // Arrange (carrera: el AnyAsync previo no vio la fila; la viola el índice único)
        await using var db = SprintsInMemoryDb.CreateFailingOnSave();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var itemId = Guid.NewGuid();
        _backlog.Add(itemId);
        db.FailOnNextSave(PostgresFailure(UniqueViolation, SprintItemRules.ItemIdUniqueIndexName));

        // Act
        var act = () => Handler(db).Handle(Command(sprint.Id, itemId), CancellationToken.None);

        // Assert
        (await act.Should().ThrowAsync<ConflictException>()).Which.Message.Should().Be(SprintItemRules.ItemAlreadyAssignedMessage);
    }

    [Theory]
    [InlineData(UniqueViolation, "UX_OtroIndice")]
    [InlineData(StringTooLong, SprintItemRules.ItemIdUniqueIndexName)]
    public async Task Handle_CuandoLaBdFallaPorOtraRestriccion_DebePropagarseSinTraducir(string sqlState, string constraint)
    {
        // Arrange
        await using var db = SprintsInMemoryDb.CreateFailingOnSave();
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var itemId = Guid.NewGuid();
        _backlog.Add(itemId);
        db.FailOnNextSave(PostgresFailure(sqlState, constraint));

        // Act
        var act = () => Handler(db).Handle(Command(sprint.Id, itemId), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Fact]
    public async Task Handle_DebePropagarElCancellationTokenAlContrato()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.CreateAudited(_user);
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        var itemId = Guid.NewGuid();
        var backlog = Substitute.For<IBacklogModuleApi>();
        backlog.ExistsAsync(itemId, Arg.Any<CancellationToken>()).Returns(true);
        using var cts = new CancellationTokenSource();

        // Act
        await new AssignItemToSprintCommandHandler(db, backlog, _user).Handle(Command(sprint.Id, itemId), cts.Token);

        // Assert
        await backlog.Received(1).ExistsAsync(itemId, cts.Token);
    }

    // ---------- US3: inexistentes y formato ----------

    [Fact]
    public async Task Handle_ConSprintInexistente_DebeLanzarNotFoundSinInvocarElContratoNiEscribir()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.CreateAudited(_user);
        var itemId = Guid.NewGuid();
        _backlog.Add(itemId);

        // Act
        var act = () => Handler(db).Handle(Command(Guid.NewGuid(), itemId), CancellationToken.None);

        // Assert
        (await act.Should().ThrowAsync<NotFoundException>()).Which.Message.Should().Be(SprintItemRules.SprintNotFoundMessage);
        _backlog.TotalCalls.Should().Be(0);
        (await db.SprintItems.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_ConElementoInexistente_DebeLanzarNotFoundConMensajeDeElementoSinEscribir()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.CreateAudited(_user);
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));

        // Act
        var act = () => Handler(db).Handle(Command(sprint.Id, Guid.NewGuid()), CancellationToken.None);

        // Assert
        (await act.Should().ThrowAsync<NotFoundException>()).Which.Message.Should().Be(SprintItemRules.ItemNotFoundMessage);
        (await db.SprintItems.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_ConAmbosInexistentes_DebeGanarElMensajeDelSprint()
    {
        // Arrange
        await using var db = SprintsInMemoryDb.CreateAudited(_user);

        // Act
        var act = () => Handler(db).Handle(Command(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        // Assert
        (await act.Should().ThrowAsync<NotFoundException>()).Which.Message.Should().Be(SprintItemRules.SprintNotFoundMessage);
        _backlog.TotalCalls.Should().Be(0);
    }

    [Theory]
    [InlineData(null, ValidGuid, SprintItemRules.SprintIdField)]
    [InlineData("no-es-guid", ValidGuid, SprintItemRules.SprintIdField)]
    [InlineData(ValidGuid, null, SprintItemRules.ItemIdField)]
    [InlineData(ValidGuid, "00000000-0000-0000-0000-000000000000", SprintItemRules.ItemIdField)]
    public async Task Handle_ConIdentificadoresInvalidosQueEvadenElValidador_DebeLanzarBadRequestSobreElCampo(string? sprintId, string? itemId, string field)
    {
        // Arrange: defensa en profundidad si el pipeline de validación no se ejecuta
        await using var db = SprintsInMemoryDb.CreateAudited(_user);

        // Act
        var act = () => Handler(db).Handle(new AssignItemToSprintCommand(sprintId, itemId), CancellationToken.None);

        // Assert
        (await act.Should().ThrowAsync<BadRequestException>()).Which.Field.Should().Be(field);
        _backlog.TotalCalls.Should().Be(0);
    }

    // ---------- US4: identidad y fallos ----------

    [Fact]
    public async Task Handle_SinClaimDeIdentidad_DebeLanzarUnauthorizedAntesDeConsultarSprintOContrato()
    {
        // Arrange
        _user.UserId.Returns((string?)null);
        await using var db = SprintsInMemoryDb.Create();

        // Act
        var act = () => Handler(db).Handle(Command(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        _backlog.TotalCalls.Should().Be(0);
    }

    [Fact]
    public async Task Handle_CuandoElContratoFalla_DebePropagarLaExcepcionSinDarPorExistenteElElemento()
    {
        // Arrange (sin fallback: un fallo no verificado no equivale a "existe")
        await using var db = SprintsInMemoryDb.CreateAudited(_user);
        var sprint = await SprintsInMemoryDb.SeedAsync(db, "Sprint", new DateOnly(2026, 10, 5));
        _backlog.ExceptionToThrow = new InvalidOperationException("backlog caído");

        // Act
        var act = () => Handler(db).Handle(Command(sprint.Id, Guid.NewGuid()), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("backlog caído");
        (await db.SprintItems.CountAsync()).Should().Be(0);
    }
}
