using Microsoft.EntityFrameworkCore;
using Shared.Data.Interceptors;
using Shared.Identity;
using Teams.Data;
using Teams.Domain.TeamMembers;

namespace Unit.Teams;

/// <summary>Contexto real del módulo sobre el proveedor en memoria, con el catálogo de roles sembrado por <c>HasData</c>.</summary>
internal static class TeamsInMemoryDb
{
    public static TeamsDbContext Create() => Build(interceptor: null);

    /// <summary>Con el interceptor real de auditoría, igual que en producción: rellena CreatedAt/CreatedBy desde <paramref name="user"/>.</summary>
    public static TeamsDbContext CreateAudited(ICurrentUser user) =>
        Build(new AuditableEntityInterceptor(user, TimeProvider.System));

    private static TeamsDbContext Build(AuditableEntityInterceptor? interceptor)
    {
        var builder = new DbContextOptionsBuilder<TeamsDbContext>().UseInMemoryDatabase($"teams_{Guid.NewGuid():N}");
        if (interceptor is not null) builder.AddInterceptors(interceptor);

        var db = new TeamsDbContext(builder.Options);
        db.Database.EnsureCreated();
        return db;
    }

    public static async Task<TeamMember> SeedMemberAsync(TeamsDbContext db, string name, Guid roleId, DateTime? createdAt = null)
    {
        var member = TeamMember.Create(name, roleId);
        member.MarkCreated(createdAt ?? DateTime.UtcNow, "seed-user"); // en producción lo hace AuditableEntityInterceptor
        db.TeamMembers.Add(member);
        await db.SaveChangesAsync();
        return member;
    }
}
