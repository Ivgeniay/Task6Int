namespace JointPresentationService.Domain.Models
{
    public class Slide
    {
        public int Id { get; set; }
        public int Order { get; set; }
        public int PresentationId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Presentation Presentation { get; set; }
        public List<SlideElement> Elements { get; set; } = new List<SlideElement>();
    }
}
