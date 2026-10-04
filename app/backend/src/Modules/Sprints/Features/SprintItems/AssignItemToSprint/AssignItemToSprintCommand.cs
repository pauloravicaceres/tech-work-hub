using MediatR;

namespace Sprints.Features.SprintItems.AssignItemToSprint;

/// <summary>Los identificadores llegan como texto para poder reportar el error de formato por campo (ADR-007).</summary>
public record AssignItemToSprintCommand(
    string? SprintId,
    string? ItemId
) : IRequest<AssignedItemResponse>;
