using Application.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Application.Data.Configurations;

public class RegisteredApplicationConfiguration : IEntityTypeConfiguration<RegisteredApplication>
{
    public const string TableName = "Applications";

    public void Configure(EntityTypeBuilder<RegisteredApplication> builder)
    {
        builder.ToTable(TableName, ApplicationDbContext.SchemaName);

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(RegisteredApplication.NameMaxLength);
    }
}
