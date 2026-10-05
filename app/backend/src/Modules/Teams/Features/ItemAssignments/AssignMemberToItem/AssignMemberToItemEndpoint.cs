using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Teams.Features.ItemAssignments.AssignMemberToItem;

public class AssignMemberToItemEndpoint : ICarterModule
{
    public const string Route = "/api/backlog-items/{itemId}/assignees";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost(Route, async (string itemId, AssignMemberToItemBody? body, ISender sender, CancellationToken cancellationToken) =>
        {
            var result = await sender.Send(new AssignMemberToItemCommand(itemId, body?.MemberId), cancellationToken);

            return result.Created
                ? Results.Created($"/api/backlog-items/{itemId}/assignees", result.Response)
                : Results.Ok(result.Response);
        })
        .RequireAuthorization()
        .WithName("AssignMemberToItem")
        .Produces<ItemAssigneeResponse>(StatusCodes.Status201Created)
        .Produces<ItemAssigneeResponse>(StatusCodes.Status200OK)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status404NotFound)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}

/// <summary>Cuerpo de la solicitud: un miembro por asignación.</summary>
public record AssignMemberToItemBody(string? MemberId);
