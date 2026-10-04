using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Sprints.Features.SprintItems.ListSprintItems;

public class ListSprintItemsEndpoint : ICarterModule
{
    public const string Route = "/api/sprints/{sprintId:guid}/items";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (Guid sprintId, ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new ListSprintItemsQuery(sprintId), cancellationToken)))
        .RequireAuthorization()
        .WithName("ListSprintItems")
        .Produces<IReadOnlyList<SprintItemResponse>>()
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound);
    }
}
