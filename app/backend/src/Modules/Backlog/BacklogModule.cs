using Backlog.Data;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shared.Behaviors;
using Shared.Data.Interceptors;
using Sprints.Contracts;
using Teams.Contracts;

namespace Backlog;

public static class BacklogModule
{
    public const string ConnectionStringName = "Database";

    public static IServiceCollection AddBacklogModule(this IServiceCollection services, IConfiguration configuration)
    {
        var assembly = typeof(BacklogModule).Assembly;

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });
        services.AddValidatorsFromAssembly(assembly);

        services.AddDbContext<BacklogDbContext>((provider, options) => options
            .UseNpgsql(
                configuration.GetConnectionString(ConnectionStringName),
                npgsql => npgsql.MigrationsHistoryTable(HistoryRepository.DefaultTableName, BacklogDbContext.SchemaName))
            .AddInterceptors(
                provider.GetRequiredService<AuditableEntityInterceptor>(),
                provider.GetRequiredService<DispatchDomainEventsInterceptor>()));
        services.AddScoped<IBacklogDbContext>(provider => provider.GetRequiredService<BacklogDbContext>());
        services.AddScoped<IBacklogModuleApi, BacklogModuleApi>();
        services.AddScoped<IBacklogItemLookup, BacklogItemLookup>();

        return services;
    }

    /// <summary>Aplica las migraciones Code-First del schema <c>backlog</c>.</summary>
    public static async Task MigrateBacklogModuleAsync(this IServiceProvider services, CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<BacklogDbContext>();
        await context.Database.MigrateAsync(cancellationToken);
    }
}
