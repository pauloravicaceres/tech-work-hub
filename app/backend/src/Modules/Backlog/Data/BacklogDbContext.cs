using System.Reflection;
using Backlog.Domain.BacklogItems;
using Microsoft.EntityFrameworkCore;

namespace Backlog.Data;

public class BacklogDbContext(DbContextOptions<BacklogDbContext> options) : DbContext(options), IBacklogDbContext
{
    public const string SchemaName = "backlog";

    public DbSet<BacklogItem> BacklogItems => Set<BacklogItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
