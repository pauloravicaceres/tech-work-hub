using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Teams.Domain.TeamMembers;

namespace Teams.Data.Configurations;

public class TeamMemberConfiguration : IEntityTypeConfiguration<TeamMember>
{
    public const string TableName = "TeamMembers";
    public const string TechnicalRoleIdIndexName = "IX_TeamMembers_TechnicalRoleId";

    public void Configure(EntityTypeBuilder<TeamMember> builder)
    {
        builder.ToTable(TableName, TeamsDbContext.SchemaName);

        builder.HasKey(x => x.Id);

        builder.Ignore(x => x.DomainEvents);

        // Sin límite de longitud ni unicidad en el nombre (ADR-007, FR-015).
        builder.Property(x => x.Name)
            .IsRequired();

        builder.Property(x => x.TechnicalRoleId)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .IsRequired();

        builder.Property(x => x.LastModified);

        builder.Property(x => x.LastModifiedBy);

        // FK local al schema teams (no cruza schemas).
        builder.HasOne(x => x.TechnicalRole)
            .WithMany()
            .HasForeignKey(x => x.TechnicalRoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.TechnicalRoleId)
            .HasDatabaseName(TechnicalRoleIdIndexName);
    }
}
