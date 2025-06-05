namespace JointPresentationService.Application.Models
{
    public class PresentationDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public int CreatorId { get; set; }
        public UserDto Creator { get; set; }
        public List<SlideDto> Slides { get; set; } = new List<SlideDto>();
        public List<UserDto> EditorUsers { get; set; } = new List<UserDto>();
    }
}
