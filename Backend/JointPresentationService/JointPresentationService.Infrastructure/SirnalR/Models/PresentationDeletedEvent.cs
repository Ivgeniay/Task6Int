namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    internal class PresentationDeletedEvent
    {
        public int PresentationId { get; set; }
        public string DeletedBy { get; set; }
    }
}