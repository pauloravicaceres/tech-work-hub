using Backlog.Data;
using Microsoft.EntityFrameworkCore;
using Teams.Contracts;

namespace Backlog;

/// <summary>Implementación intra-proceso de <see cref="IBacklogItemLookup"/>: solo lectura sobre el schema <c>backlog</c>.</summary>
public class BacklogItemLookup(IBacklogDbContext db) : IBacklogItemLookup
{
    public Task<bool> ExistsAsync(Guid itemId, CancellationToken ct) =>
        db.BacklogItems.AsNoTracking().AnyAsync(i => i.Id == itemId, ct);

    public async Task<IReadOnlyCollection<BacklogItemRef>> GetItemsAsync(
        IReadOnlyCollection<Guid> itemIds, CancellationToken ct)
    {
        if (itemIds.Count == 0)
        {
            return [];
        }

        var ids = itemIds.ToArray();

        var rows = await db.BacklogItems
            .AsNoTracking()
            .Where(i => ids.Contains(i.Id))
            .Select(i => new { i.Id, i.Title, i.Type })
            .ToListAsync(ct);

        return [.. rows.Select(r => new BacklogItemRef(r.Id, r.Title, r.Type.ToString()))];
    }
}
