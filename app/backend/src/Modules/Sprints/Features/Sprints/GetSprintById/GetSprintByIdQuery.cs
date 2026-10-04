using MediatR;

namespace Sprints.Features.Sprints.GetSprintById;

public record GetSprintByIdQuery(Guid Id) : IRequest<SprintResponse>;
