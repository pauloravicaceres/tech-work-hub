using Backlog.Domain.BacklogItems;
using Backlog.Features.BacklogItems.CreateBacklogItem;
using FluentAssertions;
using FluentValidation.TestHelper;
using Xunit;

namespace Unit.Backlog;

/// <summary>HU-001 / SC-03, SC-04, SC-05, CB-01..CB-03 — aislamiento del AbstractValidator.</summary>
public class CreateBacklogItemValidatorTests
{
    private readonly CreateBacklogItemValidator _sut = new();

    private static CreateBacklogItemCommand Valid(
        string title = "Implementar autenticación OIDC",
        string type = "UserStory",
        BacklogItemPriority priority = BacklogItemPriority.High,
        decimal? dev = 5m,
        decimal? qa = 3m) =>
        new(title, "desc", type, priority, "criterios", dev, qa, null);

    [Fact]
    public void Validate_ConComandoCompleto_NoDebeGenerarErrores()
    {
        // Arrange
        var command = Valid();

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public void Validate_ConTituloVacioONulo_DebeFallarEnTitle(string? title)
    {
        // Arrange
        var command = Valid(title: title!);

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validate_ConTituloDe200Caracteres_DebeSerValido()
    {
        // Arrange
        var command = Valid(title: new string('a', 200));

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Validate_ConTituloDe201Caracteres_DebeFallarEnTitle()
    {
        // Arrange (CB-01)
        var command = Valid(title: new string('a', 201));

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Theory]
    [InlineData("UserStory")]
    [InlineData("Bug")]
    [InlineData("TechEvolution")]
    [InlineData("TechRequirement")]
    [InlineData("TechDebt")]
    [InlineData("Research")]
    [InlineData("Spike")]
    [InlineData("spike")]
    public void Validate_ConTipoDelCatalogo_NoDebeFallarEnType(string type)
    {
        // Arrange
        var command = Valid(type: type);

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Type);
    }

    [Theory]
    [InlineData("EpicGlobalInvalida")]
    [InlineData("")]
    [InlineData("1")]
    [InlineData("UserStory,Bug")]
    public void Validate_ConTipoFueraDelCatalogo_DebeFallarEnType(string type)
    {
        // Arrange (SC-04 / CB-02)
        var command = Valid(type: type);

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Type);
    }

    [Fact]
    public void Validate_ConTipoNulo_DebeFallarEnType()
    {
        // Arrange: un JSON sin "type" deserializa a null; no debe llegar al Enum.Parse del handler.
        var command = Valid(type: null!);

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Type);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(99)]
    [InlineData(-1)]
    public void Validate_ConPrioridadFueraDeEnum_DebeFallarEnPriority(int raw)
    {
        // Arrange
        var command = Valid(priority: (BacklogItemPriority)raw);

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Priority);
    }

    [Theory]
    [InlineData(-3.0)]
    [InlineData(-0.01)]
    public void Validate_ConDevPointsNegativos_DebeFallarEnDevPoints(double raw)
    {
        // Arrange (SC-05 / CB-03)
        var command = Valid(dev: (decimal)raw);

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.DevPoints);
        result.ShouldNotHaveValidationErrorFor(x => x.QAPoints);
    }

    [Fact]
    public void Validate_ConQaPointsNegativos_DebeFallarEnQaPoints()
    {
        // Arrange
        var command = Valid(qa: -1m);

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.QAPoints);
        result.ShouldNotHaveValidationErrorFor(x => x.DevPoints);
    }

    [Fact]
    public void Validate_ConDescriptionYCriteriosEnElLimite_NoDebeFallar()
    {
        // Arrange (FR-012: frontera inclusiva)
        var command = Valid() with
        {
            Description = new string('d', BacklogItemRules.DescriptionMaxLength),
            AcceptanceCriteria = new string('c', BacklogItemRules.AcceptanceCriteriaMaxLength)
        };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldNotHaveValidationErrorFor(x => x.Description);
        result.ShouldNotHaveValidationErrorFor(x => x.AcceptanceCriteria);
    }

    [Fact]
    public void Validate_ConDescriptionMasLargaQueElLimite_DebeFallarEnDescription()
    {
        // Arrange (FR-012)
        var command = Valid() with { Description = new string('d', BacklogItemRules.DescriptionMaxLength + 1) };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Fact]
    public void Validate_ConCriteriosMasLargosQueElLimite_DebeFallarEnAcceptanceCriteria()
    {
        // Arrange (FR-012)
        var command = Valid() with { AcceptanceCriteria = new string('c', BacklogItemRules.AcceptanceCriteriaMaxLength + 1) };

        // Act
        var result = _sut.TestValidate(command);

        // Assert
        result.ShouldHaveValidationErrorFor(x => x.AcceptanceCriteria);
    }

    [Fact]
    public void Validate_ConPuntosEnCeroONulos_NoDebeFallar()
    {
        // Arrange (SC-02: qaPoints null; límite inferior 0 permitido)
        var zero = Valid(dev: 0m, qa: 0m);
        var nulls = Valid(dev: null, qa: null);

        // Act
        var r1 = _sut.TestValidate(zero);
        var r2 = _sut.TestValidate(nulls);

        // Assert
        r1.IsValid.Should().BeTrue();
        r2.IsValid.Should().BeTrue();
    }
}
