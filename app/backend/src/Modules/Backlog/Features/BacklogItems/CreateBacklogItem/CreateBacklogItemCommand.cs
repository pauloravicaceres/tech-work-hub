using System;
using MediatR;
using Backlog.Domain.BacklogItems;

namespace Backlog.Features.BacklogItems.CreateBacklogItem;

public record CreateBacklogItemCommand(
    string Title,
    string? Description,
    string Type,
    BacklogItemPriority Priority,
    string? AcceptanceCriteria,
    decimal? DevPoints,
    decimal? QAPoints,
    Guid? ApplicationId
) : IRequest<Guid>;
