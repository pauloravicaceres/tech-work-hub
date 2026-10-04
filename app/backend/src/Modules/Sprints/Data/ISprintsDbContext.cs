using Microsoft.EntityFrameworkCore;
using Sprints.Domain.Sprints;

namespace Sprints.Data;

public interface ISprintsDbContext
{
    DbSet<Sprint> Sprints { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
