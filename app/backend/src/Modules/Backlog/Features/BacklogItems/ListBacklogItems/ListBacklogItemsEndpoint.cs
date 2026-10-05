using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Backlog.Features.BacklogItems.ListBacklogItems;

public class ListBacklogItemsEndpoint : ICarterModule
{
    public const string Route = "/api/backlog-items";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new ListBacklogItemsQuery(), cancellationToken)))
        .RequireAuthorization()
        .WithName("ListBacklogItems")
        .Produces<IReadOnlyList<BacklogItemSummaryResponse>>()
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
