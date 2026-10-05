using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Teams.Data;

/// <summary>Solo para <c>dotnet ef migrations</c>: no se usa en tiempo de ejecución.</summary>
public class TeamsDbContextFactory : IDesignTimeDbContextFactory<TeamsDbContext>
{
    private const string DesignTimeConnection = "Host=localhost;Database=techworkhub";

    public TeamsDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<TeamsDbContext>()
            .UseNpgsql(DesignTimeConnection, npgsql =>
                npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, TeamsDbContext.SchemaName))
            .Options;

        return new TeamsDbContext(options);
    }
}
