namespace Sprints.Features.SprintItems;

/// <summary>Respuesta de la asignación: solo la relación creada, sin estado ni auditoría (FR-008, FR-014).</summary>
public record AssignedItemResponse(Guid SprintId, Guid ItemId);
