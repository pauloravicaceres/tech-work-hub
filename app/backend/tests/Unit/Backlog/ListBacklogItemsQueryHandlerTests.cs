using Backlog.Data;
using Backlog.Domain.BacklogItems;
using Backlog.Features.BacklogItems.ListBacklogItems;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Unit.Backlog;

/// <summary>HU-015 / T020 — GET /api/backlog-items: proyección mínima y orden determinista.</summary>
public class ListBacklogItemsQueryHandlerTests
{
    private static BacklogDbContext NewDb() =>
        new(new DbContextOptionsBuilder<BacklogDbContext>()
            .UseInMemoryDatabase($"list-{Guid.NewGuid()}")
            .Options);

    private static BacklogItem Item(string title, BacklogItemType type, DateTime createdAt)
    {
        var item = BacklogItem.Create(Guid.NewGuid(), title, null, type, BacklogItemPriority.High, null, 3m, null, null);
        item.MarkCreated(createdAt, "user-1");
        return item;
    }

    [Fact]
    public async Task Handle_SinElementos_DebeRetornarColeccionVacia()
    {
        // Arrange
        await using var db = NewDb();
        var sut = new ListBacklogItemsQueryHandler(db);

        // Act
        var result = await sut.Handle(new ListBacklogItemsQuery(), CancellationToken.None);

        // Assert
        result.Should().BeEmpty();
    }

    [Fact]
    public async Task Handle_ConVariosElementos_DebeOrdenarPorCreatedAtYMapearTipoComoTexto()
    {
        // Arrange
        await using var db = NewDb();
        var t0 = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var tardio = Item("item-102", BacklogItemType.Bug, t0.AddHours(2));
        var temprano = Item("item-101", BacklogItemType.TechEvolution, t0);
        db.BacklogItems.AddRange(tardio, temprano);
        await db.SaveChangesAsync();
        var sut = new ListBacklogItemsQueryHandler(db);

        // Act
        var result = await sut.Handle(new ListBacklogItemsQuery(), CancellationToken.None);

        // Assert
        result.Select(r => (r.Id, r.Title, r.Type)).Should().Equal(
            (temprano.Id, "item-101", "TechEvolution"),
            (tardio.Id, "item-102", "Bug"));
    }

    [Fact]
    public async Task Handle_ConCreatedAtIgual_DebeDesempatarPorIdDeFormaDeterminista()
    {
        // Arrange
        await using var db = NewDb();
        var t = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        db.BacklogItems.AddRange(
            Item("a", BacklogItemType.UserStory, t),
            Item("b", BacklogItemType.UserStory, t),
            Item("c", BacklogItemType.UserStory, t));
        await db.SaveChangesAsync();
        var sut = new ListBacklogItemsQueryHandler(db);

        // Act
        var result = await sut.Handle(new ListBacklogItemsQuery(), CancellationToken.None);

        // Assert
        result.Select(r => r.Id).Should().BeInAscendingOrder();
    }
}
