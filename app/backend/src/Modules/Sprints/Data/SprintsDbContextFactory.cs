using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Sprints.Data;

/// <summary>Solo para <c>dotnet ef migrations</c>: no se usa en tiempo de ejecución.</summary>
public class SprintsDbContextFactory : IDesignTimeDbContextFactory<SprintsDbContext>
{
    private const string DesignTimeConnection = "Host=localhost;Database=techworkhub";

    public SprintsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<SprintsDbContext>()
            .UseNpgsql(DesignTimeConnection, npgsql =>
                npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, SprintsDbContext.SchemaName))
            .Options;

        return new SprintsDbContext(options);
    }
}
