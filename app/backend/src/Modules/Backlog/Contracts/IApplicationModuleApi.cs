namespace Backlog.Contracts;

/// <summary>Contrato intra-proceso hacia el módulo Application: evita consultas cross-schema (constitución §3).</summary>
public interface IApplicationModuleApi
{
    Task<bool> ExistsAsync(Guid applicationId, CancellationToken cancellationToken = default);
}
