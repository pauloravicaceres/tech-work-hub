using FluentValidation;
using Teams.Domain.ItemAssignments;

namespace Teams.Features.ItemAssignments.AssignMemberToItem;

public class AssignMemberToItemValidator : AbstractValidator<AssignMemberToItemCommand>
{
    public AssignMemberToItemValidator()
    {
        RuleFor(x => x.ItemId)
            .Cascade(CascadeMode.Stop)
            .Must(value => !string.IsNullOrWhiteSpace(value)).WithMessage(ItemAssignmentRules.ItemIdRequiredMessage)
            .Must(BeNonEmptyGuid).WithMessage(ItemAssignmentRules.ItemIdInvalidMessage)
            .OverridePropertyName(ItemAssignmentRules.ItemIdField);

        RuleFor(x => x.MemberId)
            .Cascade(CascadeMode.Stop)
            .Must(value => !string.IsNullOrWhiteSpace(value)).WithMessage(ItemAssignmentRules.MemberIdRequiredMessage)
            .Must(BeNonEmptyGuid).WithMessage(ItemAssignmentRules.MemberIdInvalidMessage)
            .OverridePropertyName(ItemAssignmentRules.MemberIdField);
    }

    private static bool BeNonEmptyGuid(string? value) =>
        Guid.TryParse(value, out var id) && id != Guid.Empty;
}
