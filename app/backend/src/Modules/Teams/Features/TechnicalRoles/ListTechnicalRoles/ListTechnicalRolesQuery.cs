using MediatR;

namespace Teams.Features.TechnicalRoles.ListTechnicalRoles;

public record ListTechnicalRolesQuery : IRequest<IReadOnlyList<TechnicalRoleResponse>>;
