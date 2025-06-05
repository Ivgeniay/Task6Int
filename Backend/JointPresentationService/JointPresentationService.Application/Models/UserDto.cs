namespace JointPresentationService.Application.Models
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Nickname { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
