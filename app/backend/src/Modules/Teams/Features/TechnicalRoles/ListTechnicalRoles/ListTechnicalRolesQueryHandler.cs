using MediatR;
using Microsoft.EntityFrameworkCore;
using Teams.Data;

namespace Teams.Features.TechnicalRoles.ListTechnicalRoles;

public class ListTechnicalRolesQueryHandler(ITeamsDbContext db)
    : IRequestHandler<ListTechnicalRolesQuery, IReadOnlyList<TechnicalRoleResponse>>
{
    public async Task<IReadOnlyList<TechnicalRoleResponse>> Handle(ListTechnicalRolesQuery request, CancellationToken cancellationToken) =>
        await db.TechnicalRoles
            .AsNoTracking()
            .OrderBy(r => r.Name)
            .Select(r => new TechnicalRoleResponse(r.Id, r.Name))
            .ToListAsync(cancellationToken);
}
