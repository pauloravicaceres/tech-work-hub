using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Shared.Domain;
using Shared.Identity;

namespace Shared.Data.Interceptors;

/// <summary>Asigna CreatedAt/CreatedBy (y LastModified*) desde el claim del token. Sin claim lanza <see cref="UnauthorizedAccessException"/> (HTTP 401).</summary>
public class AuditableEntityInterceptor(ICurrentUser currentUser, TimeProvider timeProvider) : SaveChangesInterceptor
{
    public const string MissingIdentityMessage = "No se encontró el claim de identidad del usuario autenticado.";

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        UpdateEntities(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateEntities(DbContext? context)
    {
        if (context is null) return;

        var entries = context.ChangeTracker.Entries<IAuditableEntity>()
            .Where(e => e.State is EntityState.Added or EntityState.Modified)
            .ToList();
        if (entries.Count == 0) return;

        var user = currentUser.UserId ?? throw new UnauthorizedAccessException(MissingIdentityMessage);
        var now = timeProvider.GetUtcNow().UtcDateTime;

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.MarkCreated(now, user);
            }
            else
            {
                entry.Entity.MarkModified(now, user);
            }
        }
    }
}
