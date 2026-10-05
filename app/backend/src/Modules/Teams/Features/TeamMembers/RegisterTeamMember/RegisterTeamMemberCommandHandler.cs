using MediatR;
using Microsoft.EntityFrameworkCore;
using Shared.Exceptions;
using Shared.Identity;
using Teams.Data;
using Teams.Domain.TeamMembers;

namespace Teams.Features.TeamMembers.RegisterTeamMember;

public class RegisterTeamMemberCommandHandler(ITeamsDbContext db, ICurrentUser currentUser)
    : IRequestHandler<RegisterTeamMemberCommand, TeamMemberResponse>
{
    public const string MissingIdentityMessage = "No se encontró el claim de identidad del usuario autenticado.";

    public async Task<TeamMemberResponse> Handle(RegisterTeamMemberCommand request, CancellationToken cancellationToken)
    {
        // La identidad se resuelve antes de cualquier acceso a datos.
        _ = currentUser.UserId ?? throw new UnauthorizedAccessException(MissingIdentityMessage);

        // Comparación sensible a mayúsculas: el rol debe coincidir exactamente con el catálogo.
        var role = await db.TechnicalRoles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Name == request.Role, cancellationToken)
            ?? throw new BadRequestException(TeamMemberRules.InvalidRoleMessage, TeamMemberRules.RoleField);

        var member = TeamMember.Create(request.Name, role.Id);

        db.TeamMembers.Add(member);
        await db.SaveChangesAsync(cancellationToken);

        return new TeamMemberResponse(member.Id, member.Name, role.Name);
    }
}
