using FluentAssertions;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TechnicalRoles;
using Teams.Features.ItemAssignments;
using Teams.Features.ItemAssignments.ListItemAssignees;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-015 / US2 — consulta tarjeta→personas, solo con datos locales del schema teams.</summary>
public class ListItemAssigneesQueryHandlerTests
{
    private static ItemAssignment Assign(Guid itemId, Guid memberId, DateTime at)
    {
        var assignment = ItemAssignment.Create(itemId, memberId);
        assignment.MarkCreated(at, "seed-user");
        return assignment;
    }

    [Fact]
    public async Task Handle_ConDosResponsables_DebeDevolverExactamenteAnaYLuisConSuRolVigente()
    {
        using var db = TeamsInMemoryDb.Create();
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var luis = await TeamsInMemoryDb.SeedMemberAsync(db, "Luis Rojas", TechnicalRoleSeed.QaId);
        var itemId = Guid.NewGuid();
        db.ItemAssignments.AddRange(
            Assign(itemId, ana.Id, DateTime.UtcNow.AddMinutes(-2)),
            Assign(itemId, luis.Id, DateTime.UtcNow.AddMinutes(-1)),
            Assign(Guid.NewGuid(), ana.Id, DateTime.UtcNow));
        await db.SaveChangesAsync();
        var sut = new ListItemAssigneesQueryHandler(db);

        var result = await sut.Handle(new ListItemAssigneesQuery(itemId), CancellationToken.None);

        result.Should().Equal(
            new AssigneeResponse(ana.Id, "Ana Torres", "Desarrollo"),
            new AssigneeResponse(luis.Id, "Luis Rojas", "QA"));
    }

    [Fact]
    public async Task Handle_ElementoSinResponsablesOBienFormadoPeroInexistente_DebeDevolverColeccionVacia()
    {
        using var db = TeamsInMemoryDb.Create();
        var sut = new ListItemAssigneesQueryHandler(db);

        var result = await sut.Handle(new ListItemAssigneesQuery(Guid.NewGuid()), CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ConTokenCancelado_DebePropagarLaCancelacion()
    {
        using var db = TeamsInMemoryDb.Create();
        var sut = new ListItemAssigneesQueryHandler(db);
        using var cts = new CancellationTokenSource();
        await cts.CancelAsync();

        var act = () => sut.Handle(new ListItemAssigneesQuery(Guid.NewGuid()), cts.Token);

        await act.Should().ThrowAsync<OperationCanceledException>();
    }
}
