using Application.Data;
using Backlog.Contracts;
using Microsoft.EntityFrameworkCore;

namespace Application;

/// <summary>Implementación intra-proceso de <see cref="IApplicationModuleApi"/>: consulta solo el schema <c>application</c>.</summary>
public class ApplicationModuleApi(ApplicationDbContext db) : IApplicationModuleApi
{
    public Task<bool> ExistsAsync(Guid applicationId, CancellationToken cancellationToken = default) =>
        db.Applications.AnyAsync(a => a.Id == applicationId, cancellationToken);
}
