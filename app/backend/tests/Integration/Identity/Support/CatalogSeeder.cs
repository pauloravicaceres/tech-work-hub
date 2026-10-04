using Application.Data;
using Application.Domain;
using Microsoft.Extensions.DependencyInjection;

namespace Integration.Identity.Support;

/// <summary>Crea aplicaciones en el catálogo REAL (schema application) mediante el ApplicationDbContext del host.</summary>
public static class CatalogSeeder
{
    public static async Task<IReadOnlyList<Guid>> SeedAsync(IServiceProvider services, params string[] names)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var ids = new List<Guid>();
        foreach (var name in names)
        {
            var id = Guid.NewGuid();
            db.Applications.Add(RegisteredApplication.Create(id, name));
            ids.Add(id);
        }

        await db.SaveChangesAsync();
        return ids;
    }
}
