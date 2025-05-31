using JointPresentationService.Domain;
using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JointPresentationService.Persistence.Configurations
{
    internal class PresentationConfiguration : IEntityTypeConfiguration<Presentation>
    {
        public void Configure(EntityTypeBuilder<Presentation> builder)
        {
            builder.ToTable(PersistenceConstants.TableNames.Presentations);

            builder.HasKey(p => p.Id);

            builder.Property(p => p.Id)
                .HasColumnName(PersistenceConstants.TableNames.PresentationsId)
                .ValueGeneratedOnAdd();

            builder.Property(p => p.Title)
                .IsRequired()
                .HasMaxLength(DomainConstants.Lengths.TITLE_MAX_LENGTH);

            builder.Property(p => p.CreatedAt)
                .IsRequired();

            builder.Property(p => p.UpdatedAt)
                .IsRequired();

            builder.Property(p => p.CreatorId)
                .IsRequired();

            builder.HasOne(p => p.Creator)
                .WithMany(u => u.CreatedPresentations)
                .HasForeignKey(p => p.CreatorId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
