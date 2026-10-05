namespace Teams.Contracts;

/// <summary>
/// Contrato in-process de solo lectura sobre los elementos del backlog; lo implementa el módulo <c>Backlog</c>.
/// Permite a <c>Teams</c> verificar y leer elementos sin consultar el schema <c>backlog</c> (ADR-002, ADR-003).
/// </summary>
public interface IBacklogItemLookup
{
    Task<bool> ExistsAsync(Guid itemId, CancellationToken ct);

    Task<IReadOnlyCollection<BacklogItemRef>> GetItemsAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken ct);
}

/// <summary><c>Type</c> es el nombre del enum de tipo del elemento como texto. No expone estimaciones, estado ni Sprint.</summary>
public sealed record BacklogItemRef(Guid Id, string Title, string Type);
