using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Teams.Domain.ItemAssignments;
using Teams.Domain.TeamMembers;
using Teams.Domain.TechnicalRoles;

namespace Teams.Data;

public class TeamsDbContext(DbContextOptions<TeamsDbContext> options) : DbContext(options), ITeamsDbContext
{
    public const string SchemaName = "teams";

    public DbSet<TeamMember> TeamMembers => Set<TeamMember>();

    public DbSet<TechnicalRole> TechnicalRoles => Set<TechnicalRole>();

    public DbSet<ItemAssignment> ItemAssignments => Set<ItemAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
