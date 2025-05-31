namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class UserDisconnectedEvent
    {
        public int UserId { get; set; }
        public string Nickname { get; set; } = string.Empty;
    }
}
