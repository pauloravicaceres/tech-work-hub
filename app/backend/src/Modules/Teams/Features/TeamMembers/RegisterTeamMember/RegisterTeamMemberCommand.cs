using MediatR;

namespace Teams.Features.TeamMembers.RegisterTeamMember;

/// <summary><c>Role</c> es el NOMBRE del rol técnico del catálogo (p. ej. "Desarrollo", "QA").</summary>
public record RegisterTeamMemberCommand(string? Name, string? Role) : IRequest<TeamMemberResponse>;
