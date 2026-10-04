using Application.Data;
using Backlog.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Application;

/// <summary>Implementación intra-proceso de <see cref="IApplicationModuleApi"/>: consulta solo el schema <c>application</c>.</summary>
public class ApplicationModuleApi(ApplicationDbContext db) : IApplicationModuleApi
{
    public Task<bool> ExistsAsync(Guid applicationId, CancellationToken cancellationToken = default) =>
        db.Applications.AnyAsync(a => a.Id == applicationId, cancellationToken);

    public async Task<IReadOnlyList<ApplicationSummary>> ListAsync(CancellationToken cancellationToken = default) =>
        await db.Applications
            .AsNoTracking()
            .OrderBy(a => a.Name)
            .Select(a => new ApplicationSummary(a.Id, a.Name))
            .ToListAsync(cancellationToken);
}
