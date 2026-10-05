using MediatR;
using Microsoft.EntityFrameworkCore;
using Teams.Data;

namespace Teams.Features.ItemAssignments.ListItemAssignees;

public class ListItemAssigneesQueryHandler(ITeamsDbContext db)
    : IRequestHandler<ListItemAssigneesQuery, IReadOnlyList<AssigneeResponse>>
{
    public async Task<IReadOnlyList<AssigneeResponse>> Handle(ListItemAssigneesQuery request, CancellationToken cancellationToken) =>
        await db.ItemAssignments
            .AsNoTracking()
            .Where(a => a.ItemId == request.ItemId)
            .OrderBy(a => a.CreatedAt)
            .ThenBy(a => a.Id)
            .Select(a => new AssigneeResponse(a.Member!.Id, a.Member.Name, a.Member.TechnicalRole!.Name))
            .ToListAsync(cancellationToken);
}
