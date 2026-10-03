using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public class CreateBacklogItemEndpoint : ICarterModule
{
    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost("/api/backlog/items", async (CreateBacklogItemCommand command, IMediator mediator) =>
        {
            var id = await mediator.Send(command);
            
            return Results.Created($"/api/backlog/items/{id}", new { id });
        })
        .RequireAuthorization()
        .WithName("CreateBacklogItem")
        .Produces(StatusCodes.Status201Created)
        .Produces(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .Produces(StatusCodes.Status500InternalServerError);
    }
}
