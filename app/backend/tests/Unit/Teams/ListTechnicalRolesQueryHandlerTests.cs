using FluentAssertions;
using Teams.Domain.TechnicalRoles;
using Teams.Features.TechnicalRoles;
using Teams.Features.TechnicalRoles.ListTechnicalRoles;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-012 / FR-009 — catálogo de roles de solo lectura.</summary>
public class ListTechnicalRolesQueryHandlerTests
{
    [Fact]
    public async Task Handle_DebeDevolverDesarrolloYQaOrdenadosPorNombre()
    {
        using var db = TeamsInMemoryDb.Create();

        var result = await new ListTechnicalRolesQueryHandler(db).Handle(new ListTechnicalRolesQuery(), CancellationToken.None);

        result.Should().Equal(
            new TechnicalRoleResponse(TechnicalRoleSeed.DevelopmentId, "Desarrollo"),
            new TechnicalRoleResponse(TechnicalRoleSeed.QaId, "QA"));
    }
}
