using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Shared.Exceptions;
using Shared.Identity;
using Teams.Data;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TeamMembers;
using Teams.Domain.TechnicalRoles;
using Teams.Features.ItemAssignments;
using Teams.Features.ItemAssignments.AssignMemberToItem;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-015 / US1, US5 — handler de asignación sobre el contexto real en memoria y el doble escrito a mano del contrato.</summary>
public class AssignMemberToItemCommandHandlerTests
{
    private readonly ICurrentUser _user = Substitute.For<ICurrentUser>();
    private readonly FakeBacklogItemLookup _items = new();
    private readonly Guid _itemId = Guid.NewGuid();

    public AssignMemberToItemCommandHandlerTests()
    {
        _user.UserId.Returns("user-1");
        _items.With(_itemId, "item-101");
    }

    private AssignMemberToItemCommand Cmd(Guid memberId) => new(_itemId.ToString(), memberId.ToString());

    [Fact]
    public async Task Handle_ConMiembroYElementoValidos_DebeCrearConElRolTecnicoVigenteDelMiembro()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);

        var result = await sut.Handle(Cmd(ana.Id), CancellationToken.None);

        result.Created.Should().BeTrue();
        result.Response.Should().Be(new ItemAssigneeResponse(_itemId, ana.Id, "Ana Torres", "Desarrollo"));
        var stored = await db.ItemAssignments.AsNoTracking().SingleAsync();
        stored.ItemId.Should().Be(_itemId);
        stored.MemberId.Should().Be(ana.Id);
    }

    [Fact]
    public async Task Handle_DebeAuditarConElSubDelUsuarioActual()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana", TechnicalRoleSeed.DevelopmentId);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);

        await sut.Handle(Cmd(ana.Id), CancellationToken.None);

        var stored = await db.ItemAssignments.AsNoTracking().SingleAsync();
        stored.CreatedBy.Should().Be("user-1");
        stored.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(10));
    }

    [Fact]
    public async Task Handle_UnSegundoMiembroSobreElMismoElemento_DebeConservarIntactaLaFilaDelPrimero()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana", TechnicalRoleSeed.DevelopmentId);
        var luis = await TeamsInMemoryDb.SeedMemberAsync(db, "Luis", TechnicalRoleSeed.QaId);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);
        await sut.Handle(Cmd(ana.Id), CancellationToken.None);
        var anaRow = await db.ItemAssignments.AsNoTracking().SingleAsync();

        var result = await sut.Handle(Cmd(luis.Id), CancellationToken.None);

        result.Created.Should().BeTrue();
        result.Response.Role.Should().Be("QA");
        var rows = await db.ItemAssignments.AsNoTracking().ToListAsync();
        rows.Should().HaveCount(2);
        rows.Single(r => r.Id == anaRow.Id).Should().BeEquivalentTo(anaRow);
    }

    [Fact]
    public async Task Handle_ConParYaExistente_DebeDevolverExistenteSinInsertarNiAlterarAuditoria()
    {
        using var inner = TeamsInMemoryDb.CreateAudited(_user);
        var ana = await TeamsInMemoryDb.SeedMemberAsync(inner, "Ana", TechnicalRoleSeed.DevelopmentId);
        var db = new CountingDb(inner);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);
        await sut.Handle(Cmd(ana.Id), CancellationToken.None);
        var row = await inner.ItemAssignments.AsNoTracking().SingleAsync();
        db.SaveCount = 0;

        var result = await sut.Handle(Cmd(ana.Id), CancellationToken.None);

        result.Created.Should().BeFalse();
        result.Response.MemberName.Should().Be("Ana");
        db.SaveCount.Should().Be(0);
        (await inner.ItemAssignments.AsNoTracking().SingleAsync()).Should().BeEquivalentTo(row);
    }

    [Fact]
    public async Task Handle_DebeInvocarSaveChangesUnaSolaVezPorAsignacionNuevaYPropagarElToken()
    {
        using var inner = TeamsInMemoryDb.CreateAudited(_user);
        var ana = await TeamsInMemoryDb.SeedMemberAsync(inner, "Ana", TechnicalRoleSeed.DevelopmentId);
        var db = new CountingDb(inner);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);
        using var cts = new CancellationTokenSource();

        await sut.Handle(Cmd(ana.Id), cts.Token);

        db.SaveCount.Should().Be(1);
        db.LastToken.Should().Be(cts.Token);
        _items.LastToken.Should().Be(cts.Token);
    }

    [Fact]
    public async Task Handle_ConMiembroInexistente_DebeLanzarNotFoundDeMiembroSinConsultarElContrato()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);

        var act = () => sut.Handle(Cmd(Guid.NewGuid()), CancellationToken.None);

        (await act.Should().ThrowAsync<NotFoundException>()).Which.Message.Should().Contain(ItemAssignmentRules.MemberNotFoundMessage);
        _items.ExistsCalls.Should().Be(0);
        (await db.ItemAssignments.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_ConElementoInexistente_DebeLanzarNotFoundDeElementoSinPersistir()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana", TechnicalRoleSeed.DevelopmentId);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);

        var act = () => sut.Handle(new AssignMemberToItemCommand(Guid.NewGuid().ToString(), ana.Id.ToString()), CancellationToken.None);

        (await act.Should().ThrowAsync<NotFoundException>()).Which.Message.Should().Contain(ItemAssignmentRules.ItemNotFoundMessage);
        (await db.ItemAssignments.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Handle_SinClaimDeIdentidad_DebeLanzarUnauthorizedAntesDeLeerNada()
    {
        using var db = TeamsInMemoryDb.CreateAudited(_user);
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana", TechnicalRoleSeed.DevelopmentId);
        _user.UserId.Returns((string?)null);
        var sut = new AssignMemberToItemCommandHandler(db, _items, _user);

        var act = () => sut.Handle(Cmd(ana.Id), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
        _items.ExistsCalls.Should().Be(0);
        (await db.ItemAssignments.CountAsync()).Should().Be(0);
    }

    /// <summary>Envuelve el contexto real para contar y observar las llamadas a <c>SaveChangesAsync</c>.</summary>
    private sealed class CountingDb(TeamsDbContext inner) : ITeamsDbContext
    {
        public int SaveCount { get; set; }
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
