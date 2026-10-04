using System.Reflection;
using Application.Domain;
using Microsoft.EntityFrameworkCore;

namespace Application.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public const string SchemaName = "application";

    public DbSet<RegisteredApplication> Applications => Set<RegisteredApplication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema(SchemaName);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(modelBuilder);
    }
}
