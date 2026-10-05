namespace Backlog.Features.BacklogItems.ListBacklogItems;

/// <summary><c>Type</c> viaja como texto; no expone estimaciones, estado ni Sprint.</summary>
public record BacklogItemSummaryResponse(Guid Id, string Title, string Type);
