using JointPresentationService.Application.Interfaces;
using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Domain.Models;
using JointPresentationService.Domain;

namespace JointPresentationService.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IPresentationRepository _presentationRepository;

        public UserService(
            IUserRepository userRepository,
            IPresentationRepository presentationRepository)
        {
            _userRepository = userRepository;
            _presentationRepository = presentationRepository;
        }

        public async Task<User> CreateUserAsync(string nickname)
        {
            if (string.IsNullOrWhiteSpace(nickname))
            {
                throw new ArgumentException("Nickname cannot be null or empty", nameof(nickname));
            }

            if (nickname.Length > DomainConstants.Lengths.USER_NICKNAME_MAX_LENGTH)
            {
                throw new ArgumentException($"Nickname cannot exceed {DomainConstants.Lengths.USER_NICKNAME_MAX_LENGTH} characters", nameof(nickname));
            }

            var existingUser = await _userRepository.GetByNicknameAsync(nickname);
            if (existingUser != null)
            {
                throw new InvalidOperationException("User with this nickname already exists");
            }

            var user = new User
            {
                Nickname = nickname,
                CreatedAt = DateTime.UtcNow
            };

            return await _userRepository.CreateAsync(user);
        }

        public async Task<User> GetByIdAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            return user;
        }

        public async Task<User> GetByNicknameAsync(string nickname)
        {
            if (string.IsNullOrWhiteSpace(nickname))
            {
                throw new ArgumentException("Nickname cannot be null or empty", nameof(nickname));
            }

            var user = await _userRepository.GetByNicknameAsync(nickname);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            return user;
        }

        public async Task<User> GetOrCreateUserAsync(string nickname)
        {
            if (string.IsNullOrWhiteSpace(nickname))
            {
                throw new ArgumentException("Nickname cannot be null or empty", nameof(nickname));
            }

            if (nickname.Length > DomainConstants.Lengths.USER_NICKNAME_MAX_LENGTH)
            {
                throw new ArgumentException($"Nickname cannot exceed {DomainConstants.Lengths.USER_NICKNAME_MAX_LENGTH} characters", nameof(nickname));
            }

            var existingUser = await _userRepository.GetByNicknameAsync(nickname);
            if (existingUser != null)
            {
                return existingUser;
            }

            var user = new User
            {
                Nickname = nickname,
                CreatedAt = DateTime.UtcNow
            };

            return await _userRepository.CreateAsync(user);
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _userRepository.GetAllAsync();
        }

        public async Task<List<Presentation>> GetUserEditablePresentationsAsync(int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            var createdPresentations = await _presentationRepository.GetByCreatorIdAsync(userId);

            var editorPresentations = new List<Presentation>();

            return createdPresentations.Concat(editorPresentations).ToList();
        }
    }
}
