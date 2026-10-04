using Backlog.Domain.BacklogItems;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Backlog.Data.Configurations;

public class BacklogItemConfiguration : IEntityTypeConfiguration<BacklogItem>
{
    public const string TableName = "BacklogItems";

    public void Configure(EntityTypeBuilder<BacklogItem> builder)
    {
        builder.ToTable(TableName, BacklogDbContext.SchemaName);

        builder.HasKey(x => x.Id);

        builder.Ignore(x => x.DomainEvents);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(BacklogItemRules.TitleMaxLength);

        builder.Property(x => x.Description)
            .HasMaxLength(BacklogItemRules.DescriptionMaxLength);

        builder.Property(x => x.Type)
            .IsRequired()
            .HasMaxLength(BacklogItemRules.EnumColumnMaxLength)
            .HasConversion<string>();

        builder.Property(x => x.Priority)
            .IsRequired()
            .HasMaxLength(BacklogItemRules.EnumColumnMaxLength)
            .HasConversion<string>();

        builder.Property(x => x.AcceptanceCriteria)
            .HasMaxLength(BacklogItemRules.AcceptanceCriteriaMaxLength);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(BacklogItemRules.EnumColumnMaxLength)
            .HasConversion<string>();

        builder.Property(x => x.DevPoints)
            .HasPrecision(BacklogItemRules.PointsPrecision, BacklogItemRules.PointsScale);

        builder.Property(x => x.QAPoints)
            .HasPrecision(BacklogItemRules.PointsPrecision, BacklogItemRules.PointsScale);

        builder.Property(x => x.ApplicationId);

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .IsRequired()
            .HasMaxLength(BacklogItemRules.UserMaxLength);

        builder.Property(x => x.LastModified);

        builder.Property(x => x.LastModifiedBy)
            .HasMaxLength(BacklogItemRules.UserMaxLength);
    }
}
