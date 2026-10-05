using FluentAssertions;
using Teams.Domain.ItemAssignments;
using Teams.Features.ItemAssignments.AssignMemberToItem;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-015 / US4 — validación de formato de los identificadores, con errores por campo.</summary>
public class AssignMemberToItemValidatorTests
{
    private readonly AssignMemberToItemValidator _sut = new();
    private static readonly string ValidGuid = Guid.NewGuid().ToString();

    [Fact]
    public void Validate_ConGuidsValidos_NoDebeTenerErrores()
    {
        _sut.Validate(new AssignMemberToItemCommand(ValidGuid, ValidGuid)).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_ConItemIdAusente_DebeFallarBajoItemIdConMensajeDeObligatorio(string? itemId)
    {
        var result = _sut.Validate(new AssignMemberToItemCommand(itemId!, ValidGuid));

        result.Errors.Should().ContainSingle()
            .Which.Should().Match<FluentValidation.Results.ValidationFailure>(f =>
                f.PropertyName == ItemAssignmentRules.ItemIdField && f.ErrorMessage == ItemAssignmentRules.ItemIdRequiredMessage);
    }

    [Theory]
    [InlineData("item-101")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public void Validate_ConItemIdMalFormadoOVacio_DebeFallarBajoItemIdConMensajeDeFormato(string itemId)
    {
        var result = _sut.Validate(new AssignMemberToItemCommand(itemId, ValidGuid));

        result.Errors.Should().ContainSingle()
            .Which.Should().Match<FluentValidation.Results.ValidationFailure>(f =>
                f.PropertyName == ItemAssignmentRules.ItemIdField && f.ErrorMessage == ItemAssignmentRules.ItemIdInvalidMessage);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_ConMemberIdAusente_DebeFallarBajoMemberIdConMensajeDeObligatorio(string? memberId)
    {
        var result = _sut.Validate(new AssignMemberToItemCommand(ValidGuid, memberId));

        result.Errors.Should().ContainSingle()
            .Which.Should().Match<FluentValidation.Results.ValidationFailure>(f =>
                f.PropertyName == ItemAssignmentRules.MemberIdField && f.ErrorMessage == ItemAssignmentRules.MemberIdRequiredMessage);
    }

    [Theory]
    [InlineData("ana")]
    [InlineData("00000000-0000-0000-0000-000000000000")]
    public void Validate_ConMemberIdMalFormadoOVacio_DebeFallarBajoMemberIdConMensajeDeFormato(string memberId)
    {
        var result = _sut.Validate(new AssignMemberToItemCommand(ValidGuid, memberId));

        result.Errors.Should().ContainSingle()
            .Which.Should().Match<FluentValidation.Results.ValidationFailure>(f =>
                f.PropertyName == ItemAssignmentRules.MemberIdField && f.ErrorMessage == ItemAssignmentRules.MemberIdInvalidMessage);
    }

    [Fact]
    public void Validate_ConAmbosInvalidos_DebeReportarUnErrorPorCampo()
    {
        var result = _sut.Validate(new AssignMemberToItemCommand("x", null));

        result.Errors.Select(e => e.PropertyName).Should()
            .BeEquivalentTo(ItemAssignmentRules.ItemIdField, ItemAssignmentRules.MemberIdField);
    }
}
