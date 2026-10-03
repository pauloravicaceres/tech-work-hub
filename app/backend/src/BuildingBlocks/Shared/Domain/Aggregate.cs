namespace Shared.Domain;

public interface IAggregate
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    IDomainEvent[] ClearDomainEvents();
}

public abstract class Aggregate<TId> : IAggregate
{
    private readonly List<IDomainEvent> _domainEvents = [];

    public TId Id { get; protected set; } = default!;

    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    public IDomainEvent[] ClearDomainEvents()
    {
        IDomainEvent[] dequeued = [.. _domainEvents];
        _domainEvents.Clear();
        return dequeued;
    }
}
