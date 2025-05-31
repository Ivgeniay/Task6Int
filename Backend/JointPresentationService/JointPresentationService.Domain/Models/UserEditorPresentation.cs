namespace JointPresentationService.Domain.Models
{
    public class UserEditorPresentation
    {
        public int UserId { get; set; }
        public int PresentationId { get; set; }
        public DateTime AddedAt { get; set; }

        public User User { get; set; }
        public Presentation Presentation { get; set; }
    }
}
