using Backlog.Data;
using Microsoft.EntityFrameworkCore;
using Sprints.Contracts;

namespace Backlog;

/// <summary>Implementación intra-proceso de <see cref="IBacklogModuleApi"/>: solo lectura sobre el schema <c>backlog</c>.</summary>
public class BacklogModuleApi(IBacklogDbContext db) : IBacklogModuleApi
{
    public Task<bool> ExistsAsync(Guid itemId, CancellationToken cancellationToken) =>
        db.BacklogItems.AnyAsync(i => i.Id == itemId, cancellationToken);

    public async Task<IReadOnlyList<BacklogItemSummary>> GetSummariesAsync(
        IReadOnlyCollection<Guid> itemIds, CancellationToken cancellationToken)
    {
        if (itemIds.Count == 0)
        {
            return [];
        }

        var ids = itemIds.ToArray();

        var rows = await db.BacklogItems
            .AsNoTracking()
            .Where(i => ids.Contains(i.Id))
            .Select(i => new { i.Id, i.Title, i.Type, i.DevPoints, i.QAPoints })
            .ToListAsync(cancellationToken);

        return [.. rows.Select(r => new BacklogItemSummary(r.Id, r.Title, r.Type.ToString(), r.DevPoints, r.QAPoints))];
    }
}
