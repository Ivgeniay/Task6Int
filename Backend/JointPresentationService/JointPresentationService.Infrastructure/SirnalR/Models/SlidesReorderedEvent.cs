using JointPresentationService.Domain.Models;

namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class SlidesReorderedEvent
    {
        public int PresentationId { get; set; }
        public List<Slide> Slides { get; set; }
    }
}
