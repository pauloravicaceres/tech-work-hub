using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Teams.Contracts;
using Teams.Data;

namespace Teams.Features.ItemAssignments.ListMemberItems;

public class ListMemberItemsQueryHandler(
    ITeamsDbContext db, IBacklogItemLookup items, ILogger<ListMemberItemsQueryHandler> logger)
    : IRequestHandler<ListMemberItemsQuery, IReadOnlyList<MemberItemResponse>>
{
    public async Task<IReadOnlyList<MemberItemResponse>> Handle(ListMemberItemsQuery request, CancellationToken cancellationToken)
    {
        var itemIds = await db.ItemAssignments
            .AsNoTracking()
            .Where(a => a.MemberId == request.MemberId)
            .OrderBy(a => a.CreatedAt)
            .ThenBy(a => a.Id)
            .Select(a => a.ItemId)
            .ToListAsync(cancellationToken);

        if (itemIds.Count == 0)
        {
            return [];
        }

        // Una única llamada de lote al contrato (sin N+1).
        var found = (await items.GetItemsAsync(itemIds, cancellationToken)).ToDictionary(i => i.Id);

        List<MemberItemResponse> result = [];
        foreach (var itemId in itemIds)
        {
            if (found.TryGetValue(itemId, out var item))
            {
                result.Add(new MemberItemResponse(item.Id, item.Title, item.Type));
            }
            else
            {
                // Sin título inventado: el elemento se omite y se deja traza (sin datos del miembro).
                logger.LogWarning("El elemento {ItemId} asignado ya no existe en el backlog y se omite de la consulta.", itemId);
            }
        }

        return result;
    }
}
