using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public class CreateBacklogItemEndpoint : ICarterModule
{
    public const string Route = "/api/backlog/items";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost(Route, async (CreateBacklogItemCommand command, ISender sender, CancellationToken cancellationToken) =>
        {
            var id = await sender.Send(command, cancellationToken);

            return Results.Created($"{Route}/{id}", new { id });
        })
        .RequireAuthorization()
        .WithName("CreateBacklogItem")
        .Produces(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
