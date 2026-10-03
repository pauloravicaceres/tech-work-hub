using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Application.Data;

/// <summary>Solo para <c>dotnet ef migrations</c>: no se usa en tiempo de ejecución.</summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    private const string DesignTimeConnection = "Host=localhost;Database=techworkhub";

    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(DesignTimeConnection, npgsql =>
                npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, ApplicationDbContext.SchemaName))
            .Options;

        return new ApplicationDbContext(options);
    }
}
