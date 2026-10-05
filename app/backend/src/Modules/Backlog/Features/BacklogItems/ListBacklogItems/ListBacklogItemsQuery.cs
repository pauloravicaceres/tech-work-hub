using MediatR;

namespace Backlog.Features.BacklogItems.ListBacklogItems;

public record ListBacklogItemsQuery : IRequest<IReadOnlyList<BacklogItemSummaryResponse>>;
