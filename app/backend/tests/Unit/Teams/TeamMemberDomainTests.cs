using FluentAssertions;
using Shared.Exceptions;
using Teams.Domain.TeamMembers;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-012 / FR-001, FR-006 — invariantes de <see cref="TeamMember"/> sin base de datos.</summary>
public class TeamMemberDomainTests
{
    private static readonly Guid RoleId = Guid.NewGuid();

    [Fact]
    public void Create_ConDatosValidos_DebeGenerarIdYConservarElRol()
    {
        var member = TeamMember.Create("Ana Torres", RoleId);

        member.Id.Should().NotBe(Guid.Empty);
        member.TechnicalRoleId.Should().Be(RoleId);
        member.Name.Should().Be("Ana Torres");
    }

    [Fact]
    public void Create_ConEspaciosAlrededor_DebeGuardarElNombreRecortado()
    {
        TeamMember.Create("  Ana Torres  ", RoleId).Name.Should().Be("Ana Torres");
    }

    [Fact]
    public void Create_DosVeces_DebeGenerarIdentificadoresDistintos()
    {
        TeamMember.Create("Ana", RoleId).Id.Should().NotBe(TeamMember.Create("Ana", RoleId).Id);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_ConNombreVacio_DebeLanzarBadRequestSobreName(string? name)
    {
        var act = () => TeamMember.Create(name, RoleId);

        act.Should().Throw<BadRequestException>().Which.Field.Should().Be(TeamMemberRules.NameField);
    }

    [Fact]
    public void Create_ConRolVacio_DebeLanzarBadRequestSobreRole()
    {
        var act = () => TeamMember.Create("Ana", Guid.Empty);

        act.Should().Throw<BadRequestException>().Which.Field.Should().Be(TeamMemberRules.RoleField);
    }

    [Fact]
    public void Create_ConNombreMuyLargo_NoDebeImponerLimite()
    {
        TeamMember.Create(new string('a', 5000), RoleId).Name.Should().HaveLength(5000);
    }
}
