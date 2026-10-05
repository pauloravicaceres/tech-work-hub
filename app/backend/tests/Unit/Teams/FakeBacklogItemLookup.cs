using Teams.Contracts;

namespace Unit.Teams;

/// <summary>Doble escrito a mano de <see cref="IBacklogItemLookup"/>: elementos configurables y registro de llamadas.</summary>
internal sealed class FakeBacklogItemLookup : IBacklogItemLookup
{
    private readonly Dictionary<Guid, BacklogItemRef> _items = [];

    public int ExistsCalls { get; private set; }
    public int GetItemsCalls { get; private set; }
    public CancellationToken LastToken { get; private set; }
    public IReadOnlyCollection<Guid> LastRequestedIds { get; private set; } = [];

    public FakeBacklogItemLookup With(Guid id, string title = "Elemento", string type = "UserStory")
    {
        _items[id] = new BacklogItemRef(id, title, type);
        return this;
    }

    public Task<bool> ExistsAsync(Guid itemId, CancellationToken ct)
    {
        ExistsCalls++;
        LastToken = ct;
        return Task.FromResult(_items.ContainsKey(itemId));
    }

    public Task<IReadOnlyCollection<BacklogItemRef>> GetItemsAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken ct)
    {
        GetItemsCalls++;
        LastToken = ct;
        LastRequestedIds = itemIds;
        IReadOnlyCollection<BacklogItemRef> found = [.. itemIds.Where(_items.ContainsKey).Select(id => _items[id])];
        return Task.FromResult(found);
    }
}
