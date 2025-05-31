using JointPresentationService.Application.Interfaces;
using JointPresentationService.Domain.Interfaces;
using JointPresentationService.Domain.Models;

namespace JointPresentationService.Application.Services
{
    public class SlideService : ISlideService
    {
        private readonly ISlideRepository _slideRepository;
        private readonly ISlideElementRepository _slideElementRepository;
        private readonly IPresentationRepository _presentationRepository;

        public SlideService(
            ISlideRepository slideRepository,
            ISlideElementRepository slideElementRepository,
            IPresentationRepository presentationRepository)
        {
            _slideRepository = slideRepository;
            _slideElementRepository = slideElementRepository;
            _presentationRepository = presentationRepository;
        }

        public async Task<List<Slide>> GetByPresentationIdAsync(int presentationId)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException("Presentation not found");
            }
            return presentation.Slides;
        }

        public async Task<Slide> GetSlideWithElementsAsync(int slideId)
        {
            var slide = await _slideRepository.GetByIdWithElementsAsync(slideId);
            if (slide == null)
            {
                throw new ArgumentException("Slide not found");
            }

            return slide;
        }

        public async Task<SlideElement> AddElementAsync(int slideId, int userId, string properties)
        {
            var slide = await _slideRepository.GetByIdAsync(slideId);
            if (slide == null)
            {
                throw new ArgumentException("Slide not found");
            }

            var canEdit = await CanUserEditPresentationAsync(slide.PresentationId, userId);
            if (!canEdit)
            {
                throw new UnauthorizedAccessException("User does not have permission to edit this presentation");
            }

            if (string.IsNullOrWhiteSpace(properties))
            {
                throw new ArgumentException("Properties cannot be null or empty", nameof(properties));
            }

            var element = new SlideElement
            {
                SlideId = slideId,
                Properties = properties,
                CreatedById = userId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return await _slideElementRepository.CreateAsync(element);
        }

        public async Task<SlideElement> UpdateElementAsync(int elementId, int userId, string properties)
        {
            var element = await _slideElementRepository.GetByIdAsync(elementId);
            if (element == null)
            {
                throw new ArgumentException("Element not found");
            }

            var slide = await _slideRepository.GetByIdAsync(element.SlideId);
            var canEdit = await CanUserEditPresentationAsync(slide.PresentationId, userId);
            if (!canEdit)
            {
                throw new UnauthorizedAccessException("User does not have permission to edit this presentation");
            }

            if (string.IsNullOrWhiteSpace(properties))
            {
                throw new ArgumentException("Properties cannot be null or empty", nameof(properties));
            }

            element.Properties = properties;
            element.UpdatedAt = DateTime.UtcNow;

            return await _slideElementRepository.UpdateAsync(element);
        }

        public async Task DeleteElementAsync(int elementId, int userId)
        {
            var element = await _slideElementRepository.GetByIdAsync(elementId);
            if (element == null)
            {
                throw new ArgumentException("Element not found");
            }

            var slide = await _slideRepository.GetByIdAsync(element.SlideId);
            var canEdit = await CanUserEditPresentationAsync(slide.PresentationId, userId);
            if (!canEdit)
            {
                throw new UnauthorizedAccessException("User does not have permission to edit this presentation");
            }

            await _slideElementRepository.DeleteAsync(elementId);
        }

        public async Task DeleteSlideAsync(int slideId, int userId)
        {
            var slide = await _slideRepository.GetByIdAsync(slideId);
            if (slide == null)
            {
                throw new ArgumentException("Slide not found");
            }

            var presentation = await _presentationRepository.GetByIdAsync(slide.PresentationId);
            if (presentation.CreatorId != userId)
            {
                throw new UnauthorizedAccessException("Only the presentation creator can delete slides");
            }

            await _slideElementRepository.DeleteBySlideIdAsync(slideId);
            await _slideRepository.DeleteAsync(slideId);
        }

        public async Task<List<Slide>> ReorderSlidesAsync(int presentationId, int userId, List<int> slideIds)
        {
            var presentation = await _presentationRepository.GetByIdAsync(presentationId);
            if (presentation == null)
            {
                throw new ArgumentException("Presentation not found");
            }

            if (presentation.CreatorId != userId)
            {
                throw new UnauthorizedAccessException("Only the presentation creator can reorder slides");
            }

            await _slideRepository.ReorderSlidesAsync(presentationId, slideIds);
            return await _slideRepository.GetByPresentationIdAsync(presentationId);
        }

        public async Task<List<SlideElement>> GetSlideElementsAsync(int slideId)
        {
            var slide = await _slideRepository.GetByIdAsync(slideId);
            if (slide == null)
            {
                throw new ArgumentException("Slide not found");
            }

            return await _slideElementRepository.GetBySlideIdAsync(slideId);
        }

        private async Task<bool> CanUserEditPresentationAsync(int presentationId, int userId)
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
    }
}
