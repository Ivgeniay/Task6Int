namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class UpdateUserRightsEvent
    {
        public int UserId { get; set; }
        public string Nickname { get; set; } = string.Empty;
        public bool CanEdit { get; set; }
        public int PresentationId { get; set; }
    }
}
