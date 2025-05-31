using JointPresentationService.Domain;
using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace JointPresentationService.Persistence.Configurations
{
    internal class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
            builder.ToTable(PersistenceConstants.TableNames.Users);

            builder.HasKey(u => u.Id);

            builder.Property(u => u.Id)
                .HasColumnName(PersistenceConstants.TableNames.UsersId)
                .ValueGeneratedOnAdd();

            builder.Property(u => u.Nickname)
                .IsRequired()
                .HasMaxLength(DomainConstants.Lengths.USER_NICKNAME_MAX_LENGTH);

            builder.Property(u => u.CreatedAt)
                .IsRequired();
        }
    }
}
