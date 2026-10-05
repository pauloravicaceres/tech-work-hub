using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Teams.Features.TeamMembers;
using Teams.Features.TeamMembers.ListTeamMembers;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-012 / FR-007, FR-008 — consulta de solo lectura con JOIN local al rol.</summary>
public class ListTeamMembersQueryHandlerTests
{
    [Fact]
    public async Task Handle_SinMiembros_DebeDevolverListaVacia()
    {
        using var db = TeamsInMemoryDb.Create();

        var result = await new ListTeamMembersQueryHandler(db).Handle(new ListTeamMembersQuery(), CancellationToken.None);

        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ConMiembros_DebeDevolverExactamenteIdNombreYRolOrdenadosPorAlta()
    {
        using var db = TeamsInMemoryDb.Create();
        var baseTime = new DateTime(2026, 10, 5, 12, 0, 0, DateTimeKind.Utc);
        var luis = await TeamsInMemoryDb.SeedMemberAsync(db, "Luis Rojas", TechnicalRoleSeed.QaId, baseTime.AddMinutes(1));
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana Torres", TechnicalRoleSeed.DevelopmentId, baseTime);

        var result = await new ListTeamMembersQueryHandler(db).Handle(new ListTeamMembersQuery(), CancellationToken.None);

        result.Should().Equal(
            new TeamMemberResponse(ana.Id, "Ana Torres", "Desarrollo"),
            new TeamMemberResponse(luis.Id, "Luis Rojas", "QA"));
    }

    [Fact]
    public async Task Handle_NoDebeModificarDatos()
    {
        using var db = TeamsInMemoryDb.Create();
        await TeamsInMemoryDb.SeedMemberAsync(db, "Ana", TechnicalRoleSeed.QaId);

        await new ListTeamMembersQueryHandler(db).Handle(new ListTeamMembersQuery(), CancellationToken.None);

        db.ChangeTracker.HasChanges().Should().BeFalse();
    }
}
