using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shared.Behaviors;
using Shared.Data.Interceptors;
using Sprints.Data;

namespace Sprints;

public static class SprintsModule
{
    public const string ConnectionStringName = "Database";

    public static IServiceCollection AddSprintsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var assembly = typeof(SprintsModule).Assembly;

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(assembly);

        services.AddDbContext<SprintsDbContext>((provider, options) => options
            .UseNpgsql(
                configuration.GetConnectionString(ConnectionStringName),
                npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, SprintsDbContext.SchemaName))
            .AddInterceptors(provider.GetRequiredService<AuditableEntityInterceptor>()));
        services.AddScoped<ISprintsDbContext>(provider => provider.GetRequiredService<SprintsDbContext>());

        return services;
    }

    /// <summary>Aplica las migraciones Code-First del schema <c>sprints</c>.</summary>
    public static async Task MigrateSprintsModuleAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<SprintsDbContext>();
        await context.Database.MigrateAsync(cancellationToken);
    }
}
