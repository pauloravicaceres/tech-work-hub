namespace Backlog.Contracts;

/// <summary>Proyección mínima de una Aplicación para el selector de <c>applicationId</c>.</summary>
public sealed record ApplicationSummary(Guid Id, string Name);

/// <summary>Contrato intra-proceso hacia el módulo Application: evita consultas cross-schema (constitución §3).</summary>
public interface IApplicationModuleApi
{
    Task<bool> ExistsAsync(Guid applicationId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ApplicationSummary>> ListAsync(CancellationToken cancellationToken = default);
}
