namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class PresentationSession
    {
        public int PresentationId { get; set; }
        public int PresenterId { get; set; }
        public int CurrentSlideIndex { get; set; }
        public DateTime StartedAt { get; set; }
        public List<string> ViewerConnectionIds { get; set; } = new();
    }
}
