using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Sprints.Features.SprintItems.AssignItemToSprint;

/// <summary>Cuerpo de la solicitud; <c>ItemId</c> como texto para reportar el formato por campo.</summary>
public record AssignItemRequest(string? ItemId);

public class AssignItemToSprintEndpoint : ICarterModule
{
    public const string Route = "/api/sprints/{sprintId}/items";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        // sprintId va como texto (sin :guid) para que un valor malformado responda 400 por campo y no 404 de ruta.
        app.MapPost(Route, async (string sprintId, AssignItemRequest? request, ISender sender, CancellationToken cancellationToken) =>
        {
            var response = await sender.Send(new AssignItemToSprintCommand(sprintId, request?.ItemId), cancellationToken);

            return Results.Created($"/api/sprints/{response.SprintId}/items", response);
        })
        .RequireAuthorization()
        .WithName("AssignItemToSprint")
        .Produces<AssignedItemResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status409Conflict)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
