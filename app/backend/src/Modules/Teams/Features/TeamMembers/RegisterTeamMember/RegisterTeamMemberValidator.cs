using FluentValidation;
using Teams.Domain.TeamMembers;

namespace Teams.Features.TeamMembers.RegisterTeamMember;

public class RegisterTeamMemberValidator : AbstractValidator<RegisterTeamMemberCommand>
{
    public RegisterTeamMemberValidator()
    {
        // Sin MaximumLength: el nombre no tiene límite de longitud (ADR-007).
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage(TeamMemberRules.NameRequiredMessage)
            .OverridePropertyName(TeamMemberRules.NameField);

        RuleFor(x => x.Role)
            .NotEmpty().WithMessage(TeamMemberRules.RoleRequiredMessage)
            .OverridePropertyName(TeamMemberRules.RoleField);
    }
}
