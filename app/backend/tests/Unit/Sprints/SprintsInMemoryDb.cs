using Microsoft.EntityFrameworkCore;
using Sprints.Data;
using Sprints.Domain.Sprints;

namespace Unit.Sprints;

/// <summary>Contexto real del módulo sobre el proveedor en memoria, para ejercitar las consultas LINQ de los handlers.</summary>
internal static class SprintsInMemoryDb
{
    public static SprintsDbContext Create() =>
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
}
