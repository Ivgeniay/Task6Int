using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JointPresentationService.Persistence.Configurations
{
    internal class SlideElementConfiguration : IEntityTypeConfiguration<SlideElement>
    {
        public void Configure(EntityTypeBuilder<SlideElement> builder)
        {
            builder.ToTable(PersistenceConstants.TableNames.SlidesElement);

            builder.HasKey(e => e.Id);

            builder.Property(e => e.Id)
                .HasColumnName(PersistenceConstants.TableNames.SlidesElementId)
                .ValueGeneratedOnAdd();

            builder.Property(e => e.SlideId)
                .IsRequired();

            builder.Property(e => e.Properties)
                .IsRequired()
                .HasColumnType("nvarchar(max)");

            builder.Property(e => e.CreatedAt)
                .IsRequired();

            builder.Property(e => e.UpdatedAt)
                .IsRequired();

            builder.Property(e => e.CreatedById)
                .IsRequired();

            builder.HasOne(e => e.Slide)
                .WithMany(s => s.Elements)
                .HasForeignKey(e => e.SlideId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(e => e.CreatedBy)
                .WithMany()
                .HasForeignKey(e => e.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
