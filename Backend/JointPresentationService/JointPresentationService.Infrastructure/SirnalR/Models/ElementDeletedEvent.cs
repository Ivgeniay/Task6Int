namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class ElementDeletedEvent
    {
        public int ElementId { get; set; }
        public int InitiatorUserId { get; set; } = -1;
    }
}
