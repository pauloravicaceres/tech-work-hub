using MediatR;

namespace Sprints.Features.Sprints.ListSprints;

public record ListSprintsQuery : IRequest<IReadOnlyList<SprintResponse>>;
