using Microsoft.EntityFrameworkCore;
using Sprints.Domain.SprintItems;
using Sprints.Domain.Sprints;

namespace Sprints.Data;

public interface ISprintsDbContext
{
    DbSet<Sprint> Sprints { get; }

    DbSet<SprintItem> SprintItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
