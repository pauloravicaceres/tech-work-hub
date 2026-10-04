namespace Sprints.Contracts;

/// <summary>Proyección mínima de un elemento del Backlog; <c>Type</c> viaja como texto para no referenciar tipos de Backlog.</summary>
public sealed record BacklogItemSummary(Guid Id, string Title, string Type, decimal? DevPoints, decimal? QAPoints);

/// <summary>Contrato intra-proceso de solo lectura hacia el módulo Backlog: evita consultas cross-schema (constitución §3).</summary>
public interface IBacklogModuleApi
{
    Task<bool> ExistsAsync(Guid itemId, CancellationToken cancellationToken);

    /// <summary>Una sola consulta de lote; omite los identificadores inexistentes y no garantiza orden.</summary>
    Task<IReadOnlyList<BacklogItemSummary>> GetSummariesAsync(IReadOnlyCollection<Guid> itemIds, CancellationToken cancellationToken);
}
