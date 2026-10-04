using Sprints.Contracts;

namespace Unit.Sprints;

/// <summary>Doble escrito a mano de <see cref="IBacklogModuleApi"/>: elementos configurables, contadores de llamadas y fallo opcional.</summary>
internal sealed class FakeBacklogModuleApi : IBacklogModuleApi
{
    private readonly Dictionary<Guid, BacklogItemSummary> _items = [];

    public int ExistsCalls { get; private set; }
    public int SummariesCalls { get; private set; }
    public IReadOnlyCollection<Guid>? LastRequestedIds { get; private set; }
    public Exception? ExceptionToThrow { get; set; }

    public int TotalCalls => ExistsCalls + SummariesCalls;

    public BacklogItemSummary Add(Guid id, string title = "Elemento", string type = "UserStory", decimal? devPoints = 3, decimal? qaPoints = 2)
    {
        var summary = new BacklogItemSummary(id, title, type, devPoints, qaPoints);
        _items[id] = summary;
        return summary;
    }

    public Task<bool> ExistsAsync(Guid itemId, CancellationToken cancellationToken)
    {
        ExistsCalls++;
        if (ExceptionToThrow is not null) throw ExceptionToThrow;
        return Task.FromResult(_items.ContainsKey(itemId));
    }

    public Task<IReadOnlyList<BacklogItemSummary>> GetSummariesAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken cancellationToken)
    {
        SummariesCalls++;
        LastRequestedIds = itemIds;
        if (ExceptionToThrow is not null) throw ExceptionToThrow;
        IReadOnlyList<BacklogItemSummary> result = [.. itemIds.Where(_items.ContainsKey).Select(id => _items[id])];
        return Task.FromResult(result);
    }
}
