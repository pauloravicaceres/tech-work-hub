using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Teams.Features.TeamMembers.RegisterTeamMember;

public class RegisterTeamMemberEndpoint : ICarterModule
{
    public const string Route = "/api/team-members";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapPost(Route, async (RegisterTeamMemberCommand command, ISender sender, CancellationToken cancellationToken) =>
        {
            var response = await sender.Send(command, cancellationToken);

            return Results.Created(Route, response);
        })
        .RequireAuthorization()
        .WithName("RegisterTeamMember")
        .Produces<TeamMemberResponse>(StatusCodes.Status201Created)
        .ProducesProblem(StatusCodes.Status400BadRequest)
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
