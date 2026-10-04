using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Backlog.Data;

/// <summary>Solo para <c>dotnet ef migrations</c>: no se usa en tiempo de ejecución.</summary>
public class BacklogDbContextFactory : IDesignTimeDbContextFactory<BacklogDbContext>
{
    private const string DesignTimeConnection = "Host=localhost;Database=techworkhub";

    public BacklogDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<BacklogDbContext>()
            .UseNpgsql(DesignTimeConnection, npgsql =>
                npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, BacklogDbContext.SchemaName))
            .Options;

        return new BacklogDbContext(options);
    }
}
