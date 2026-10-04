using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Shared.Exceptions;
using Sprints.Contracts;
using Sprints.Data;
using Sprints.Domain.SprintItems;

namespace Sprints.Features.SprintItems.ListSprintItems;

public class ListSprintItemsQueryHandler(ISprintsDbContext db, IBacklogModuleApi backlog, ILogger<ListSprintItemsQueryHandler> logger)
    : IRequestHandler<ListSprintItemsQuery, IReadOnlyList<SprintItemResponse>>
{
    public async Task<IReadOnlyList<SprintItemResponse>> Handle(ListSprintItemsQuery request, CancellationToken cancellationToken)
    {
        if (!await db.Sprints.AnyAsync(s => s.Id == request.SprintId, cancellationToken))
        {
            throw new NotFoundException(SprintItemRules.SprintNotFoundMessage);
        }

        var itemIds = await db.SprintItems
            .AsNoTracking()
            .Where(i => i.SprintId == request.SprintId)
            .OrderBy(i => i.CreatedAt)
            .ThenBy(i => i.Id)
            .Select(i => i.ItemId)
            .ToListAsync(cancellationToken);

        if (itemIds.Count == 0)
        {
            return [];
        }

        // Una sola llamada de lote al contrato (sin N+1); los datos del elemento no se duplican localmente.
        var summaries = (await backlog.GetSummariesAsync(itemIds, cancellationToken)).ToDictionary(s => s.Id);

        List<SprintItemResponse> result = [];
        foreach (var itemId in itemIds)
        {
            if (!summaries.TryGetValue(itemId, out var summary))
            {
                logger.LogWarning("El elemento {ItemId} asignado al Sprint {SprintId} no se encontró en el Backlog; se omite.", itemId, request.SprintId);
                continue;
            }

            result.Add(new SprintItemResponse(summary.Id, summary.Title, summary.Type, summary.DevPoints, summary.QAPoints));
        }

        return result;
    }
}
