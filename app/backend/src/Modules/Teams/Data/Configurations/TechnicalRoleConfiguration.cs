using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Teams.Domain.TechnicalRoles;

namespace Teams.Data.Configurations;

public class TechnicalRoleConfiguration : IEntityTypeConfiguration<TechnicalRole>
{
    public const string TableName = "TechnicalRoles";
    public const string NameUniqueIndexName = "UX_TechnicalRoles_Name";

    public void Configure(EntityTypeBuilder<TechnicalRole> builder)
    {
        builder.ToTable(TableName, TeamsDbContext.SchemaName);

        builder.HasKey(x => x.Id);

        builder.Ignore(x => x.DomainEvents);

        builder.Property(x => x.Name)
            .IsRequired();

        builder.HasIndex(x => x.Name)
            .IsUnique()
            .HasDatabaseName(NameUniqueIndexName);

        builder.HasData(
            new { Id = TechnicalRoleSeed.DevelopmentId, Name = TechnicalRoleSeed.DevelopmentName },
            new { Id = TechnicalRoleSeed.QaId, Name = TechnicalRoleSeed.QaName });
    }
}
