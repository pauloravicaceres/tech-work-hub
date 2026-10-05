using MediatR;
using Microsoft.EntityFrameworkCore;
using Teams.Data;

namespace Teams.Features.TeamMembers.ListTeamMembers;

public class ListTeamMembersQueryHandler(ITeamsDbContext db)
    : IRequestHandler<ListTeamMembersQuery, IReadOnlyList<TeamMemberResponse>>
{
    public async Task<IReadOnlyList<TeamMemberResponse>> Handle(ListTeamMembersQuery request, CancellationToken cancellationToken) =>
        await db.TeamMembers
            .AsNoTracking()
            .OrderBy(m => m.CreatedAt)
            .ThenBy(m => m.Id)
            .Select(m => new TeamMemberResponse(m.Id, m.Name, m.TechnicalRole!.Name))
            .ToListAsync(cancellationToken);
}
