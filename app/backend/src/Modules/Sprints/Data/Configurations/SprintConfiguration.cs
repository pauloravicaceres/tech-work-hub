using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sprints.Domain.Sprints;

namespace Sprints.Data.Configurations;

public class SprintConfiguration : IEntityTypeConfiguration<Sprint>
{
    public const string TableName = "Sprints";
    public const string WindowConstraintName = "CK_Sprints_Window";

    public void Configure(EntityTypeBuilder<Sprint> builder)
    {
        builder.ToTable(TableName, SprintsDbContext.SchemaName, table =>
            table.HasCheckConstraint(
                WindowConstraintName,
                $"(\"{nameof(Sprint.EndDate)}\" - \"{nameof(Sprint.StartDate)}\") = {SprintRules.WindowDays - 1}"));

        builder.HasKey(x => x.Id);

        builder.Ignore(x => x.DomainEvents);

        builder.Property(x => x.Identification)
            .IsRequired()
            .HasMaxLength(SprintRules.IdentificationMaxLength);

        builder.Property(x => x.StartDate)
            .IsRequired();

        builder.Property(x => x.EndDate)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .IsRequired()
            .HasMaxLength(SprintRules.UserMaxLength);

        builder.Property(x => x.LastModified);

        builder.Property(x => x.LastModifiedBy)
            .HasMaxLength(SprintRules.UserMaxLength);
    }
}
