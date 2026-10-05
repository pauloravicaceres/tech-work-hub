using Microsoft.EntityFrameworkCore;
using Teams.Domain.TeamMembers;
using Teams.Domain.TechnicalRoles;

namespace Teams.Data;

public interface ITeamsDbContext
{
    DbSet<TeamMember> TeamMembers { get; }

    DbSet<TechnicalRole> TechnicalRoles { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
