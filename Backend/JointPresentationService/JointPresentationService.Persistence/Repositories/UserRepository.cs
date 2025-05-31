using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace JointPresentationService.Persistence.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationDbContext _context;

        public UserRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<User?> GetByIdAsync(int id) =>
            await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);

        public async Task<User?> GetByNicknameAsync(string nickname) =>
            await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Nickname == nickname);

        public async Task<User> CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<User> UpdateAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task DeleteAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<User>> GetAllAsync() =>
            await _context.Users.AsNoTracking().ToListAsync();
        
    }

}
