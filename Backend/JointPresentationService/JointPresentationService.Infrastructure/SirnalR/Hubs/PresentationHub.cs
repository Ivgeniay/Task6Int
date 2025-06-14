﻿using JointPresentationService.Application.Interfaces;
using JointPresentationService.Domain.Models;
using JointPresentationService.Infrastructure.Constants;
using JointPresentationService.Infrastructure.SirnalR.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Drawing;

namespace JointPresentationService.Infrastructure.SirnalR.Hubs
{
    public class PresentationHub : Hub
    {
        private readonly IPresentationService _presentationService;
        private readonly ISlideService _slideService;
        private readonly IUserService _userService;

        private static readonly ConcurrentDictionary<int, List<UserJoinedPresentationEvent>> _connectedUsers = new();
        private static readonly ConcurrentDictionary<int, PresentationModeState> _activePresentations = new();
        private static readonly object _lockObject = new object();

        public PresentationHub(
            IPresentationService presentationService,
            ISlideService slideService,
            IUserService userService)
        {
            _presentationService = presentationService;
            _slideService = slideService;
            _userService = userService;
        }

        private void AddConnectedUser(int presentationId, UserJoinedPresentationEvent userEvent)
        {
            lock (_lockObject)
            {
                if (!_connectedUsers.ContainsKey(presentationId))
                {
                    _connectedUsers[presentationId] = new List<UserJoinedPresentationEvent>();
                }

                var userList = _connectedUsers[presentationId];
                var existingUser = userList.FirstOrDefault(u => u.UserId == userEvent.UserId);

                if (existingUser == null)
                {
                    userList.Add(userEvent);
                }
                else
                {
                    existingUser.CanEdit = userEvent.CanEdit;
                }
            }
        }

        private void RemoveConnectedUser(int presentationId, int userId)
        {
            lock (_lockObject)
            {
                if (_connectedUsers.ContainsKey(presentationId))
                {
                    var userList = _connectedUsers[presentationId];
                    userList.RemoveAll(u => u.UserId == userId);

                    if (userList.Count == 0)
                    {
                        _connectedUsers.TryRemove(presentationId, out _);
                    }
                }
            }
        }

        public async Task<List<UserJoinedPresentationEvent>> GetConnectedUsers(int presentationId)
        {
            lock (_lockObject)
            {
                if (_connectedUsers.ContainsKey(presentationId))
                {
                    return new List<UserJoinedPresentationEvent>(_connectedUsers[presentationId]);
                }
                return new List<UserJoinedPresentationEvent>();
            }
        }

