using System;
using System.Collections.Generic;
using Backlog.Domain.BacklogItems.Events;

namespace Backlog.Domain;

public abstract class Aggregate<TId>
{
    public TId Id { get; protected set; }
    
    private readonly List<object> _domainEvents = new();
    public IReadOnlyCollection<object> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(object domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
