using Backlog.Domain.BacklogItems;
using Microsoft.EntityFrameworkCore;

namespace Backlog.Data;

public interface IBacklogDbContext
{
    DbSet<BacklogItem> BacklogItems { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
