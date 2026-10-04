using System.Reflection;
using Microsoft.EntityFrameworkCore;
using Sprints.Domain.Sprints;

namespace Sprints.Data;

public class SprintsDbContext(DbContextOptions<SprintsDbContext> options) : DbContext(options), ISprintsDbContext
{
    public const string SchemaName = "sprints";

    public DbSet<Sprint> Sprints => Set<Sprint>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
