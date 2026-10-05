using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shared.Behaviors;
using Shared.Data.Interceptors;
using Teams.Data;

namespace Teams;

public static class TeamsModule
{
    public const string ConnectionStringName = "Database";

    public static IServiceCollection AddTeamsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var assembly = typeof(TeamsModule).Assembly;

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(assembly);

        services.AddDbContext<TeamsDbContext>((provider, options) => options
            .UseNpgsql(
                configuration.GetConnectionString(ConnectionStringName),
                npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, TeamsDbContext.SchemaName))
            .AddInterceptors(provider.GetRequiredService<AuditableEntityInterceptor>()));
        services.AddScoped<ITeamsDbContext>(provider => provider.GetRequiredService<TeamsDbContext>());

        return services;
    }

    /// <summary>Aplica las migraciones Code-First del schema <c>sprints</c>.</summary>
    public static async Task MigrateTeamsModuleAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<TeamsDbContext>();
        await context.Database.MigrateAsync(cancellationToken);
    }
}
