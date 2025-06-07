using JointPresentationService.Domain.Models;

namespace JointPresentationService.Domain.Interfaces
{
    public interface IPresentationRepository
    {
        Task<Presentation> GetByIdAsync(int id);
        Task<Presentation> GetByIdWithSlidesAsync(int id);
        Task<Presentation> CreateAsync(Presentation presentation);
        Task<Presentation> UpdateAsync(Presentation presentation);
        Task<Presentation> GetBySlideIdAsync(int slideId);
        Task UpdateTimestampAsync(int presentationId);
        Task DeleteAsync(int id);
        Task<List<Presentation>> GetAllAsync();
        Task<List<Presentation>> GetByCreatorIdAsync(int creatorId);
        Task<List<Presentation>> GetByEditorIdAsync(int creatorId);
        Task<List<User>> GetEditorsAsync(int presentationId);
        Task AddEditorAsync(int presentationId, int userId);
        Task RemoveEditorAsync(int presentationId, int userId);
        Task<bool> IsUserEditorAsync(int presentationId, int userId);
    }
}
