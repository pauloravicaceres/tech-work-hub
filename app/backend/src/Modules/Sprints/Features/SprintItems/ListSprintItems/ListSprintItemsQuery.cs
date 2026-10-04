using MediatR;

namespace Sprints.Features.SprintItems.ListSprintItems;

public record ListSprintItemsQuery(Guid SprintId) : IRequest<IReadOnlyList<SprintItemResponse>>;
