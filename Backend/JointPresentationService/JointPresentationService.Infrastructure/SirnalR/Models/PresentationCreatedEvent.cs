using JointPresentationService.Domain.Models;

namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class PresentationCreatedEvent
    {
        public Presentation Presentation { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
    }
}
