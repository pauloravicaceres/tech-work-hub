namespace Teams.Domain.TechnicalRoles;

/// <summary>Catálogo sembrado de roles técnicos (ADR-003): identificadores fijos para que la semilla sea idempotente entre entornos.</summary>
public static class TechnicalRoleSeed
{
    public static readonly Guid DevelopmentId = new("0b6f1d3a-5c1e-4d57-9a53-6a1c2f0e7b11");
    public static readonly Guid QaId = new("7d2e9c48-3b6a-4f0c-8e15-b4a9d1c63f22");

    public const string DevelopmentName = "Desarrollo";
    public const string QaName = "QA";
}
