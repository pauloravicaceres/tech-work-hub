using Backlog.Domain.BacklogItems.Events;
using Shared.Domain;
using Shared.Exceptions;

namespace Backlog.Domain.BacklogItems;

public class BacklogItem : Aggregate<Guid>, IAuditableEntity
{
    public const string TechnicalItemQaPointsMessage = "Los ítems técnicos no admiten puntos de QA.";

    public string Title { get; private set; } = default!;
    public string? Description { get; private set; }
    public BacklogItemType Type { get; private set; }
    public BacklogItemPriority Priority { get; private set; }
    public string? AcceptanceCriteria { get; private set; }
    public BacklogItemStatus Status { get; private set; }
    public decimal? DevPoints { get; private set; }
    public decimal? QAPoints { get; private set; }
    public Guid? ApplicationId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = default!;
    public DateTime? LastModified { get; private set; }
    public string? LastModifiedBy { get; private set; }

    private BacklogItem() { } // For EF Core

    /// <exception cref="BadRequestException">Un tipo técnico llega con <paramref name="qaPoints"/> (FR-008).</exception>
    public static BacklogItem Create(
        Guid id,
        string title,
        string? description,
        BacklogItemType type,
        BacklogItemPriority priority,
        string? acceptanceCriteria,
        decimal? devPoints,
        decimal? qaPoints,
        Guid? applicationId)
    {
        if (type.IsTechnical() && qaPoints.HasValue)
        {
            throw new BadRequestException(TechnicalItemQaPointsMessage, nameof(QAPoints));
        }

        var item = new BacklogItem
        {
            Id = id,
            Title = title,
            Description = description,
            Type = type,
            Priority = priority,
            AcceptanceCriteria = acceptanceCriteria,
            Status = BacklogItemStatus.Backlog,
            DevPoints = devPoints,
            QAPoints = qaPoints,
            ApplicationId = applicationId
        };

        item.AddDomainEvent(new BacklogItemCreatedDomainEvent(id, type, applicationId, DateTime.UtcNow));

        return item;
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
