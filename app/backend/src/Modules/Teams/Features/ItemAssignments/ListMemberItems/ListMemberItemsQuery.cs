using MediatR;

namespace Teams.Features.ItemAssignments.ListMemberItems;

public record ListMemberItemsQuery(Guid MemberId) : IRequest<IReadOnlyList<MemberItemResponse>>;
