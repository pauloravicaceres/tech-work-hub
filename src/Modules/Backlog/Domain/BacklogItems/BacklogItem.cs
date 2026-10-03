using System;
using Backlog.Domain.BacklogItems.Events;

namespace Backlog.Domain.BacklogItems;

public class BacklogItem : Aggregate<Guid>
{
    public string Title { get; private set; }
    public string? Description { get; private set; }
    public BacklogItemType Type { get; private set; }
    public BacklogItemStatus Status { get; private set; }
    public int? DevPoints { get; private set; }
    public int? QAPoints { get; private set; }
    public Guid? ApplicationId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; }

    private BacklogItem() { } // For EF Core

    public static BacklogItem Create(
        Guid id,
        string title,
        string? description,
        BacklogItemType type,
        int? devPoints,
        int? qaPoints,
        Guid? applicationId)
    {
        var item = new BacklogItem
        {
            Id = id,
            Title = title,
            Description = description,
            Type = type,
            Status = BacklogItemStatus.Backlog,
            DevPoints = devPoints,
            QAPoints = qaPoints,
            ApplicationId = applicationId
        };

        item.AddDomainEvent(new BacklogItemCreatedDomainEvent(id, type, applicationId, DateTime.UtcNow));

        return item;
    }
}
