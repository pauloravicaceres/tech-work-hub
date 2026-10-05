using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Teams.Data;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TechnicalRoles;
using Teams.Features.ItemAssignments;
using Teams.Features.ItemAssignments.ListMemberItems;
using Xunit;

namespace Unit.Teams;

/// <summary>HU-015 / US3 — consulta persona→tarjetas: una sola llamada de lote al contrato, sin N+1.</summary>
public class ListMemberItemsQueryHandlerTests
{
    private readonly FakeBacklogItemLookup _items = new();
    private readonly RecordingLogger _logger = new();

    private static ItemAssignment Assign(Guid itemId, Guid memberId, DateTime at)
    {
        var assignment = ItemAssignment.Create(itemId, memberId);
        assignment.MarkCreated(at, "seed-user");
        return assignment;
    }

    private ListMemberItemsQueryHandler Sut(ITeamsDbContext db) => new(db, _items, _logger);

    [Fact]
    public async Task Handle_ConDosElementos_DebeDevolverExactamenteEsosConUnaSolaLlamadaAlContrato()
    {
        using var db = TeamsInMemoryDb.Create();
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana", TechnicalRoleSeed.DevelopmentId);
        var item101 = Guid.NewGuid();
        var item102 = Guid.NewGuid();
        _items.With(item101, "item-101", "UserStory").With(item102, "item-102", "Bug").With(Guid.NewGuid(), "otro");
        db.ItemAssignments.AddRange(
            Assign(item101, ana.Id, DateTime.UtcNow.AddMinutes(-2)),
            Assign(item102, ana.Id, DateTime.UtcNow.AddMinutes(-1)));
        await db.SaveChangesAsync();
        using var cts = new CancellationTokenSource();

        var result = await Sut(db).Handle(new ListMemberItemsQuery(ana.Id), cts.Token);

        result.Should().Equal(
            new MemberItemResponse(item101, "item-101", "UserStory"),
            new MemberItemResponse(item102, "item-102", "Bug"));
        _items.GetItemsCalls.Should().Be(1);
        _items.LastRequestedIds.Should().BeEquivalentTo([item101, item102]);
        _items.LastToken.Should().Be(cts.Token);
    }

    [Fact]
    public async Task Handle_MiembroSinElementosOInexistente_DebeDevolverVacioSinLlamarAlContrato()
    {
        using var db = TeamsInMemoryDb.Create();
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana", TechnicalRoleSeed.DevelopmentId);

        var withoutItems = await Sut(db).Handle(new ListMemberItemsQuery(ana.Id), CancellationToken.None);
        var unknown = await Sut(db).Handle(new ListMemberItemsQuery(Guid.NewGuid()), CancellationToken.None);

        withoutItems.Should().BeEmpty();
        unknown.Should().BeEmpty();
        _items.GetItemsCalls.Should().Be(0);
    }

    [Fact]
    public async Task Handle_ConUnElementoQueElContratoYaNoDevuelve_DebeOmitirloYRegistrarWarningSinInventarTitulo()
    {
        using var db = TeamsInMemoryDb.Create();
        var ana = await TeamsInMemoryDb.SeedMemberAsync(db, "Ana Torres", TechnicalRoleSeed.DevelopmentId);
        var kept = Guid.NewGuid();
        var gone = Guid.NewGuid();
        _items.With(kept, "item-101");
        db.ItemAssignments.AddRange(
            Assign(kept, ana.Id, DateTime.UtcNow.AddMinutes(-2)),
            Assign(gone, ana.Id, DateTime.UtcNow.AddMinutes(-1)));
        await db.SaveChangesAsync();

        var result = await Sut(db).Handle(new ListMemberItemsQuery(ana.Id), CancellationToken.None);

        result.Should().ContainSingle().Which.Id.Should().Be(kept);
        _logger.Warnings.Should().ContainSingle().Which.Should().Contain(gone.ToString()).And.NotContain("Ana Torres");
    }

    private sealed class RecordingLogger : ILogger<ListMemberItemsQueryHandler>
    {
        public List<string> Warnings { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
        {
            if (logLevel == LogLevel.Warning) Warnings.Add(formatter(state, exception));
        }

        private sealed class NullScope : IDisposable
        {
            public static readonly NullScope Instance = new();
            public void Dispose() { }
        }
    }
}
