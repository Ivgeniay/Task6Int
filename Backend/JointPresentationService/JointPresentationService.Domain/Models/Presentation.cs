namespace JointPresentationService.Domain.Models
{
    public class Presentation
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CreatorId { get; set; }

        public User Creator { get; set; }
        public List<Slide> Slides { get; set; } = new List<Slide>();
        public List<UserEditorPresentation> EditorUsers { get; set; } = new List<UserEditorPresentation>();
    }
}
