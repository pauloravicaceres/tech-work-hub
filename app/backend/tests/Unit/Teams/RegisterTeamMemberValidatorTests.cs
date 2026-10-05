using FluentAssertions;
using Teams.Domain.TeamMembers;
using Teams.Features.TeamMembers.RegisterTeamMember;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-012 / FR-004, FR-005, FR-015 — validación de presencia, sin límites inventados.</summary>
public class RegisterTeamMemberValidatorTests
{
    private readonly RegisterTeamMemberValidator _sut = new();

    [Fact]
    public void Validate_ConDatosValidos_NoDebeTenerErrores()
    {
        _sut.Validate(new RegisterTeamMemberCommand("Ana Torres", "Desarrollo")).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_ConNombreAusenteOVacio_DebeFallarSobreName(string? name)
    {
        var result = _sut.Validate(new RegisterTeamMemberCommand(name, "QA"));

        result.Errors.Should().ContainSingle().Which.PropertyName.Should().Be(TeamMemberRules.NameField);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_ConRolAusenteOVacio_DebeFallarSobreRole(string? role)
    {
        var result = _sut.Validate(new RegisterTeamMemberCommand("Ana", role));

        result.Errors.Should().ContainSingle().Which.PropertyName.Should().Be(TeamMemberRules.RoleField);
    }

    [Fact]
    public void Validate_ConNombreMuyLargo_NoDebeRechazarlo()
    {
        _sut.Validate(new RegisterTeamMemberCommand(new string('a', 5000), "QA")).IsValid.Should().BeTrue();
    }
}
