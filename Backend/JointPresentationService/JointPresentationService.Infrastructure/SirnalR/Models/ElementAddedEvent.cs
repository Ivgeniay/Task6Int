using JointPresentationService.Domain.Models;

namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class ElementAddedEvent
    {
        public int SlideId { get; set; }
        public SlideElement Element { get; set; }
    }
}
