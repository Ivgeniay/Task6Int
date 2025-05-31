namespace JointPresentationService.Domain.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Nickname { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }

        public List<Presentation> CreatedPresentations { get; set; } = new List<Presentation>();
        public List<UserEditorPresentation> EditorPresentations { get; set; } = new List<UserEditorPresentation>();
    }
}
