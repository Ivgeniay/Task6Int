using JointPresentationService.Domain.Models;

namespace JointPresentationService.Domain.Interfaces
{
    public interface ISlideRepository
    {
        Task<Slide> GetByIdAsync(int id);
        Task<Slide> GetByIdWithElementsAsync(int id);
        Task<Slide> CreateAsync(Slide slide);
        Task<Slide> UpdateAsync(Slide slide);
        Task DeleteAsync(int id);
        Task<List<Slide>> GetByPresentationIdAsync(int presentationId);
        Task<int> GetMaxOrderAsync(int presentationId);
        Task ReorderSlidesAsync(int presentationId, List<int> slideIds);
    }
}
