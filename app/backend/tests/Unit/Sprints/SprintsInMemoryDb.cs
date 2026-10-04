using Microsoft.EntityFrameworkCore;
using Shared.Data.Interceptors;
using Shared.Identity;
using Sprints.Data;
using Sprints.Domain.SprintItems;
using Sprints.Domain.Sprints;

namespace Unit.Sprints;

/// <summary>Contexto real del módulo sobre el proveedor en memoria, para ejercitar las consultas LINQ de los handlers.</summary>
internal static class SprintsInMemoryDb
{
    public static SprintsDbContext Create() =>
        new(new DbContextOptionsBuilder<SprintsDbContext>()
            .UseInMemoryDatabase($"sprints_{Guid.NewGuid():N}")
            .Options);

    /// <summary>Con el interceptor real de auditoría, igual que en producción: rellena CreatedAt/CreatedBy desde <paramref name="user"/>.</summary>
    public static SprintsDbContext CreateAudited(ICurrentUser user) =>
        new(new DbContextOptionsBuilder<SprintsDbContext>()
            .UseInMemoryDatabase($"sprints_{Guid.NewGuid():N}")
            .AddInterceptors(new AuditableEntityInterceptor(user, TimeProvider.System))
            .Options);

    /// <summary>Contexto que se siembra con normalidad y, tras <see cref="FailingSprintsDbContext.FailOnNextSave"/>, lanza al guardar.</summary>
    public static FailingSprintsDbContext CreateFailingOnSave() =>
        new(new DbContextOptionsBuilder<SprintsDbContext>()
            .UseInMemoryDatabase($"sprints_{Guid.NewGuid():N}")
            .Options);

    public static async Task<Sprint> SeedAsync(SprintsDbContext db, string identification, DateOnly start)
    {
        var sprint = Sprint.Create(identification, start, start.AddDays(SprintRules.WindowDays - 1));
        sprint.MarkCreated(DateTime.UtcNow, "seed-user"); // en producción lo hace AuditableEntityInterceptor
        db.Sprints.Add(sprint);
        await db.SaveChangesAsync();
        return sprint;
    }

    public static async Task<SprintItem> SeedItemAsync(SprintsDbContext db, Guid sprintId, Guid itemId, DateTime? createdAt = null)
    {
        var sprintItem = SprintItem.Create(sprintId, itemId);
        sprintItem.MarkCreated(createdAt ?? DateTime.UtcNow, "seed-user");
        db.SprintItems.Add(sprintItem);
        await db.SaveChangesAsync();
        return sprintItem;
    }
}

/// <summary>Simula el rechazo de la base de datos al guardar (p. ej. un <see cref="DbUpdateException"/> de PostgreSQL).</summary>
internal sealed class FailingSprintsDbContext(DbContextOptions<SprintsDbContext> options) : SprintsDbContext(options)
{
    private Exception? _failure;

    public void FailOnNextSave(Exception failure) => _failure = failure;

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        _failure is null ? base.SaveChangesAsync(cancellationToken) : throw _failure;
}
