using Shared.Domain;
using Shared.Exceptions;

namespace Sprints.Domain.SprintItems;

/// <summary>Relación Sprint–Elemento. Sin estado, sin orden y sin eventos de dominio (ADR-006).</summary>
public class SprintItem : Aggregate<Guid>, IAuditableEntity
{
    public Guid SprintId { get; private set; }

    /// <summary>Elemento del schema <c>backlog</c>: referencia lógica, sin FK (constitución §3).</summary>
    public Guid ItemId { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = default!;
    public DateTime? LastModified { get; private set; }
    public string? LastModifiedBy { get; private set; }

    private SprintItem() { } // For EF Core

    /// <exception cref="BadRequestException">Cualquiera de los identificadores es <see cref="Guid.Empty"/>.</exception>
    public static SprintItem Create(Guid sprintId, Guid itemId)
    {
        if (sprintId == Guid.Empty)
        {
            throw new BadRequestException(SprintItemRules.SprintIdRequiredMessage, SprintItemRules.SprintIdField);
        }

        if (itemId == Guid.Empty)
        {
            throw new BadRequestException(SprintItemRules.ItemIdRequiredMessage, SprintItemRules.ItemIdField);
        }

        return new SprintItem
        {
            Id = Guid.NewGuid(),
            SprintId = sprintId,
            ItemId = itemId
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
