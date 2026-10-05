using Carter;
using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace Teams.Features.ItemAssignments.ListMemberItems;

public class ListMemberItemsEndpoint : ICarterModule
{
    public const string Route = "/api/team-members/{memberId:guid}/items";

    public void AddRoutes(IEndpointRouteBuilder app)
    {
        app.MapGet(Route, async (Guid memberId, ISender sender, CancellationToken cancellationToken) =>
            Results.Ok(await sender.Send(new ListMemberItemsQuery(memberId), cancellationToken)))
        .RequireAuthorization()
        .WithName("ListMemberItems")
        .Produces<IReadOnlyList<MemberItemResponse>>()
        .Produces(StatusCodes.Status401Unauthorized)
        .ProducesProblem(StatusCodes.Status500InternalServerError);
    }
}
