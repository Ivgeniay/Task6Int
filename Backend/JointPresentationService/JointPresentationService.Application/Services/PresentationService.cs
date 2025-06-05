using JointPresentationService.Application.Interfaces;
using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Domain.Models;
using JointPresentationService.Domain;
using JointPresentationService.Application.Models;

namespace JointPresentationService.Application.Services
{
    public class PresentationService : IPresentationService
    {
        private readonly IPresentationRepository _presentationRepository;
        private readonly ISlideRepository _slideRepository;
        private readonly IUserRepository _userRepository;

        public PresentationService(
            IPresentationRepository presentationRepository,
            ISlideRepository slideRepository,
            IUserRepository userRepository)
        {
            _presentationRepository = presentationRepository;
            _slideRepository = slideRepository;
            _userRepository = userRepository;
        }

        public async Task<Presentation> GetByIdAsync(int presentationId)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException($"Presentation not found {presentationId}");
            }
            return presentation;
        }

        public async Task<Presentation> CreatePresentationAsync(string title, int creatorId)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                throw new ArgumentException("Title cannot be null or empty", nameof(title));
            }

            if (title.Length > DomainConstants.Lengths.TITLE_MAX_LENGTH)
            {
                throw new ArgumentException($"Title cannot exceed {DomainConstants.Lengths.TITLE_MAX_LENGTH} characters", nameof(title));
            }

            var creator = await _userRepository.GetByIdAsync(creatorId);
            if (creator == null)
            {
                throw new ArgumentException("User not found");
            }

            var presentation = new Presentation
            {
                Title = title,
                CreatorId = creatorId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createdPresentation = await _presentationRepository.CreateAsync(presentation);

            var firstSlide = new Slide
            {
                PresentationId = createdPresentation.Id,
                Order = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _slideRepository.CreateAsync(firstSlide);

            return createdPresentation;
        }

        public async Task DeletePresentationAsync(int presentationId)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException("Presentation not found");
            }

            await _presentationRepository.DeleteAsync(presentationId);
        }

        public async Task<Presentation> JoinPresentationAsync(int presentationId, int userId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            var presentation = await _presentationRepository.GetByIdWithSlidesAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException("Presentation not found");
            }

            return presentation;
        }

        public async Task<bool> CanUserEditAsync(int presentationId, int userId)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                return false;
            }

            if (presentation.CreatorId == userId)
            {
                return true;
            }

            return await _presentationRepository.IsUserEditorAsync(presentationId, userId);
        }

        public async Task<Slide> AddSlideAsync(int presentationId, int userId)
        {
            var canEdit = await CanUserEditAsync(presentationId, userId);
            if (!canEdit)
            {
                throw new UnauthorizedAccessException("User does not have permission to edit this presentation");
            }

            var maxOrder = await _slideRepository.GetMaxOrderAsync(presentationId);

            var newSlide = new Slide
            {
                PresentationId = presentationId,
                Order = maxOrder + 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return await _slideRepository.CreateAsync(newSlide);
        }

        public async Task GrantEditorRightsAsync(int presentationId, int userId, int grantedByUserId)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException("Presentation not found");
            }

            if (presentation.CreatorId != grantedByUserId)
            {
                throw new UnauthorizedAccessException("Only the creator can grant editor rights");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("User not found");
            }

            var isAlreadyEditor = await _presentationRepository.IsUserEditorAsync(presentationId, userId);
            if (isAlreadyEditor)
            {
                throw new InvalidOperationException("User is already an editor");
            }

            await _presentationRepository.AddEditorAsync(presentationId, userId);
        }

        public async Task RemoveEditorRightsAsync(int presentationId, int userId, int removedByUserId)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException("Presentation not found");
            }

            if (presentation.CreatorId != removedByUserId)
            {
                throw new UnauthorizedAccessException("Only the creator can remove editor rights");
            }

            await _presentationRepository.RemoveEditorAsync(presentationId, userId);
        }

        public async Task<List<PresentationDto>> GetAllPresentationsAsync()
        {
            var presentations = await _presentationRepository.GetAllAsync();

            var result = new List<PresentationDto>();

            foreach (var presentation in presentations)
            {
                var presentationDto = new PresentationDto
                {
                    Id = presentation.Id,
                    Title = presentation.Title,
                    CreatedAt = presentation.CreatedAt,
                    UpdatedAt = presentation.UpdatedAt,
                    CreatorId = presentation.CreatorId,
                    Creator = presentation.Creator != null ? new UserDto
                    {
                        Id = presentation.Creator.Id,
                        Nickname = presentation.Creator.Nickname,
                        CreatedAt = presentation.Creator.CreatedAt
                    } : null,
                    Slides = presentation.Slides?.OrderBy(slide => slide.Order).Select(slide => new SlideDto
                    {
                        Id = slide.Id,
                        Order = slide.Order,
                        PresentationId = slide.PresentationId,
                        CreatedAt = slide.CreatedAt,
                        UpdatedAt = slide.UpdatedAt,
                        ElementsCount = slide.Elements?.Count ?? 0,
                        ElementIds = slide.Elements?.Select(e => e.Id).ToList() ?? new List<int>()
                    }).ToList() ?? new List<SlideDto>(),
                    EditorUsers = presentation.EditorUsers?.Where(eu => eu.User != null).Select(eu => new UserDto
                    {
                        Id = eu.User.Id,
                        Nickname = eu.User.Nickname,
                        CreatedAt = eu.User.CreatedAt
                    }).ToList() ?? new List<UserDto>()
                };

                result.Add(presentationDto);
            }

            return result;
        }

        public async Task<List<Presentation>> GetUserCreatedPresentationsAsync(int userId)
        {
            return await _presentationRepository.GetByCreatorIdAsync(userId);
        }

        public async Task<List<User>> GetPresentationEditorsAsync(int presentationId)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException("Presentation not found");
            }
            return await _presentationRepository.GetEditorsAsync(presentationId);
        }
    }
}
