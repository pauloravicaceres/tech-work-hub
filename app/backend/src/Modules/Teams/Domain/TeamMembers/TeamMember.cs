using Shared.Domain;
using Shared.Exceptions;
using Teams.Domain.TechnicalRoles;

namespace Teams.Domain.TeamMembers;

public class TeamMember : Aggregate<Guid>, IAuditableEntity
{
    public string Name { get; private set; } = default!;
    public Guid TechnicalRoleId { get; private set; }
    public TechnicalRole? TechnicalRole { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public string CreatedBy { get; private set; } = default!;
    public DateTime? LastModified { get; private set; }
    public string? LastModifiedBy { get; private set; }

    private TeamMember() { } // For EF Core

    /// <exception cref="BadRequestException">Nombre vacío o de solo espacios, o rol sin identificar.</exception>
    public static TeamMember Create(string? name, Guid technicalRoleId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new BadRequestException(TeamMemberRules.NameRequiredMessage, TeamMemberRules.NameField);
        }

        if (technicalRoleId == Guid.Empty)
        {
            throw new BadRequestException(TeamMemberRules.RoleRequiredMessage, TeamMemberRules.RoleField);
        }

        return new TeamMember
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            TechnicalRoleId = technicalRoleId
        };
    }

    public void MarkCreated(DateTime atUtc, string by)
    {
        CreatedAt = atUtc;
        CreatedBy = by;
    }

    public void MarkModified(DateTime atUtc, string by)
    {
        LastModified = atUtc;
        LastModifiedBy = by;
    }
}
