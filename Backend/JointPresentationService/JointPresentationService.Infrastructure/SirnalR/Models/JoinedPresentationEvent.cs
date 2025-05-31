using JointPresentationService.Domain.Models;

namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class JoinedPresentationEvent
    {
        public Presentation Presentation { get; set; }
        public User User { get; set; }
        public bool CanEdit { get; set; }
    }
}
