using Backlog.Contracts;
using Backlog.Data;
using Backlog.Domain.BacklogItems;
using FluentValidation;
using FluentValidation.Results;
using MediatR;
using Shared.Exceptions;
using Shared.Identity;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public class CreateBacklogItemCommandHandler(IBacklogDbContext db, IApplicationModuleApi applications, ICurrentUser currentUser)
    : IRequestHandler<CreateBacklogItemCommand, Guid>
{
    public const string ApplicationNotFoundMessage = "The specified Application does not exist.";
    public const string InvalidTypeMessage = "Invalid BacklogItemType.";
    public const string MissingIdentityMessage = "No se encontró el claim de identidad del usuario autenticado.";

    public async Task<Guid> Handle(CreateBacklogItemCommand request, CancellationToken cancellationToken)
    {
        // FR-009: la identidad se resuelve antes de cualquier acceso a datos (catálogo de aplicaciones incluido).
        _ = currentUser.UserId ?? throw new UnauthorizedAccessException(MissingIdentityMessage);

        if (!Enum.TryParse<BacklogItemType>(request.Type, ignoreCase: true, out var type) || !Enum.IsDefined(type))
        {
            throw new BadRequestException(InvalidTypeMessage, nameof(CreateBacklogItemCommand.Type));
        }

        if (request.ApplicationId is { } applicationId
            && !await applications.ExistsAsync(applicationId, cancellationToken))
        {
            throw new ValidationException([
                new ValidationFailure(nameof(CreateBacklogItemCommand.ApplicationId), ApplicationNotFoundMessage)
            ]);
        }

        var item = BacklogItem.Create(
            Guid.NewGuid(),
            request.Title,
            request.Description,
            type,
            request.Priority,
            request.AcceptanceCriteria,
            request.DevPoints,
            request.QAPoints,
            request.ApplicationId);

        db.BacklogItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);

        return item.Id;
    }
}
