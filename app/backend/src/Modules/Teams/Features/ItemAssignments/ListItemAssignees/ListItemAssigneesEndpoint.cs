using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Teams.Features.ItemAssignments.ListItemAssignees;

public class ListItemAssigneesEndpoint : ICarterModule
{
    public const string Route = "/api/backlog-items/{itemId:guid}/assignees";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (Guid itemId, ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new ListItemAssigneesQuery(itemId), cancellationToken)))
        .RequireAuthorization()
        .WithName("ListItemAssignees")
        .Produces<IReadOnlyList<AssigneeResponse>>()
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
