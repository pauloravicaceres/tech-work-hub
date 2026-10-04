using FluentValidation;
using Sprints.Domain.Sprints;

namespace Sprints.Features.Sprints.CreateSprint;

public class CreateSprintValidator : AbstractValidator<CreateSprintCommand>
{
    public CreateSprintValidator()
    {
        RuleFor(x => x.Identification)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(SprintRules.IdentificationRequiredMessage)
            .MaximumLength(SprintRules.IdentificationMaxLength).WithMessage(SprintRules.IdentificationTooLongMessage)
            .OverridePropertyName(SprintRules.IdentificationField);

        RuleFor(x => x.StartDate)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(SprintRules.StartDateRequiredMessage)
            .Must(BeValidDate).WithMessage(SprintRules.StartDateFormatMessage)
            .OverridePropertyName(SprintRules.StartDateField);

        RuleFor(x => x.EndDate)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage(SprintRules.EndDateRequiredMessage)
            .Must(BeValidDate).WithMessage(SprintRules.EndDateFormatMessage)
            .OverridePropertyName(SprintRules.EndDateField);

        RuleFor(x => x)
            .Custom((command, context) =>
            {
                if (!SprintRules.TryParseDate(command.StartDate, out var start)
                    || !SprintRules.TryParseDate(command.EndDate, out var end))
                {
                    return;
                }

                if (end <= start)
                {
                    context.AddFailure(SprintRules.EndDateField, SprintRules.EndNotAfterStartMessage);
                }
                else if (end.DayNumber - start.DayNumber != SprintRules.WindowDays - 1)
                {
                    context.AddFailure(SprintRules.EndDateField, SprintRules.WindowMessage);
                }
            });
    }

    private static bool BeValidDate(string? value) => SprintRules.TryParseDate(value, out _);
}
