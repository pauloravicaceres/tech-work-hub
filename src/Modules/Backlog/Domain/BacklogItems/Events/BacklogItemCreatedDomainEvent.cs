using System;

namespace Backlog.Domain.BacklogItems.Events;

public record BacklogItemCreatedDomainEvent(
    Guid BacklogItemId,
    BacklogItemType Type,
    Guid? ApplicationId,
    DateTime OccurredOnUtc
);
