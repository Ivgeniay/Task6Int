using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JointPresentationService.Persistence.Configurations
{
    internal class SlideConfiguration : IEntityTypeConfiguration<Slide>
    {
        public void Configure(EntityTypeBuilder<Slide> builder)
        {
            builder.ToTable(PersistenceConstants.TableNames.Slides);

            builder.HasKey(s => s.Id);

            builder.Property(s => s.Id)
                .HasColumnName(PersistenceConstants.TableNames.SlidesId)
                .ValueGeneratedOnAdd();

            builder.Property(s => s.Order)
                .IsRequired();

            builder.Property(s => s.PresentationId)
                .IsRequired();

            builder.Property(s => s.CreatedAt)
                .IsRequired();

            builder.Property(s => s.UpdatedAt)
                .IsRequired();

            builder.HasOne(s => s.Presentation)
                .WithMany(p => p.Slides)
                .HasForeignKey(s => s.PresentationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
