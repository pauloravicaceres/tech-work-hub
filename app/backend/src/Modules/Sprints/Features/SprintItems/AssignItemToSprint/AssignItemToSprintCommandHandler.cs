using MediatR;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Shared.Exceptions;
using Shared.Identity;
using Sprints.Contracts;
using Sprints.Data;
using Sprints.Domain.SprintItems;

namespace Sprints.Features.SprintItems.AssignItemToSprint;

public class AssignItemToSprintCommandHandler(ISprintsDbContext db, IBacklogModuleApi backlog, ICurrentUser currentUser)
    : IRequestHandler<AssignItemToSprintCommand, AssignedItemResponse>
{
    public const string MissingIdentityMessage = "No se encontró el claim de identidad del usuario autenticado.";

    public async Task<AssignedItemResponse> Handle(AssignItemToSprintCommand request, CancellationToken cancellationToken)
    {
        // La identidad se resuelve antes de cualquier acceso a datos o al contrato.
        _ = currentUser.UserId ?? throw new UnauthorizedAccessException(MissingIdentityMessage);

        // Defensa en profundidad: el validador ya garantiza el formato, pero el handler no debe confiar en que se ejecutó.
        if (!SprintItemRules.TryParseId(request.SprintId, out var sprintId))
        {
            throw new BadRequestException(SprintItemRules.SprintIdFormatMessage, SprintItemRules.SprintIdField);
        }

        if (!SprintItemRules.TryParseId(request.ItemId, out var itemId))
        {
            throw new BadRequestException(SprintItemRules.ItemIdFormatMessage, SprintItemRules.ItemIdField);
        }

        if (!await db.Sprints.AnyAsync(s => s.Id == sprintId, cancellationToken))
        {
            throw new NotFoundException(SprintItemRules.SprintNotFoundMessage);
        }

        if (!await backlog.ExistsAsync(itemId, cancellationToken))
        {
            throw new NotFoundException(SprintItemRules.ItemNotFoundMessage);
        }

        // Solo optimización: la garantía real contra la concurrencia es el índice único UX_SprintItems_ItemId.
        if (await db.SprintItems.AnyAsync(i => i.ItemId == itemId, cancellationToken))
        {
            throw new ConflictException(SprintItemRules.ItemAlreadyAssignedMessage);
        }

        db.SprintItems.Add(SprintItem.Create(sprintId, itemId));

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsItemIdUniqueViolation(ex))
        {
            throw new ConflictException(SprintItemRules.ItemAlreadyAssignedMessage);
        }

        return new AssignedItemResponse(sprintId, itemId);
    }

    /// <summary>Solo la violación del índice único del elemento es un 409; cualquier otro fallo de persistencia sigue siendo un 500.</summary>
    private static bool IsItemIdUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: SprintItemRules.ItemIdUniqueIndexName
        };
}
