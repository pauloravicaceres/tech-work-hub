using FluentValidation;
using Sprints.Domain.SprintItems;

namespace Sprints.Features.SprintItems.AssignItemToSprint;

public class AssignItemToSprintValidator : AbstractValidator<AssignItemToSprintCommand>
{
    public AssignItemToSprintValidator()
    {
        RuleFor(x => x.SprintId)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(SprintItemRules.SprintIdRequiredMessage)
            .Must(BeValidId).WithMessage(SprintItemRules.SprintIdFormatMessage)
            .OverridePropertyName(SprintItemRules.SprintIdField);

        RuleFor(x => x.ItemId)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(SprintItemRules.ItemIdRequiredMessage)
            .Must(BeValidId).WithMessage(SprintItemRules.ItemIdFormatMessage)
            .OverridePropertyName(SprintItemRules.ItemIdField);
    }

    private static bool BeValidId(string? value) => SprintItemRules.TryParseId(value, out _);
}
