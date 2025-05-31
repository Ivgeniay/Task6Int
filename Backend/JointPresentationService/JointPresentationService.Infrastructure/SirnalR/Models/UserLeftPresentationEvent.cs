namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class UserLeftPresentationEvent
    {
        public int UserId { get; set; }
        public string Nickname { get; set; } = string.Empty;
    }
}
