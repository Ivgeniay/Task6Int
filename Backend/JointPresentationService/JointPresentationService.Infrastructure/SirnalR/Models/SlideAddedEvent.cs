﻿using JointPresentationService.Domain.Models;

namespace JointPresentationService.Infrastructure.SirnalR.Models
{
    public class SlideAddedEvent
    {
        public Slide Slide { get; set; }
        public int InitiatorUserId { get; set; } = -1;
    }
}
