using Microsoft.Extensions.DependencyInjection;
using Shared.Data.Interceptors;
using Shared.Exceptions;
using Shared.Identity;

namespace Shared;

public static class SharedServiceExtensions
{
    public static IServiceCollection AddSharedInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<ICurrentUser, HttpContextCurrentUser>();
        services.AddScoped<AuditableEntityInterceptor>();
        services.AddScoped<DispatchDomainEventsInterceptor>();
        services.AddExceptionHandler<CustomExceptionHandler>();
        services.AddProblemDetails();
        return services;
    }
}
