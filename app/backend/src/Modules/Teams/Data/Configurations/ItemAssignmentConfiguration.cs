using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Teams.Domain.ItemAssignments;

namespace Teams.Data.Configurations;

public class ItemAssignmentConfiguration : IEntityTypeConfiguration<ItemAssignment>
{
    public const string TableName = "ItemAssignments";

    public void Configure(EntityTypeBuilder<ItemAssignment> builder)
    {
        builder.ToTable(TableName, TeamsDbContext.SchemaName);

        builder.HasKey(x => x.Id);

        builder.Ignore(x => x.DomainEvents);

        // ItemId: referencia lógica al schema backlog; sin FK (ADR-002).
        builder.Property(x => x.ItemId)
            .IsRequired();

        builder.Property(x => x.MemberId)
            .IsRequired();

        builder.Property(x => x.CreatedAt)
            .IsRequired();

        builder.Property(x => x.CreatedBy)
            .IsRequired();

        builder.Property(x => x.LastModified);

        builder.Property(x => x.LastModifiedBy);

        // FK local al schema teams (no cruza schemas).
        builder.HasOne(x => x.Member)
            .WithMany()
            .HasForeignKey(x => x.MemberId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new { x.ItemId, x.MemberId })
            .IsUnique()
            .HasDatabaseName(ItemAssignmentRules.PairUniqueIndexName);

        builder.HasIndex(x => x.MemberId)
            .HasDatabaseName(ItemAssignmentRules.MemberIdIndexName);
    }
}
