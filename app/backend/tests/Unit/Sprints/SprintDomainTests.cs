using FluentAssertions;
using Shared.Exceptions;
using Sprints.Domain.Sprints;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-003 / FR-003, FR-004, FR-015 — invariante de ventana en el dominio, sin base de datos.</summary>
public class SprintDomainTests
{
    private static readonly DateOnly Start = new(2026, 10, 5);

    [Fact]
    public void Create_ConVentanaDe14DiasInclusivos_DebeCrearConIdGeneradoYFechasIntactas()
    {
        // Arrange
        var end = Start.AddDays(SprintRules.WindowDays - 1);

        // Act
        var sprint = Sprint.Create("Sprint 2026-01", Start, end);

        // Assert
        sprint.Id.Should().NotBe(Guid.Empty);
        sprint.Identification.Should().Be("Sprint 2026-01");
        sprint.StartDate.Should().Be(Start);
        sprint.EndDate.Should().Be(new DateOnly(2026, 10, 18));
    }

    [Theory]
    [InlineData(7)]
    [InlineData(13)]
    [InlineData(15)]
    [InlineData(21)]
    public void Create_ConVentanaDistintaDe14Dias_DebeLanzarBadRequestSobreEndDate(int windowDays)
    {
        // Arrange
        var end = Start.AddDays(windowDays - 1);

        // Act
        var act = () => Sprint.Create("Sprint", Start, end);

        // Assert
        var ex = act.Should().Throw<BadRequestException>().Which;
        ex.Field.Should().Be(SprintRules.EndDateField);
        ex.Message.Should().Be(SprintRules.WindowMessage);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-13)]
    public void Create_ConFinIgualOAnteriorAlInicio_DebeLanzarBadRequestConMensajeDeOrden(int offsetDays)
    {
        // Arrange
        var end = Start.AddDays(offsetDays);

        // Act
        var act = () => Sprint.Create("Sprint", Start, end);

        // Assert
        var ex = act.Should().Throw<BadRequestException>().Which;
        ex.Field.Should().Be(SprintRules.EndDateField);
        ex.Message.Should().Be(SprintRules.EndNotAfterStartMessage);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_ConIdentificacionVaciaOEspacios_DebeLanzarBadRequestSobreIdentification(string identification)
    {
        // Act
        var act = () => Sprint.Create(identification, Start, Start.AddDays(SprintRules.WindowDays - 1));

        // Assert
        act.Should().Throw<BadRequestException>().Which.Field.Should().Be(SprintRules.IdentificationField);
    }

    [Fact]
    public void Create_DosVeces_DebeGenerarIdentificadoresDistintos()
    {
        // Arrange
        var end = Start.AddDays(SprintRules.WindowDays - 1);

        // Act
        var first = Sprint.Create("Sprint", Start, end);
        var second = Sprint.Create("Sprint", Start, end);

        // Assert (ADR-006: la identificación no es única, el Id sí)
        first.Id.Should().NotBe(second.Id);
    }
}
