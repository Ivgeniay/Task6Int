namespace JointPresentationService.Infrastructure.SirnalR.Models
{

    public class UserJoinedPresentationEvent
    {
        public int UserId { get; set; }
        public string Nickname { get; set; } = string.Empty;
        public bool CanEdit { get; set; }
    }
}
