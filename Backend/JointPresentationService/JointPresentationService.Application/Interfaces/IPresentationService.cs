using JointPresentationService.Application.Models;
using JointPresentationService.Domain.Models;

namespace JointPresentationService.Application.Interfaces
{
    public interface IPresentationService
    {
        Task<Presentation> GetByIdAsync(int presentationId);
        Task<Presentation> CreatePresentationAsync(string title, int creatorId);
        Task DeletePresentationAsync(int presentationId);
        Task<Presentation> JoinPresentationAsync(int presentationId, int userId);
        Task<bool> CanUserEditAsync(int presentationId, int userId);
        Task<Slide> AddSlideAsync(int presentationId, int userId);
        Task GrantEditorRightsAsync(int presentationId, int userId, int grantedByUserId);
        Task RemoveEditorRightsAsync(int presentationId, int userId, int removedByUserId);
        Task<List<PresentationDto>> GetAllPresentationsAsync();
        Task<List<Presentation>> GetUserCreatedPresentationsAsync(int userId);
        Task<List<User>> GetPresentationEditorsAsync(int presentationId);
    }
}
