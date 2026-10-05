using Backlog.Data;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Backlog.Features.BacklogItems.ListBacklogItems;

public class ListBacklogItemsQueryHandler(IBacklogDbContext db)
    : IRequestHandler<ListBacklogItemsQuery, IReadOnlyList<BacklogItemSummaryResponse>>
{
    public async Task<IReadOnlyList<BacklogItemSummaryResponse>> Handle(ListBacklogItemsQuery request, CancellationToken cancellationToken)
    {
        var rows = await db.BacklogItems
            .AsNoTracking()
            .OrderBy(i => i.CreatedAt)
            .ThenBy(i => i.Id)
            .Select(i => new { i.Id, i.Title, i.Type })
            .ToListAsync(cancellationToken);

        return [.. rows.Select(r => new BacklogItemSummaryResponse(r.Id, r.Title, r.Type.ToString()))];
    }
}
