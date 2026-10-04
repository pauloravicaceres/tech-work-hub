using MediatR;
using Microsoft.EntityFrameworkCore;
using Sprints.Data;

namespace Sprints.Features.Sprints.ListSprints;

public class ListSprintsQueryHandler(ISprintsDbContext db)
    : IRequestHandler<ListSprintsQuery, IReadOnlyList<SprintResponse>>
{
    public async Task<IReadOnlyList<SprintResponse>> Handle(ListSprintsQuery request, CancellationToken cancellationToken) =>
        await db.Sprints
            .AsNoTracking()
            .OrderBy(s => s.StartDate)
            .ThenBy(s => s.Id)
            .Select(s => new SprintResponse(s.Id, s.Identification, s.StartDate, s.EndDate))
            .ToListAsync(cancellationToken);
}
