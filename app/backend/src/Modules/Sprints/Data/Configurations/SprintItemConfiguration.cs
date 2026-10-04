using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Sprints.Domain.SprintItems;
using Sprints.Domain.Sprints;

namespace Sprints.Data.Configurations;

public class SprintItemConfiguration : IEntityTypeConfiguration<SprintItem>
{
    public const string TableName = "SprintItems";

    public void Configure(EntityTypeBuilder<SprintItem> builder)
    {
        builder.ToTable(TableName, SprintsDbContext.SchemaName);

        builder.HasKey(x => x.Id);

        builder.Ignore(x => x.DomainEvents);

        builder.Property(x => x.SprintId)
            .IsRequired();

        // ItemId referencia al schema backlog: sin FK (constitución §3); la existencia la verifica IBacklogModuleApi.
        builder.Property(x => x.ItemId)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .IsRequired()
            .HasMaxLength(SprintItemRules.UserMaxLength);

        builder.Property(x => x.LastModified);

        builder.Property(x => x.LastModifiedBy)
            .HasMaxLength(SprintItemRules.UserMaxLength);

        builder.HasOne<Sprint>()
            .WithMany()
            .HasForeignKey(x => x.SprintId)
            .OnDelete(DeleteBehavior.Restrict);

        // Invariante "un elemento, un Sprint" (ADR-004).
        builder.HasIndex(x => x.ItemId)
            .IsUnique()
            .HasDatabaseName(SprintItemRules.ItemIdUniqueIndexName);

        builder.HasIndex(x => x.SprintId)
            .HasDatabaseName(SprintItemRules.SprintIdIndexName);
    }
}
