using MediatR;

namespace Teams.Features.ItemAssignments.ListItemAssignees;

public record ListItemAssigneesQuery(Guid ItemId) : IRequest<IReadOnlyList<AssigneeResponse>>;
