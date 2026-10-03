using Backlog.Domain.BacklogItems;
using FluentValidation;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public class CreateBacklogItemValidator : AbstractValidator<CreateBacklogItemCommand>
{
    public CreateBacklogItemValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(BacklogItemRules.TitleMaxLength);

        RuleFor(x => x.Description)
            .MaximumLength(BacklogItemRules.DescriptionMaxLength);

        RuleFor(x => x.AcceptanceCriteria)
            .MaximumLength(BacklogItemRules.AcceptanceCriteriaMaxLength);

        RuleFor(x => x.Type)
            .NotEmpty()
            .IsEnumName(typeof(BacklogItemType), caseSensitive: false)
            .WithMessage(CreateBacklogItemCommandHandler.InvalidTypeMessage);

        RuleFor(x => x.Priority)
            .IsInEnum();

        RuleFor(x => x.DevPoints)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DevPoints.HasValue);

        RuleFor(x => x.QAPoints)
            .GreaterThanOrEqualTo(0)
            .When(x => x.QAPoints.HasValue);
    }
}
