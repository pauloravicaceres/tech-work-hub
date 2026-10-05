using Shared.Domain;
using Shared.Exceptions;
using Teams.Domain.TeamMembers;

namespace Teams.Domain.ItemAssignments;

/// <summary>Relación Persona–Elemento. <c>ItemId</c> es referencia lógica (sin FK) al schema <c>backlog</c>; el rol se lee del miembro, no se almacena.</summary>
public class ItemAssignment : Aggregate<Guid>, IAuditableEntity
{
    public Guid ItemId { get; private set; }
    public Guid MemberId { get; private set; }
    public TeamMember? Member { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = default!;
    public DateTime? LastModified { get; private set; }
    public string? LastModifiedBy { get; private set; }

    private ItemAssignment() { } // For EF Core

    /// <exception cref="BadRequestException">Identificador de elemento o de miembro vacío.</exception>
    public static ItemAssignment Create(Guid itemId, Guid memberId)
    {
        if (itemId == Guid.Empty)
        {
            throw new BadRequestException(ItemAssignmentRules.ItemIdRequiredMessage, ItemAssignmentRules.ItemIdField);
        }

        if (memberId == Guid.Empty)
        {
            throw new BadRequestException(ItemAssignmentRules.MemberIdRequiredMessage, ItemAssignmentRules.MemberIdField);
        }

        return new ItemAssignment
        {
            Id = Guid.NewGuid(),
            ItemId = itemId,
            MemberId = memberId
        };
    }

    public void MarkCreated(DateTime atUtc, string by)
    {
        CreatedAt = atUtc;
        CreatedBy = by;
    }

    public void MarkModified(DateTime atUtc, string by)
    {
        LastModified = atUtc;
        LastModifiedBy = by;
    }
}
