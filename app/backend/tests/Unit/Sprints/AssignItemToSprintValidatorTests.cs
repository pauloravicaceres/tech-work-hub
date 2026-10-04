using FluentAssertions;
using Sprints.Domain.SprintItems;
using Sprints.Features.SprintItems.AssignItemToSprint;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-004 / US3 — validación de identificadores; los errores salen bajo las claves sprintId / itemId.</summary>
public class AssignItemToSprintValidatorTests
{
    private const string ValidGuid = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
    private const string EmptyGuid = "00000000-0000-0000-0000-000000000000";

    private readonly AssignItemToSprintValidator _sut = new();

    [Fact]
    public void Validate_ConIdentificadoresValidos_NoDebeGenerarErrores()
    {
        // Act
        var result = _sut.Validate(new AssignItemToSprintCommand(ValidGuid, Guid.NewGuid().ToString()));

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("no-es-guid")]
    [InlineData("12345")]
    [InlineData(EmptyGuid)]
    public void Validate_ConSprintIdInvalido_DebeGenerarErrorBajoSprintId(string? sprintId)
    {
        // Act
        var result = _sut.Validate(new AssignItemToSprintCommand(sprintId, ValidGuid));

        // Assert
        result.Errors.Select(e => e.PropertyName).Should().BeEquivalentTo([SprintItemRules.SprintIdField]);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("no-es-guid")]
    [InlineData("12345")]
    [InlineData(EmptyGuid)]
    public void Validate_ConItemIdInvalido_DebeGenerarErrorBajoItemId(string? itemId)
    {
        // Act
        var result = _sut.Validate(new AssignItemToSprintCommand(ValidGuid, itemId));

        // Assert
        result.Errors.Select(e => e.PropertyName).Should().BeEquivalentTo([SprintItemRules.ItemIdField]);
    }

    [Fact]
    public void Validate_ConAmbosInvalidos_DebeReportarAmbosCampos()
    {
        // Act
        var result = _sut.Validate(new AssignItemToSprintCommand(null, "no-es-guid"));

        // Assert
        result.Errors.Select(e => e.PropertyName).Should().BeEquivalentTo([SprintItemRules.SprintIdField, SprintItemRules.ItemIdField]);
    }

    [Fact]
    public void Validate_ConIdentificadorAusente_DebeUsarElMensajeDeObligatorio()
    {
        // Act
        var result = _sut.Validate(new AssignItemToSprintCommand(ValidGuid, null));

        // Assert
        result.Errors.Should().ContainSingle().Which.ErrorMessage.Should().Be(SprintItemRules.ItemIdRequiredMessage);
    }

    [Fact]
    public void Validate_ConIdentificadorMalformado_DebeUsarElMensajeDeFormato()
    {
        // Act
        var result = _sut.Validate(new AssignItemToSprintCommand("no-es-guid", ValidGuid));

        // Assert
        result.Errors.Should().ContainSingle().Which.ErrorMessage.Should().Be(SprintItemRules.SprintIdFormatMessage);
    }
}
