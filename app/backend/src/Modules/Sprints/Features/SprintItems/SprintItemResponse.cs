namespace Sprints.Features.SprintItems;

/// <summary>Elemento asignado a un Sprint, sin estado ni auditoría (FR-008, FR-014).</summary>
public record SprintItemResponse(Guid Id, string Title, string Type, decimal? DevPoints, decimal? QAPoints);
