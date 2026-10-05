using Microsoft.EntityFrameworkCore;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TeamMembers;
using Teams.Domain.TechnicalRoles;

namespace Teams.Data;

public interface ITeamsDbContext
{
    DbSet<TeamMember> TeamMembers { get; }

    DbSet<TechnicalRole> TechnicalRoles { get; }

    DbSet<ItemAssignment> ItemAssignments { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
