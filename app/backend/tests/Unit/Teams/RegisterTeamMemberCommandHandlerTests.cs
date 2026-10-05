using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Shared.Exceptions;
using Shared.Identity;
using Teams.Data;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TeamMembers;
using Teams.Domain.TechnicalRoles;
using Teams.Features.TeamMembers;
using Teams.Features.TeamMembers.RegisterTeamMember;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-012 / FR-001, FR-006, FR-013 — handler sobre el contexto real en memoria.</summary>
public class RegisterTeamMemberCommandHandlerTests
{
    private readonly ICurrentUser _user = Substitute.For<ICurrentUser>();

    public RegisterTeamMemberCommandHandlerTests() => _user.UserId.Returns("user-1");

    [Theory]
    [InlineData("Desarrollo", "0b6f1d3a-5c1e-4d57-9a53-6a1c2f0e7b11")]
    [InlineData("QA", "7d2e9c48-3b6a-4f0c-8e15-b4a9d1c63f22")]
    public async Task Handle_ConRolDelCatalogo_DebePersistirUnMiembroYDevolverElNombreDelRol(string role, string roleId)
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var sut = new RegisterTeamMemberCommandHandler(db, _user);

        var response = await sut.Handle(new RegisterTeamMemberCommand("  Ana Torres  ", role), CancellationToken.None);

        var stored = await db.TeamMembers.AsNoTracking().SingleAsync();
        response.Should().Be(new TeamMemberResponse(stored.Id, "Ana Torres", role));
        stored.Name.Should().Be("Ana Torres");
        stored.TechnicalRoleId.Should().Be(Guid.Parse(roleId));
    }

    [Fact]
    public async Task Handle_DebeInvocarSaveChangesUnaSolaVezYPropagarElToken()
    {
        using var inner = TeamsInMemoryDb.CreateAudited(_user);
        var db = new CountingDb(inner);
        var sut = new RegisterTeamMemberCommandHandler(db, _user);
        using var cts = new CancellationTokenSource();

        await sut.Handle(new RegisterTeamMemberCommand("Ana", TechnicalRoleSeed.DevelopmentName), cts.Token);

        db.SaveCount.Should().Be(1);
        db.LastToken.Should().Be(cts.Token);
    }

    [Fact]
    public async Task Handle_ConRolInexistente_DebeLanzarBadRequestSinPersistir()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var sut = new RegisterTeamMemberCommandHandler(db, _user);

        var act = () => sut.Handle(new RegisterTeamMemberCommand("Ana", "Chef"), CancellationToken.None);

        var ex = (await act.Should().ThrowAsync<BadRequestException>()).Which;
        ex.Message.Should().Be(TeamMemberRules.InvalidRoleMessage);
        ex.Field.Should().Be(TeamMemberRules.RoleField);
        (await db.TeamMembers.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_ConRolEnOtraCapitalizacion_DebeRechazarlo()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var sut = new RegisterTeamMemberCommandHandler(db, _user);

        var act = () => sut.Handle(new RegisterTeamMemberCommand("Ana", "desarrollo"), CancellationToken.None);

        await act.Should().ThrowAsync<BadRequestException>();
    }

    [Fact]
    public async Task Handle_SinClaimDeIdentidad_DebeLanzarUnauthorizedSinPersistir()
    {
        _user.UserId.Returns((string?)null);
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var sut = new RegisterTeamMemberCommandHandler(db, _user);

        var act = () => sut.Handle(new RegisterTeamMemberCommand("Ana", "QA"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        (await db.TeamMembers.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_ConNombreVacioQueEvadeElValidador_DebeLanzarBadRequestSobreName()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var sut = new RegisterTeamMemberCommandHandler(db, _user);

        var act = () => sut.Handle(new RegisterTeamMemberCommand("   ", "QA"), CancellationToken.None);

        (await act.Should().ThrowAsync<BadRequestException>()).Which.Field.Should().Be(TeamMemberRules.NameField);
        (await db.TeamMembers.CountAsync()).Should().Be(0);
    }

    /// <summary>Envuelve el contexto real para contar y observar las llamadas a <c>SaveChangesAsync</c>.</summary>
    private sealed class CountingDb(TeamsDbContext inner) : ITeamsDbContext
    {
        public int SaveCount { get; private set; }
        public CancellationToken LastToken { get; private set; }

        public DbSet<TeamMember> TeamMembers => inner.TeamMembers;
        public DbSet<TechnicalRole> TechnicalRoles => inner.TechnicalRoles;
        public DbSet<ItemAssignment> ItemAssignments => inner.ItemAssignments;

        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SaveCount++;
            LastToken = cancellationToken;
            return inner.SaveChangesAsync(cancellationToken);
        }
    }
}
