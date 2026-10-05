using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Teams.Features.TechnicalRoles.ListTechnicalRoles;

public class ListTechnicalRolesEndpoint : ICarterModule
{
    public const string Route = "/api/technical-roles";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new ListTechnicalRolesQuery(), cancellationToken)))
        .RequireAuthorization()
        .WithName("ListTechnicalRoles")
        .Produces<IReadOnlyList<TechnicalRoleResponse>>()
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
