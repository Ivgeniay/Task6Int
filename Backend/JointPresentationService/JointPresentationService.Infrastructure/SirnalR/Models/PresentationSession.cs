namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class PresentationModeState
    {
        public PresentationMode Mode { get; set; }
        public int CurrentSlideIndex { get; set; }
        public int PresenterId { get; set; }
    }

    public enum PresentationMode
    {
        Edit,
        Present
    }


    public class PresentationStartedEvent
    {
        public int PresentationId { get; set; }
        public int PresenterId { get; set; }
        public string PresenterNickname { get; set; } = string.Empty;
        public int CurrentSlideIndex { get; set; }
        public int TotalSlides { get; set; }
    }

    public class PresentationStoppedEvent
    {
        public int PresentationId { get; set; }
        public int StoppedByUserId { get; set; }
        public string StoppedByNickname { get; set; } = string.Empty;
    }

    public class SlideChangedEvent
    {
        public int PresentationId { get; set; }
        public int CurrentSlideIndex { get; set; }
        public int TotalSlides { get; set; }
        public int ChangedByUserId { get; set; }
    }
}
