using FluentValidation;
using Backlog.Domain.BacklogItems;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public class CreateBacklogItemValidator : AbstractValidator<CreateBacklogItemCommand>
{
    public CreateBacklogItemValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Type)
            .IsEnumName(typeof(BacklogItemType), caseSensitive: false)
            .WithMessage("Invalid BacklogItemType.");

        RuleFor(x => x.DevPoints)
            .GreaterThanOrEqualTo(0)
            .When(x => x.DevPoints.HasValue);

        RuleFor(x => x.QAPoints)
            .GreaterThanOrEqualTo(0)
            .When(x => x.QAPoints.HasValue);
    }
}
