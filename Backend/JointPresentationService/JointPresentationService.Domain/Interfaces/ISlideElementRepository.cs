using JointPresentationService.Domain.Models;

namespace JointPresentationService.Domain.Interfaces
{
    public interface ISlideElementRepository
    {
        Task<SlideElement> GetByIdAsync(int id);
        Task<SlideElement> CreateAsync(SlideElement element);
        Task<SlideElement> UpdateAsync(SlideElement element);
        Task DeleteAsync(int id);
        Task<List<SlideElement>> GetBySlideIdAsync(int slideId);
        Task<List<SlideElement>> GetByCreatedByIdAsync(int userId);
        Task DeleteBySlideIdAsync(int slideId);
    }
}