        public async Task ConnectUser(string nickname)
        {
            try
            {
                var user = await _userService.GetOrCreateUserAsync(nickname);

                await Groups.AddToGroupAsync(Context.ConnectionId, InfrastructureConstants.SignalRConstants.Groups.GlobalUsers);

                Context.Items[InfrastructureConstants.SignalRConstants.ContextKeys.UserId] = user.Id;
                Context.Items[InfrastructureConstants.SignalRConstants.ContextKeys.Nickname] = nickname;

                //await Clients.Group(InfrastructureConstants.SignalRConstants.Groups.GlobalUsers).SendAsync(
                //    InfrastructureConstants.SignalRConstants.Events.UserConnected, new UserConnectedEvent
                //    {
                //        UserId = user.Id,
                //        Nickname = user.Nickname
                //    });
                await Clients.Caller.SendAsync(
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

        public async Task GrantEditorRights(int presentationId, int userId)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var grantedByUserIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var grantedByNicknameObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var grantedByUserId = (int)grantedByUserIdObj;
                var grantedByNickname = (string)grantedByNicknameObj;

                await _presentationService.GrantEditorRightsAsync(presentationId, userId, grantedByUserId);

                var user = await _userService.GetByIdAsync(userId);

                await UpdateConnectedUserRights(presentationId, userId, true);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.EditorGranted, new EditorGrantedEvent
                {
                    UserId = userId,
                    Nickname = user.Nickname,
                    PresentationId = presentationId
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

        public async Task RemoveEditorRights(int presentationId, int userId)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var removedByUserIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var removedByNicknameObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var removedByUserId = (int)removedByUserIdObj;
                var removedByNickname = (string)removedByNicknameObj;

                await _presentationService.RemoveEditorRightsAsync(presentationId, userId, removedByUserId);

                var user = await _userService.GetByIdAsync(userId);

                await UpdateConnectedUserRights(presentationId, userId, false);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.EditorRemoved, new EditorRemovedEvent
                {
                    UserId = userId,
                    Nickname = user.Nickname,
                    PresentationId = presentationId
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

        private async Task UpdateConnectedUserRights(int presentationId, int userId, bool canEdit)
        {
            lock (_lockObject)
            {
                if (_connectedUsers.ContainsKey(presentationId))
                {
                    var userList = _connectedUsers[presentationId];
                    var existingUser = userList.FirstOrDefault(u => u.UserId == userId);

                    if (existingUser != null)
                    {
                        existingUser.CanEdit = canEdit;
                    }
                }
            }

            var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
            await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.UserUpdateRights, new UpdateUserRightsEvent
            {
                UserId = userId,
                Nickname = await GetUserNickname(userId),
                CanEdit = canEdit,
                PresentationId = presentationId
            });
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

                var userJoinedEvent = new UserJoinedPresentationEvent
                {
                    UserId = userId,
                    Nickname = nickname,
                    CanEdit = canEdit
                };

                AddConnectedUser(presentationId, userJoinedEvent);

                var connectedUsers = await GetConnectedUsers(presentationId);

                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.JoinedPresentation, new JoinedPresentationEvent
                {
                    Presentation = presentation,
                    User = await _userService.GetByIdAsync(userId),
                    CanEdit = canEdit
                });

                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.ConnectedUsersListUpdated, new { joinedUsers = connectedUsers });

                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.UserJoinedPresentation, userJoinedEvent);

                if (_activePresentations.TryGetValue(presentationId, out var presentationState) && presentationState.Mode == PresentationMode.Present)
                {
                    var slides = await _slideService.GetByPresentationIdAsync(presentationId);
                    var presenter = await _userService.GetByIdAsync(presentationState.PresenterId);

                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.PresentationStarted, new PresentationStartedEvent
                    {
                        PresentationId = presentationId,
                        PresenterId = presentationState.PresenterId,
                        PresenterNickname = presenter.Nickname,
                        CurrentSlideIndex = presentationState.CurrentSlideIndex,
                        TotalSlides = slides.Count
                    });
                }
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

                RemoveConnectedUser(presentationId, userId);

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
                    Element = element,
                    InitiatorUserId = userId
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
                    Element = element,
                    InitiatorUserId = userId
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
                    ElementId = elementId,
                    InitiatorUserId = userId
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
                    Slide = slide,
                    InitiatorUserId = userId
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

        public async Task DeleteSlide(int slideId)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) 
                    //|| Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.SlideId, out var slibeIdObj
                   )
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                //var slideId = (int)slibeIdObj;

                var presentation = await _presentationService.GetBySlideIdAsync(slideId);

