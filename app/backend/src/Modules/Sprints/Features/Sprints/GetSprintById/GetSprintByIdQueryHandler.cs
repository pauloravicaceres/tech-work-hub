using MediatR;
using Microsoft.EntityFrameworkCore;
using Shared.Exceptions;
using Sprints.Data;

namespace Sprints.Features.Sprints.GetSprintById;

public class GetSprintByIdQueryHandler(ISprintsDbContext db)
    : IRequestHandler<GetSprintByIdQuery, SprintResponse>
{
    public const string NotFoundMessage = "El Sprint solicitado no existe.";

    public async Task<SprintResponse> Handle(GetSprintByIdQuery request, CancellationToken cancellationToken)
    {
        var sprint = await db.Sprints
            .AsNoTracking()
            .Where(s => s.Id == request.Id)
            .Select(s => new SprintResponse(s.Id, s.Identification, s.StartDate, s.EndDate))
            .FirstOrDefaultAsync(cancellationToken);

        return sprint ?? throw new NotFoundException(NotFoundMessage);
    }
}
