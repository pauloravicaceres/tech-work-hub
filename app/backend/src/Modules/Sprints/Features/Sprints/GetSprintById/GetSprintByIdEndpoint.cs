using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Sprints.Features.Sprints.GetSprintById;

public class GetSprintByIdEndpoint : ICarterModule
{
    public const string Route = "/api/sprints/{id:guid}";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (Guid id, ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new GetSprintByIdQuery(id), cancellationToken)))
        .RequireAuthorization()
        .WithName("GetSprintById")
        .Produces<SprintResponse>()
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
