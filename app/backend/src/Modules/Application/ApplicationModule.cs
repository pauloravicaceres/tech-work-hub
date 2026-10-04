using Application.Data;
using Backlog.Contracts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Application;

public static class ApplicationModule
{
    public const string ConnectionStringName = "Database";

    public static IServiceCollection AddApplicationModule(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options => options.UseNpgsql(
            configuration.GetConnectionString(ConnectionStringName),
            npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, ApplicationDbContext.SchemaName)));
        services.AddScoped<IApplicationModuleApi, ApplicationModuleApi>();

        return services;
    }

    /// <summary>Aplica las migraciones Code-First del schema <c>application</c>.</summary>
    public static async Task MigrateApplicationModuleAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync(cancellationToken);
    }
}