                if (presentation is null)
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.PresentationNotFound
                    });
                    return;
                }
                await _slideService.DeleteSlideAsync(slideId, userId);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentation.Id);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.SlideDeleted, new SlideDeletedEvent
                {
                    SlideId = slideId,
                    InitiatorUserId = userId
                });

                await _presentationService.UpdateTimestampAsync(presentation.Id);
            }
            catch(Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task StartPresentation(int slideIndex)
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var nicknameObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var presentationId = (int)presentationIdObj;
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

                var slides = await _slideService.GetByPresentationIdAsync(presentationId);

                _activePresentations.AddOrUpdate(presentationId,
                    new PresentationModeState
                    {
                        Mode = PresentationMode.Present,
                        CurrentSlideIndex = 0,
                        PresenterId = userId
                    },
                    (key, oldValue) => new PresentationModeState
                    {
                        Mode = PresentationMode.Present,
                        CurrentSlideIndex = slideIndex,
                        PresenterId = userId
                    });

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                var _event = new PresentationStartedEvent
                {
                    PresentationId = presentationId,
                    PresenterId = userId,
                    PresenterNickname = nickname,
                    CurrentSlideIndex = slideIndex,
                    TotalSlides = slides.Count
                };
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.PresentationStarted, _event);
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task StopPresentation()
        {
            try
            {
                if (!Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.UserId, out var userIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj) ||
                    !Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.Nickname, out var nicknameObj))
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.UserNotAuthenticated
                    });
                    return;
                }

                var userId = (int)userIdObj;
                var presentationId = (int)presentationIdObj;
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

                _activePresentations.TryRemove(presentationId, out _);

                var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.PresentationStopped, new PresentationStoppedEvent
                {
                    PresentationId = presentationId,
                    StoppedByUserId = userId,
                    StoppedByNickname = nickname
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

        public async Task NextSlide()
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

                if (!_activePresentations.TryGetValue(presentationId, out var presentationState) ||
                    presentationState.Mode != PresentationMode.Present ||
                    presentationState.PresenterId != userId)
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.InsufficientPermissions
                    });
                    return;
                }

                var slides = await _slideService.GetByPresentationIdAsync(presentationId);

                if (presentationState.CurrentSlideIndex < slides.Count - 1)
                {
                    presentationState.CurrentSlideIndex++;

                    var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                    await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.SlideChanged, new SlideChangedEvent
                    {
                        PresentationId = presentationId,
                        CurrentSlideIndex = presentationState.CurrentSlideIndex,
                        TotalSlides = slides.Count,
                        ChangedByUserId = userId
                    });
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task PrevSlide()
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

                if (!_activePresentations.TryGetValue(presentationId, out var presentationState) ||
                    presentationState.Mode != PresentationMode.Present ||
                    presentationState.PresenterId != userId)
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.InsufficientPermissions
                    });
                    return;
                }

                if (presentationState.CurrentSlideIndex > 0)
                {
                    presentationState.CurrentSlideIndex--;

                    var slides = await _slideService.GetByPresentationIdAsync(presentationId);
                    var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                    await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.SlideChanged, new SlideChangedEvent
                    {
                        PresentationId = presentationId,
                        CurrentSlideIndex = presentationState.CurrentSlideIndex,
                        TotalSlides = slides.Count,
                        ChangedByUserId = userId
                    });
                }
            }
            catch (Exception ex)
            {
                await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                {
                    Message = ex.Message
                });
            }
        }

        public async Task GoToSlide(int slideIndex)
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

                if (!_activePresentations.TryGetValue(presentationId, out var presentationState) ||
                    presentationState.Mode != PresentationMode.Present ||
                    presentationState.PresenterId != userId)
                {
                    await Clients.Caller.SendAsync(InfrastructureConstants.SignalRConstants.Events.Error, new ErrorEvent
                    {
                        Message = InfrastructureConstants.SignalRConstants.ErrorMessages.InsufficientPermissions
                    });
                    return;
                }

                var slides = await _slideService.GetByPresentationIdAsync(presentationId);

                if (slideIndex >= 0 && slideIndex < slides.Count)
                {
                    presentationState.CurrentSlideIndex = slideIndex;

                    var groupName = InfrastructureConstants.SignalRConstants.Groups.GetPresentationGroup(presentationId);
                    await Clients.Group(groupName).SendAsync(InfrastructureConstants.SignalRConstants.Events.SlideChanged, new SlideChangedEvent
                    {
                        PresentationId = presentationId,
                        CurrentSlideIndex = presentationState.CurrentSlideIndex,
                        TotalSlides = slides.Count,
                        ChangedByUserId = userId
                    });
                }
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

                if (Context.Items.TryGetValue(InfrastructureConstants.SignalRConstants.ContextKeys.PresentationId, out var presentationIdObj))
                {
                    var presentationId = (int)presentationIdObj;
                    RemoveConnectedUser(presentationId, userId);
                }
            }

            await LeavePresentation();
            await base.OnDisconnectedAsync(exception);
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }



        private async Task<string> GetUserNickname(int userId)
        {
            try
            {
                var user = await _userService.GetByIdAsync(userId);
                return user.Nickname;
            }
            catch
            {
                return $"User {userId}";
            }
        }
    }
}
