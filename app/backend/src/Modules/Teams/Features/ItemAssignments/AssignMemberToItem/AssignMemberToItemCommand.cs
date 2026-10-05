using MediatR;

namespace Teams.Features.ItemAssignments.AssignMemberToItem;

/// <summary><c>ItemId</c> y <c>MemberId</c> viajan como texto para reportar el formato inválido por campo (ADR-008).</summary>
public record AssignMemberToItemCommand(string ItemId, string? MemberId) : IRequest<AssignMemberToItemResult>;

/// <summary><c>Created</c>: <c>true</c> = relación nueva (201); <c>false</c> = el par ya existía (200, idempotente).</summary>
public record AssignMemberToItemResult(ItemAssigneeResponse Response, bool Created);
