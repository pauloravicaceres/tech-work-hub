using MediatR;

namespace Sprints.Features.Sprints.CreateSprint;

/// <summary>Las fechas llegan como texto para poder reportar el error de formato por campo (ADR-004).</summary>
public record CreateSprintCommand(
    string? Identification,
    string? StartDate,
    string? EndDate
) : IRequest<SprintResponse>;
