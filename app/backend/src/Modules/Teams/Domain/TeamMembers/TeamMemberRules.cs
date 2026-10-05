namespace Teams.Domain.TeamMembers;

/// <summary>Fuente única de nombres de campo y mensajes del registro de miembros (contrato OpenAPI, camelCase).</summary>
public static class TeamMemberRules
{
    public const string NameField = "name";
    public const string RoleField = "role";

    public const string NameRequiredMessage = "El nombre del miembro es obligatorio.";
    public const string RoleRequiredMessage = "El rol técnico es obligatorio.";
    public const string InvalidRoleMessage = "El rol indicado no es válido.";
}
