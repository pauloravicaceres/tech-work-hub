using MediatR;

namespace Teams.Features.TeamMembers.ListTeamMembers;

public record ListTeamMembersQuery : IRequest<IReadOnlyList<TeamMemberResponse>>;
