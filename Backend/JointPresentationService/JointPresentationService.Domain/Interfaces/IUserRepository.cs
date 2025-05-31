using JointPresentationService.Domain.Models;

namespace JointPresentationService.Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<User> GetByIdAsync(int id);
        Task<User> GetByNicknameAsync(string nickname);
        Task<User> CreateAsync(User user);
        Task<User> UpdateAsync(User user);
        Task DeleteAsync(int id);
        Task<List<User>> GetAllAsync();
    }
}
