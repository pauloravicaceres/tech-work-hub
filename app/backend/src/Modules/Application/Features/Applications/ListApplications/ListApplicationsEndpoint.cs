using Backlog.Contracts;
using Carter;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Application.Features.Applications.ListApplications;

public class ListApplicationsEndpoint : ICarterModule
{
    public const string Route = "/api/applications";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (IApplicationModuleApi applications, CancellationToken cancellationToken) =>
            Results.Ok(await applications.ListAsync(cancellationToken)))
        .RequireAuthorization()
        .WithName("ListApplications")
        .Produces<IReadOnlyList<ApplicationSummary>>()
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
