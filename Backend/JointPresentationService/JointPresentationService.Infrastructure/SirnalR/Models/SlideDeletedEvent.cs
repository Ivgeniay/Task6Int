namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class SlideDeletedEvent
    {
        public int SlideId { get; set; }
        public int InitiatorUserId { get; set; } = -1;
    }
}
