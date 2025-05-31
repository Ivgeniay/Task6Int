namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class EditorRemovedEvent
    {
        public int UserId { get; set; }
        public string Nickname { get; set; } = string.Empty;
        public int PresentationId { get; set; }
    }
}
