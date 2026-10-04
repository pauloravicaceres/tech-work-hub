using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Shared.Exceptions;
using Shared.Identity;
using Sprints.Data;
using Sprints.Domain.Sprints;
using Sprints.Features.Sprints.CreateSprint;
using Xunit;

namespace Unit.Sprints;

/// <summary>HU-003 / FR-001, FR-002, FR-010 — Handler aislado, sin base de datos.</summary>
public class CreateSprintCommandHandlerTests
{
    private readonly ISprintsDbContext _db = Substitute.For<ISprintsDbContext>();
    private readonly DbSet<Sprint> _sprints = Substitute.For<DbSet<Sprint>>();
    private readonly ICurrentUser _user = Substitute.For<ICurrentUser>();
    private readonly CreateSprintCommandHandler _sut;

    public CreateSprintCommandHandlerTests()
    {
        _db.Sprints.Returns(_sprints);
        _user.UserId.Returns("user-1");
        _sut = new(_db, _user);
    }

    private static CreateSprintCommand Valid() => new("Sprint 2026-01", "2026-10-05", "2026-10-18");

    private Sprint Captured() =>
        (Sprint)_sprints.ReceivedCalls()
            .First(c => c.GetMethodInfo().Name == nameof(DbSet<Sprint>.Add))
            .GetArguments()[0]!;

    private void AssertNothingPersisted()
    {
        _sprints.ReceivedCalls().Should().NotContain(c => c.GetMethodInfo().Name == nameof(DbSet<Sprint>.Add));
        _db.DidNotReceive().SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ConDatosValidos_DebePersistirYDevolverLosCuatroDatos()
    {
        // Act
        var response = await _sut.Handle(Valid(), CancellationToken.None);

        // Assert
        var sprint = Captured();
        response.Id.Should().Be(sprint.Id).And.NotBe(Guid.Empty);
        response.Identification.Should().Be("Sprint 2026-01");
        response.StartDate.Should().Be(new DateOnly(2026, 10, 5));
        response.EndDate.Should().Be(new DateOnly(2026, 10, 18));
        await _db.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_DebePropagarElCancellationTokenAlGuardar()
    {
        // Arrange
        using var cts = new CancellationTokenSource();

        // Act
        await _sut.Handle(Valid(), cts.Token);

        // Assert
        await _db.Received(1).SaveChangesAsync(cts.Token);
    }

    [Fact]
    public async Task Handle_SinClaimDeIdentidad_DebeLanzarUnauthorizedSinPersistir()
    {
        // Arrange (FR-010: la identidad se valida antes de cualquier acceso a datos)
        _user.UserId.Returns((string?)null);

        // Act
        var act = () => _sut.Handle(Valid(), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        AssertNothingPersisted();
    }

    [Fact]
    public async Task Handle_ConVentanaInvalidaQueEvadeElValidador_DebeLanzarBadRequestSinPersistir()
    {
        // Arrange: defensa en profundidad si el pipeline de validación no se ejecuta
        var cmd = new CreateSprintCommand("Sprint", "2026-10-05", "2026-10-12");

        // Act
        var act = () => _sut.Handle(cmd, CancellationToken.None);

        // Assert
        (await act.Should().ThrowAsync<BadRequestException>()).Which.Field.Should().Be(SprintRules.EndDateField);
        AssertNothingPersisted();
    }

    [Theory]
    [InlineData(null, "2026-10-18", SprintRules.StartDateField)]
    [InlineData("2026-10-05", "no-es-fecha", SprintRules.EndDateField)]
    public async Task Handle_ConFechaMalformadaQueEvadeElValidador_DebeLanzarBadRequestSobreElCampo(string? start, string? end, string field)
    {
        // Act
        var act = () => _sut.Handle(new CreateSprintCommand("Sprint", start, end), CancellationToken.None);

        // Assert
        (await act.Should().ThrowAsync<BadRequestException>()).Which.Field.Should().Be(field);
        AssertNothingPersisted();
    }

    [Fact]
    public async Task Handle_CuandoSaveChangesFalla_DebePropagarLaExcepcion()
    {
        // Arrange (FR-011)
        _db.SaveChangesAsync(Arg.Any<CancellationToken>())
            .Returns<Task<int>>(_ => throw new InvalidOperationException("db down"));

        // Act
        var act = () => _sut.Handle(Valid(), CancellationToken.None);

        // Assert
        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("db down");
    }
}
