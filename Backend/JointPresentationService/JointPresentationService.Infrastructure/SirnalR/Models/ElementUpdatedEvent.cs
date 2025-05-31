using JointPresentationService.Domain.Models;

namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class ElementUpdatedEvent
    {
        public int ElementId { get; set; }
        public SlideElement Element { get; set; }
    }
}
