using Teams.Contracts;

namespace Integration.Teams;

/// <summary>Doble escrito a mano del contrato <see cref="IBacklogItemLookup"/> para el host real de Teams: lista mutable de elementos conocidos.</summary>
public sealed class FakeBacklogItemLookup : IBacklogItemLookup
{
    private readonly Dictionary<Guid, BacklogItemRef> _items = [];

    public int GetItemsCalls { get; private set; }

    public Guid Add(string title = "Elemento", string type = "UserStory", Guid? id = null)
    {
        var itemId = id ?? Guid.NewGuid();
        _items[itemId] = new BacklogItemRef(itemId, title, type);
        return itemId;
    }

    public void Remove(Guid id) => _items.Remove(id);

    public Task<bool> ExistsAsync(Guid itemId, CancellationToken ct) => Task.FromResult(_items.ContainsKey(itemId));

    public Task<IReadOnlyCollection<BacklogItemRef>> GetItemsAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken ct)
    {
        GetItemsCalls++;
        IReadOnlyCollection<BacklogItemRef> found = [.. itemIds.Where(_items.ContainsKey).Select(id => _items[id])];
        return Task.FromResult(found);
    }
}
