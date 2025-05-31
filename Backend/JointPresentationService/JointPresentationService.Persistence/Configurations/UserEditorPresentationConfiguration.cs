using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JointPresentationService.Persistence.Configurations
{
    internal class UserEditorPresentationConfiguration : IEntityTypeConfiguration<UserEditorPresentation>
    {
        public void Configure(EntityTypeBuilder<UserEditorPresentation> builder)
        {
            builder.ToTable(PersistenceConstants.TableNames.UserEditorPresentations);

            builder.HasKey(ue => new { ue.UserId, ue.PresentationId });

            builder.Property(ue => ue.UserId)
                .IsRequired();

            builder.Property(ue => ue.PresentationId)
                .IsRequired();
            
            builder.Property(x => x.AddedAt)
                .IsRequired();

            builder.HasOne(ue => ue.User)
                .WithMany(u => u.EditorPresentations)
                .HasForeignKey(ue => ue.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(ue => ue.Presentation)
                .WithMany(p => p.EditorUsers)
                .HasForeignKey(ue => ue.PresentationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
