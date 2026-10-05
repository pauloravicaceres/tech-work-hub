namespace Teams.Domain.ItemAssignments;

/// <summary>Fuente única de nombres de campo, mensajes e índice único de la asignación de miembros a elementos (camelCase).</summary>
public static class ItemAssignmentRules
{
    public const string ItemIdField = "itemId";
    public const string MemberIdField = "memberId";

    public const string ItemIdRequiredMessage = "El identificador del elemento es obligatorio.";
    public const string ItemIdInvalidMessage = "El identificador del elemento no tiene un formato válido.";
    public const string MemberIdRequiredMessage = "El identificador del miembro es obligatorio.";
    public const string MemberIdInvalidMessage = "El identificador del miembro no tiene un formato válido.";
    public const string MemberNotFoundMessage = "El miembro indicado no existe.";
    public const string ItemNotFoundMessage = "El elemento indicado no existe.";

    public const string PairUniqueIndexName = "UX_ItemAssignments_ItemId_MemberId";
    public const string MemberIdIndexName = "IX_ItemAssignments_MemberId";
}
