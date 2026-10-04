namespace Sprints.Features.Sprints;

/// <summary>Respuesta común de los tres casos de uso; no expone la auditoría (CreatedAt/CreatedBy).</summary>
public record SprintResponse(Guid Id, string Identification, DateOnly StartDate, DateOnly EndDate);
