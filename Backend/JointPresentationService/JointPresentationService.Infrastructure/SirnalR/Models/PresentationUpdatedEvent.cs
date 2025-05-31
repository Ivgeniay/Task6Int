using JointPresentationService.Domain.Models;

namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class PresentationUpdatedEvent
    {
        public Presentation Presentation { get; set; }
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
