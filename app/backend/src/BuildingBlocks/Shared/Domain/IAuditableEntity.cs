namespace Shared.Domain;

/// <summary>Entidad cuyos metadatos de auditoría los asigna <c>AuditableEntityInterceptor</c>, nunca el código de negocio.</summary>
public interface IAuditableEntity
{
    void MarkCreated(DateTime atUtc, string by);
    void MarkModified(DateTime atUtc, string by);
}
