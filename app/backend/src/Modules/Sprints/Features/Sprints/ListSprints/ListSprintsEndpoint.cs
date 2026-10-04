using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Sprints.Features.Sprints.ListSprints;

public class ListSprintsEndpoint : ICarterModule
{
    public const string Route = "/api/sprints";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new ListSprintsQuery(), cancellationToken)))
        .RequireAuthorization()
        .WithName("ListSprints")
        .Produces<IReadOnlyList<SprintResponse>>()
        .Produces(StatusCodes.Status401Unauthorized);
    }
}
