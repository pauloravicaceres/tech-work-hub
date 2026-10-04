using MediatR;
using Shared.Exceptions;
using Shared.Identity;
using Sprints.Data;
using Sprints.Domain.Sprints;

namespace Sprints.Features.Sprints.CreateSprint;

public class CreateSprintCommandHandler(ISprintsDbContext db, ICurrentUser currentUser)
    : IRequestHandler<CreateSprintCommand, SprintResponse>
{
    public const string MissingIdentityMessage = "No se encontró el claim de identidad del usuario autenticado.";

    public async Task<SprintResponse> Handle(CreateSprintCommand request, CancellationToken cancellationToken)
    {
        // FR-010: la identidad se resuelve antes de cualquier acceso a datos.
        _ = currentUser.UserId ?? throw new UnauthorizedAccessException(MissingIdentityMessage);

        // Defensa en profundidad: el validador ya garantiza el formato, pero el handler no debe confiar en que se ejecutó.
        if (!SprintRules.TryParseDate(request.StartDate, out var startDate))
        {
            throw new BadRequestException(SprintRules.StartDateFormatMessage, SprintRules.StartDateField);
        }

        if (!SprintRules.TryParseDate(request.EndDate, out var endDate))
        {
            throw new BadRequestException(SprintRules.EndDateFormatMessage, SprintRules.EndDateField);
        }

        var sprint = Sprint.Create(request.Identification ?? string.Empty, startDate, endDate);

        db.Sprints.Add(sprint);
        await db.SaveChangesAsync(cancellationToken);

        return new SprintResponse(sprint.Id, sprint.Identification, sprint.StartDate, sprint.EndDate);
    }
}
