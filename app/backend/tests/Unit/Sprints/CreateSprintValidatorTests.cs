using FluentAssertions;
using Sprints.Domain.Sprints;
using Sprints.Features.Sprints.CreateSprint;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-003 / FR-003..FR-005 — el validador reporta cada error sobre su campo (camelCase).</summary>
public class CreateSprintValidatorTests
{
    private readonly CreateSprintValidator _sut = new();

    private static CreateSprintCommand Cmd(string? identification = "Sprint", string? start = "2026-10-05", string? end = "2026-10-18") =>
        new(identification, start, end);

    private string[] ErrorsFor(CreateSprintCommand command, string field) =>
        _sut.Validate(command).Errors.Where(e => e.PropertyName == field).Select(e => e.ErrorMessage).ToArray();

    [Fact]
    public void Validate_ConComandoValido_NoDebeProducirErrores()
    {
        _sut.Validate(Cmd()).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("2026-10-05", "2026-10-11", SprintRules.WindowMessage)] // 7 días
    [InlineData("2026-10-05", "2026-10-17", SprintRules.WindowMessage)] // 13 días: límite -1
    [InlineData("2026-10-05", "2026-10-19", SprintRules.WindowMessage)] // 15 días: límite +1
    [InlineData("2026-10-05", "2026-10-25", SprintRules.WindowMessage)] // 21 días
    [InlineData("2026-10-05", "2026-10-05", SprintRules.EndNotAfterStartMessage)] // fin = inicio
    [InlineData("2026-10-05", "2026-10-01", SprintRules.EndNotAfterStartMessage)] // fin < inicio
    public void Validate_ConVentanaInvalida_DebeRechazarSobreEndDateConElMensajeDeLaRegla(string start, string end, string message)
    {
        // Act
        var errors = ErrorsFor(Cmd(start: start, end: end), SprintRules.EndDateField);

        // Assert
        errors.Should().ContainSingle().Which.Should().Be(message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_ConIdentificacionAusente_DebeRechazarSobreIdentification(string? identification)
    {
        ErrorsFor(Cmd(identification: identification), SprintRules.IdentificationField)
            .Should().ContainSingle().Which.Should().Be(SprintRules.IdentificationRequiredMessage);
    }

    [Fact]
    public void Validate_ConIdentificacionDe101Caracteres_DebeRechazar()
    {
        ErrorsFor(Cmd(identification: new string('x', SprintRules.IdentificationMaxLength + 1)), SprintRules.IdentificationField)
            .Should().ContainSingle().Which.Should().Be(SprintRules.IdentificationTooLongMessage);
    }

    [Fact]
    public void Validate_ConIdentificacionDe100Caracteres_DebeAceptar()
    {
        _sut.Validate(Cmd(identification: new string('x', SprintRules.IdentificationMaxLength))).IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Validate_ConFechaDeInicioAusente_DebeRechazarSobreStartDate(string? start)
    {
        ErrorsFor(Cmd(start: start), SprintRules.StartDateField)
            .Should().ContainSingle().Which.Should().Be(SprintRules.StartDateRequiredMessage);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    public void Validate_ConFechaDeFinAusente_DebeRechazarSobreEndDate(string? end)
    {
        ErrorsFor(Cmd(end: end), SprintRules.EndDateField)
            .Should().ContainSingle().Which.Should().Be(SprintRules.EndDateRequiredMessage);
    }

    [Theory]
    [InlineData("no-es-fecha")]
    [InlineData("05/10/2026")]
    [InlineData("2026-13-40")]
    [InlineData("2026-10-05T00:00:00")]
    public void Validate_ConFormatoDeFechaInvalido_DebeRechazarSobreElCampoDeFormatoSinErrorDeVentana(string value)
    {
        // Act
        var start = ErrorsFor(Cmd(start: value), SprintRules.StartDateField);
        var end = ErrorsFor(Cmd(end: value), SprintRules.EndDateField);

        // Assert: un formato inválido no genera además un error de ventana
        start.Should().ContainSingle().Which.Should().Be(SprintRules.StartDateFormatMessage);
        end.Should().ContainSingle().Which.Should().Be(SprintRules.EndDateFormatMessage);
    }
}
