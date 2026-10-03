using Backlog.Domain.BacklogItems;
using Backlog.Features.BacklogItems.CreateBacklogItem;
using FluentAssertions;
using FluentValidation;
using NSubstitute;
using Xunit;

namespace Unit.Backlog;

/// <summary>HU-001 / SC-01, SC-02, CB-04, CB-05 — Handler aislado, sin base de datos.</summary>
public class CreateBacklogItemCommandHandlerTests
{
    private readonly IBacklogDbContext _db = Substitute.For<IBacklogDbContext>();
    private readonly IApplicationModuleApi _apps = Substitute.For<IApplicationModuleApi>();
    private readonly CreateBacklogItemCommandHandler _sut;

    public CreateBacklogItemCommandHandlerTests() => _sut = new(_db, _apps);

    private static CreateBacklogItemCommand Cmd(string type, decimal? qa, Guid? app = null) =>
        new("Titulo", "d", type, BacklogItemPriority.Medium, "ac", 2m, qa, app);

    private BacklogItem Captured() =>
        (BacklogItem)_db.ReceivedCalls()
            .First(c => c.GetMethodInfo().Name == nameof(IBacklogDbContext.AddAsync))
            .GetArguments()[0]!;

    [Fact]
    public async Task Handle_ConUserStoryYPuntosCompletos_DebePersistirConservandoDevYQa()
    {
        // Arrange
        var cmd = Cmd("UserStory", 3m);

        // Act
        var id = await _sut.Handle(cmd, CancellationToken.None);

        // Assert
        var item = Captured();
        item.Id.Should().Be(id).And.NotBe(Guid.Empty);
        item.Type.Should().Be(BacklogItemType.UserStory);
        item.QAPoints.Should().Be(3m);
        item.Status.Should().Be(BacklogItemStatus.Backlog);
        await _db.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Theory]
    [InlineData("Spike")]
    [InlineData("Research")]
    [InlineData("TechDebt")]
    [InlineData("TechEvolution")]
    [InlineData("TechRequirement")]
    public async Task Handle_ConTipoTecnicoYQaPointsInformados_DebeForzarQaPointsNulo(string type)
    {
        // Arrange
        var cmd = Cmd(type, 8m);

        // Act
        await _sut.Handle(cmd, CancellationToken.None);

        // Assert
        Captured().QAPoints.Should().BeNull();
    }

    [Fact]
    public async Task Handle_ConBugYQaPoints_NoDebeAnularQaPoints()
    {
        // Arrange (Bug no es técnico; SC-05 usa qaPoints en Bug)
        var cmd = Cmd("Bug", 1m);

        // Act
        await _sut.Handle(cmd, CancellationToken.None);

        // Assert
        Captured().QAPoints.Should().Be(1m);
    }

    [Fact]
    public async Task Handle_ConTipoEnMinusculas_DebeResolverEnumIgnorandoCase()
    {
        // Arrange
        var cmd = Cmd("spike", null);

        // Act
        await _sut.Handle(cmd, CancellationToken.None);

        // Assert
        Captured().Type.Should().Be(BacklogItemType.Spike);
    }

    [Fact]
    public async Task Handle_ConApplicationIdInexistente_DebeLanzarValidationExceptionSinPersistir()
    {
        // Arrange (CB-04)
        var appId = Guid.NewGuid();
        _apps.ExistsAsync(appId, Arg.Any<CancellationToken>()).Returns(false);

        // Act
        var act = () => _sut.Handle(Cmd("UserStory", 1m, appId), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<ValidationException>();
        await _db.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
        _db.ReceivedCalls().Should().NotContain(c => c.GetMethodInfo().Name == nameof(IBacklogDbContext.AddAsync));
    }

    [Fact]
    public async Task Handle_ConApplicationIdExistente_DebePersistirConElVinculo()
    {
        // Arrange
        var appId = Guid.NewGuid();
        _apps.ExistsAsync(appId, Arg.Any<CancellationToken>()).Returns(true);

        // Act
        await _sut.Handle(Cmd("UserStory", 1m, appId), CancellationToken.None);

        // Assert
        Captured().ApplicationId.Should().Be(appId);
    }

    [Fact]
    public async Task Handle_SinApplicationId_NoDebeConsultarElCatalogoDeAplicaciones()
    {
        // Arrange
        var cmd = Cmd("Spike", null, null);

        // Act
        await _sut.Handle(cmd, CancellationToken.None);

        // Assert
        _apps.ReceivedCalls().Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ConTipoInvalidoQueEvadeValidador_DebeFallarSinPersistir()
    {
        // Arrange: defensa en profundidad si el pipeline de validación no se ejecuta (SC-04).
        var cmd = Cmd("EpicGlobalInvalida", null);

        // Act
        var act = () => _sut.Handle(cmd, CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<Exception>();
        await _db.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_CuandoSaveChangesFalla_DebePropagarLaExcepcion()
    {
        // Arrange (CB-05)
        _db.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns<Task<int>>(_ => throw new InvalidOperationException("db down"));

        // Act
        var act = () => _sut.Handle(Cmd("Bug", 1m), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("db down");
    }
}
