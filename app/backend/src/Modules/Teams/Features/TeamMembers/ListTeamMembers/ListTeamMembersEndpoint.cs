using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Teams.Features.TeamMembers.ListTeamMembers;

public class ListTeamMembersEndpoint : ICarterModule
{
    public const string Route = "/api/team-members";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new ListTeamMembersQuery(), cancellationToken)))
        .RequireAuthorization()
        .WithName("ListTeamMembers")
        .Produces<IReadOnlyList<TeamMemberResponse>>()
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
