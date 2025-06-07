namespace JointPresentationService.Infrastructure.Constants
{
    public static class InfrastructureConstants
    {
        public static class SignalRConstants
        {
            public static class Events
            {
                public const string UserConnected = nameof(UserConnected);
                public const string UserDisconnected = nameof(UserDisconnected);

                public const string PresentationCreated = nameof(PresentationCreated);
                public const string PresentationDeleted = nameof(PresentationDeleted);
                public const string PresentationUpdated = nameof(PresentationUpdated);
                public const string ConnectedUsersListUpdated = nameof(ConnectedUsersListUpdated);
                public const string JoinedPresentation = nameof(JoinedPresentation);
                public const string UserJoinedPresentation = nameof(UserJoinedPresentation);
                public const string UserLeftPresentation = nameof(UserLeftPresentation);
                public const string UserUpdateRights = nameof(UserUpdateRights);

                public const string PresentationStarted = nameof(PresentationStarted);
                public const string PresentationStopped = nameof(PresentationStopped);
                public const string SlideChanged = nameof(SlideChanged);

                public const string SlideAdded = nameof(SlideAdded);
                public const string SlideDeleted = nameof(SlideDeleted);
                public const string SlidesReordered = nameof(SlidesReordered);

                public const string ElementAdded = nameof(ElementAdded);
                public const string ElementUpdated = nameof(ElementUpdated);
                public const string ElementDeleted = nameof(ElementDeleted);

                public const string EditorGranted = nameof(EditorGranted);
                public const string EditorRemoved = nameof(EditorRemoved);

                public const string Error = nameof(Error);
            }

            public static class Groups
            {
                public const string GlobalUsers = "GlobalUsers";
                public const string PresentationPrefix = "Presentation_";

                public static string GetPresentationGroup(int presentationId) => $"{PresentationPrefix}{presentationId}";
            }

            public static class ContextKeys
            {
                public const string UserId = "UserId";
                public const string Nickname = "Nickname";
                public const string PresentationId = "PresentationId";
                public const string SlideId = "SlideId";
            }

            public static class ErrorMessages
            {
                public const string UserNotAuthenticated = "User not authenticated";
                public const string PresentationNotFound = "Presentation not found";
                public const string InsufficientPermissions = "Insufficient permissions";
            }
        }
    }
}
