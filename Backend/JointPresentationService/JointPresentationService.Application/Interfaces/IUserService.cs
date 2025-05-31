using JointPresentationService.Domain.Models;

namespace JointPresentationService.Application.Interfaces
{
    public interface IUserService
    {
        Task<User> CreateUserAsync(string nickname);
        Task<User> GetByIdAsync(int userId);
        Task<User> GetByNicknameAsync(string nickname);
        Task<User> GetOrCreateUserAsync(string nickname);
        Task<List<User>> GetAllUsersAsync();
        Task<List<Presentation>> GetUserEditablePresentationsAsync(int userId);
    }
}
