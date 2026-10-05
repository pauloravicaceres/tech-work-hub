using MediatR;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Shared.Exceptions;
using Shared.Identity;
using Teams.Contracts;
using Teams.Data;
using Teams.Domain.ItemAssignments;

namespace Teams.Features.ItemAssignments.AssignMemberToItem;

public class AssignMemberToItemCommandHandler(ITeamsDbContext db, IBacklogItemLookup items, ICurrentUser currentUser)
    : IRequestHandler<AssignMemberToItemCommand, AssignMemberToItemResult>
{
    public const string MissingIdentityMessage = "No se encontró el claim de identidad del usuario autenticado.";

    public async Task<AssignMemberToItemResult> Handle(AssignMemberToItemCommand request, CancellationToken cancellationToken)
    {
        // La identidad se resuelve antes de cualquier acceso a datos.
        _ = currentUser.UserId ?? throw new UnauthorizedAccessException(MissingIdentityMessage);

        // El validador ya garantizó que ambos identificadores son GUID no vacíos.
        var itemId = Guid.Parse(request.ItemId);
        var memberId = Guid.Parse(request.MemberId!);

        // El rol sale del rol técnico vigente del miembro (JOIN local), nunca de la solicitud.
        var member = await db.TeamMembers
            .AsNoTracking()
            .Where(m => m.Id == memberId)
            .Select(m => new { m.Id, m.Name, Role = m.TechnicalRole!.Name })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(ItemAssignmentRules.MemberNotFoundMessage);

        if (!await items.ExistsAsync(itemId, cancellationToken))
        {
            throw new NotFoundException(ItemAssignmentRules.ItemNotFoundMessage);
        }

        var response = new ItemAssigneeResponse(itemId, member.Id, member.Name, member.Role);

        if (await PairExistsAsync(itemId, memberId, cancellationToken))
        {
            return new AssignMemberToItemResult(response, Created: false);
        }

        db.ItemAssignments.Add(ItemAssignment.Create(itemId, memberId));

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (IsPairUniqueViolation(ex))
        {
            // Carrera: otra solicitud ganó el índice único; se relee la fila ganadora y se responde idempotente.
            if (await PairExistsAsync(itemId, memberId, cancellationToken))
            {
                return new AssignMemberToItemResult(response, Created: false);
            }

            throw;
        }

        return new AssignMemberToItemResult(response, Created: true);
    }

    private Task<bool> PairExistsAsync(Guid itemId, Guid memberId, CancellationToken cancellationToken) =>
        db.ItemAssignments
            .AsNoTracking()
            .AnyAsync(a => a.ItemId == itemId && a.MemberId == memberId, cancellationToken);

    private static bool IsPairUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: ItemAssignmentRules.PairUniqueIndexName
        };
}
