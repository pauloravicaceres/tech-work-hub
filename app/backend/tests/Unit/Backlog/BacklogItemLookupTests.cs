using Backlog;
using Backlog.Data;
using Backlog.Domain.BacklogItems;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Unit.Backlog;

/// <summary>HU-015 / FR-014, FR-008 — Contrato in-process IBacklogItemLookup sobre EF InMemory.</summary>
public class BacklogItemLookupTests
{
    private static BacklogDbContext NewDb() =>
        new(new DbContextOptionsBuilder<BacklogDbContext>()
            .UseInMemoryDatabase($"lookup-{Guid.NewGuid()}")
            .Options);

    private static BacklogItem Item(Guid id, string title, BacklogItemType type)
    {
        var item = BacklogItem.Create(id, title, "desc", type, BacklogItemPriority.Medium, "ac", 5m, null, null);
        item.MarkCreated(DateTime.UtcNow, "user-1");
        return item;
    }

    [Fact]
    public async Task ExistsAsync_ConElementoPersistido_DebeRetornarVerdadero()
    {
        // Arrange
        await using var db = NewDb();
        var id = Guid.NewGuid();
        db.BacklogItems.Add(Item(id, "item-101", BacklogItemType.UserStory));
        await db.SaveChangesAsync();
        var sut = new BacklogItemLookup(db);

        // Act
        var exists = await sut.ExistsAsync(id, CancellationToken.None);

        // Assert
        exists.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_ConIdInexistenteOGuidVacio_DebeRetornarFalso()
    {
        // Arrange
        await using var db = NewDb();
        db.BacklogItems.Add(Item(Guid.NewGuid(), "item-101", BacklogItemType.Bug));
        await db.SaveChangesAsync();
        var sut = new BacklogItemLookup(db);

        // Act
        var otro = await sut.ExistsAsync(Guid.NewGuid(), CancellationToken.None);
        var vacio = await sut.ExistsAsync(Guid.Empty, CancellationToken.None);

        // Assert
        otro.Should().BeFalse();
        vacio.Should().BeFalse();
    }

    [Fact]
    public async Task GetItemsAsync_ConSubconjuntoDeIds_DebeRetornarSoloEsosConTipoComoTexto()
    {
        // Arrange
        await using var db = NewDb();
        var a = Guid.NewGuid();
        var b = Guid.NewGuid();
        var c = Guid.NewGuid();
        db.BacklogItems.AddRange(
            Item(a, "item-101", BacklogItemType.UserStory),
            Item(b, "item-102", BacklogItemType.TechDebt),
            Item(c, "item-103", BacklogItemType.Bug));
        await db.SaveChangesAsync();
        var sut = new BacklogItemLookup(db);

        // Act
        var result = await sut.GetItemsAsync([a, b], CancellationToken.None);

        // Assert
        result.Should().BeEquivalentTo(new[]
        {
            new Teams.Contracts.BacklogItemRef(a, "item-101", "UserStory"),
            new Teams.Contracts.BacklogItemRef(b, "item-102", "TechDebt")
        });
    }

    [Fact]
    public async Task GetItemsAsync_ConColeccionVaciaOIdsInexistentes_DebeRetornarColeccionVacia()
    {
        // Arrange
        await using var db = NewDb();
        db.BacklogItems.Add(Item(Guid.NewGuid(), "item-101", BacklogItemType.UserStory));
        await db.SaveChangesAsync();
        var sut = new BacklogItemLookup(db);

        // Act
        var vacio = await sut.GetItemsAsync([], CancellationToken.None);
        var inexistentes = await sut.GetItemsAsync([Guid.NewGuid()], CancellationToken.None);

        // Assert
        vacio.Should().BeEmpty();
        inexistentes.Should().BeEmpty();
    }

    [Fact]
    public void BacklogItemRef_NoExponeEstimacionesEstadoNiSprint_DebeTenerSoloIdTitleYType()
    {
        // Arrange
        var props = typeof(Teams.Contracts.BacklogItemRef).GetProperties().Select(p => p.Name);

        // Act
        var names = props.Where(n => n != "EqualityContract").ToArray();

        // Assert
        names.Should().BeEquivalentTo("Id", "Title", "Type");
    }
}
