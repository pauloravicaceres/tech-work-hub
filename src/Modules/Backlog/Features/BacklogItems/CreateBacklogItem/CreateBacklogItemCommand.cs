using System;
using MediatR;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public record CreateBacklogItemCommand(
    string Title,
    string? Description,
    string Type,
    int? DevPoints,
    int? QAPoints,
    Guid? ApplicationId
) : IRequest<Guid>;
