namespace JointPresentationService.Application.Models
{
    public class SlideDto
    {
        public int Id { get; set; }
        public int Order { get; set; }
        public int PresentationId { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int ElementsCount { get; set; }
        public List<int> ElementIds { get; set; }
    }
}
