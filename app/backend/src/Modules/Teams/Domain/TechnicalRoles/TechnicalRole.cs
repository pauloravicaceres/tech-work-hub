using Shared.Domain;

namespace Teams.Domain.TechnicalRoles;

/// <summary>Rol técnico del catálogo sembrado; solo lectura: no hay alta, edición ni baja (ADR-003).</summary>
public class TechnicalRole : Aggregate<Guid>
{
    public string Name { get; private set; } = default!;

    private TechnicalRole() { } // For EF Core
}
