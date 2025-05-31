using JointPresentationService.Domain.Models;

namespace JointPresentationService.Application.Interfaces
{
    public interface ISlideService
    {
        Task<List<Slide>> GetByPresentationIdAsync(int presentationId);
        Task<Slide> GetSlideWithElementsAsync(int slideId);
        Task<SlideElement> AddElementAsync(int slideId, int userId, string properties);
        Task<SlideElement> UpdateElementAsync(int elementId, int userId, string properties);
        Task DeleteElementAsync(int elementId, int userId);
        Task DeleteSlideAsync(int slideId, int userId);
        Task<List<Slide>> ReorderSlidesAsync(int presentationId, int userId, List<int> slideIds);
        Task<List<SlideElement>> GetSlideElementsAsync(int slideId);
    }
}
