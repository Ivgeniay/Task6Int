using JointPresentationService.Application.Interfaces;
using JointPresentationService.Infrastructure.Constants;
using JointPresentationService.Infrastructure.SirnalR.Models;
using Microsoft.AspNetCore.SignalR;

namespace JointPresentationService.Infrastructure.SirnalR.Hubs
{
    public class PresentationHub : Hub
    {
        private readonly IPresentationService _presentationService;
        private readonly ISlideService _slideService;
        private readonly IUserService _userService;

        public PresentationHub(
            IPresentationService presentationService,
            ISlideService slideService,
            IUserService userService)
        {
            _presentationService = presentationService;
            _slideService = slideService;
            _userService = userService;
        }

        public async Task ConnectUser(string nickname)
        {
            try
            {
                var user = await _userService.GetOrCreateUserAsync(nickname);

                await Groups.AddToGroupAsync(Context.ConnectionId, InfrastructureConstants.SignalRConstants.Groups.GlobalUsers);

                Context.Items[InfrastructureConstants.SignalRConstants.ContextKeys.UserId] = user.Id;
                Context.Items[InfrastructureConstants.SignalRConstants.ContextKeys.Nickname] = nickname;

                await Clients.Group(InfrastructureConstants.SignalRConstants.Groups.GlobalUsers).SendAsync(
                    InfrastructureConstants.SignalRConstants.Events.UserConnected, new UserConnectedEvent
                    {
                        UserId = user.Id,
                        Nickname = user.Nickname
                    });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task CreatePresentation(string title)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var nicknameObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var nickname = (string)nicknameObj;

                var presentation = await _presentationService.CreatePresentationAsync(title, userId);

                await Clients.Group(InfrastructureConstants.SignalRConstants.Groups.GlobalUsers).SendAsync(
                    InfrastructureConstants.SignalRConstants.Events.PresentationCreated, new PresentationCreatedEvent
                    {
                        Presentation = presentation,
                        CreatedBy = nickname
                    });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task DeletePresentation(int presentationId)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var nicknameObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var nickname = (string)nicknameObj;

                var presentation = await _presentationService.GetByIdAsync(presentationId);
                if (presentation == null)
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.PresentationNotFound
                    });
                    return;
                }

                if (presentation.CreatorId != userId)
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.InsufficientPermissions
                    });
                    return;
                }

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);

                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.PresentationDeleted, new PresentationDeletedEvent
                {
                    PresentationId = presentationId,
                    DeletedBy = nickname
                });

                await _presentationService.DeletePresentationAsync(presentationId);

                await Clients.Group(InfrastructureConstants.SignalRConstants.Groups.GlobalUsers).SendAsync(
                    InfrastructureConstants.SignalRConstants.Events.PresentationDeleted, new PresentationDeletedEvent
                    {
                        PresentationId = presentationId,
                        DeletedBy = nickname
                    });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task JoinPresentation(int presentationId)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var nicknameObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var nickname = (string)nicknameObj;

                var presentation = await _presentationService.JoinPresentationAsync(presentationId, userId);
                var canEdit = await _presentationService.CanUserEditAsync(presentationId, userId);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

                Context.Items[InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId] = presentationId;

                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.JoinedPresentation, new JoinedPresentationEvent
                {
                    Presentation = presentation,
                    User = await _userService.GetByIdAsync(userId),
                    CanEdit = canEdit
                });

                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.UserJoinedPresentation, new UserJoinedPresentationEvent
                {
                    UserId = userId,
                    Nickname = nickname,
                    CanEdit = canEdit
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task LeavePresentation()
        {
            if (Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj) &&
                Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) &&
                Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var nicknameObj))
            {
                var presentationId = (int)presentationIdObj;
                var userId = (int)userIdObj;
                var nickname = (string)nicknameObj;

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

                Context.Items.Remove(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId);

                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.UserLeftPresentation, new UserLeftPresentationEvent
                {
                    UserId = userId,
                    Nickname = nickname
                });
            }
        }

        public async Task AddSlideElement(int slideId, string properties)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var presentationId = (int)presentationIdObj;

                var element = await _slideService.AddElementAsync(slideId, userId, properties);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.ElementAdded, new ElementAddedEvent
                {
                    SlideId = slideId,
                    Element = element
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task UpdateSlideElement(int elementId, string properties)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var presentationId = (int)presentationIdObj;

                var element = await _slideService.UpdateElementAsync(elementId, userId, properties);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.ElementUpdated, new ElementUpdatedEvent
                {
                    ElementId = elementId,
                    Element = element
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task DeleteSlideElement(int elementId)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var presentationId = (int)presentationIdObj;

                await _slideService.DeleteElementAsync(elementId, userId);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.ElementDeleted, new ElementDeletedEvent
                {
                    ElementId = elementId
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task AddSlide()
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var presentationId = (int)presentationIdObj;

                var slide = await _presentationService.AddSlideAsync(presentationId, userId);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.SlideAdded, new SlideAddedEvent
                {
                    Slide = slide
                });
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            if (Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) &&
                Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var nicknameObj))
            {
                var userId = (int)userIdObj;
                var nickname = (string)nicknameObj;

                await Clients.Group(InfrastructureConstants.SignalRConstants.Groups.GlobalUsers).SendAsync(
                    InfrastructureConstants.SignalRConstants.Events.UserDisconnected, new UserDisconnectedEvent
                    {
                        UserId = userId,
                        Nickname = nickname
                    });
            }

            await LeavePresentation();
            await base.OnDisconnectedAsync(exception);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }
    }

}
