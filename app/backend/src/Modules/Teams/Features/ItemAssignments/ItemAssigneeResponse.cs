namespace Teams.Features.ItemAssignments;

/// <summary>Relación Persona–Elemento; no expone la auditoría (CreatedAt/CreatedBy).</summary>
public record ItemAssigneeResponse(Guid ItemId, Guid MemberId, string MemberName, string Role);
