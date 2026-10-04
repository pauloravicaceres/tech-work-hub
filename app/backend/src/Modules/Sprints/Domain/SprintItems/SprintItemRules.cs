namespace Sprints.Domain.SprintItems;

/// <summary>
/// Fuente única de nombres de campo (camelCase, contrato OpenAPI), mensajes y nombres de índice de la asignación
/// Sprint–Elemento: los comparten el validador, el handler, <see cref="SprintItem.Create"/> y la configuración EF.
/// </summary>
public static class SprintItemRules
{
    public const int UserMaxLength = 255;

    public const string SprintIdField = "sprintId";
    public const string ItemIdField = "itemId";

    public const string ItemIdUniqueIndexName = "UX_SprintItems_ItemId";
    public const string SprintIdIndexName = "IX_SprintItems_SprintId";

    public const string SprintNotFoundMessage = "El Sprint indicado no existe.";
    public const string ItemNotFoundMessage = "El elemento del backlog indicado no existe.";
    public const string ItemAlreadyAssignedMessage = "El elemento ya está asignado a un Sprint.";
    public const string SprintIdRequiredMessage = "El identificador del Sprint es obligatorio.";
    public const string ItemIdRequiredMessage = "El identificador del elemento es obligatorio.";
    public const string SprintIdFormatMessage = "El identificador del Sprint no tiene un formato válido.";
    public const string ItemIdFormatMessage = "El identificador del elemento no tiene un formato válido.";

    /// <summary>Un identificador válido es un GUID parseable y distinto de <see cref="Guid.Empty"/>.</summary>
    public static bool TryParseId(string? value, out Guid id) => Guid.TryParse(value, out id) && id != Guid.Empty;
}
