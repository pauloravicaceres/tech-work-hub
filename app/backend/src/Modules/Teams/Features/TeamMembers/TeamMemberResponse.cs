namespace Teams.Features.TeamMembers;

/// <summary>Respuesta común del alta y la consulta; no expone la auditoría (CreatedAt/CreatedBy) ni estado.</summary>
public record TeamMemberResponse(Guid Id, string Name, string Role);
