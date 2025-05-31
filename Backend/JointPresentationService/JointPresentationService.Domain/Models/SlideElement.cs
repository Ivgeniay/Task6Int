namespace JointPresentationService.Domain.Models
{
    public class SlideElement
    {
        public int Id { get; set; }
        public int SlideId { get; set; }
        public string Properties { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CreatedById { get; set; } 

        public Slide Slide { get; set; }
        public User CreatedBy { get; set; }
    }
}
