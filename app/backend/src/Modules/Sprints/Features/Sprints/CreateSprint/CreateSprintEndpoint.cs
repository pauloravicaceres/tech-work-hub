using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Sprints.Features.Sprints.CreateSprint;

public class CreateSprintEndpoint : ICarterModule
{
    public const string Route = "/api/sprints";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost(Route, async (CreateSprintCommand command, ISender sender, CancellationToken cancellationToken) =>
        {
            var response = await sender.Send(command, cancellationToken);

            return Results.Created($"{Route}/{response.Id}", response);
        })
        .RequireAuthorization()
        .WithName("CreateSprint")
        .Produces<SprintResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
