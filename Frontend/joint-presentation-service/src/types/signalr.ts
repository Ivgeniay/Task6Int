import { User, Presentation, Slide, SlideElement } from './api';

export const SIGNALR_EVENTS = {
  USER_CONNECTED: 'UserConnected',
  USER_DISCONNECTED: 'UserDisconnected',
  PRESENTATION_CREATED: 'PresentationCreated',
  PRESENTATION_UPDATED: 'PresentationUpdated',
  PRESENTATION_DELETED: 'PresentationDeleted',
  JOINED_PRESENTATION: 'JoinedPresentation',
  USER_JOINED_PRESENTATION: 'UserJoinedPresentation',
  USER_LEFT_PRESENTATION: 'UserLeftPresentation',
  SLIDE_ADDED: 'SlideAdded',
  SLIDE_DELETED: 'SlideDeleted',
  SLIDES_REORDERED: 'SlidesReordered',
  ELEMENT_ADDED: 'ElementAdded',
  ELEMENT_UPDATED: 'ElementUpdated',
  ELEMENT_DELETED: 'ElementDeleted',
  EDITOR_GRANTED: 'EditorGranted',
  EDITOR_REMOVED: 'EditorRemoved',
  USER_UPDATE_RIGHTS: 'UserUpdateRights',
  ERROR: 'Error',
  CONNECTED_USERS_UPDATED: 'ConnectedUsersListUpdated'
} as const;

export interface ConnectedUsersListUpdatedEvent {
  joinedUsers: UserJoinedPresentationEvent[];
}

export interface UserConnectedEvent {
  userId: number;
  nickname: string;
}

export interface UserDisconnectedEvent {
  userId: number;
  nickname: string;
}

export interface PresentationCreatedEvent {
  presentation: Presentation;
  createdBy: string;
}

export interface PresentationUpdatedEvent {
  presentation: Presentation;
  updatedBy: string;
}

export interface PresentationDeletedEvent {
  presentationId: number;
  deletedBy: string;
}

export interface JoinedPresentationEvent {
  presentation: Presentation;
  user: User;
  canEdit: boolean;
}

export interface UserJoinedPresentationEvent {
  userId: number;
  nickname: string;
  canEdit: boolean;
}

export interface UserLeftPresentationEvent {
  userId: number;
  nickname: string;
}

export interface SlideAddedEvent {
  slide: Slide;
  initiatorUserId: number;
}

export interface SlideDeletedEvent {
  slideId: number;
  initiatorUserId: number;
}

export interface SlidesReorderedEvent {
  presentationId: number;
  slides: Slide[];
}

export interface ElementAddedEvent {
  slideId: number;
  element: SlideElement;
  initiatorUserId: number;
}

export interface ElementUpdatedEvent {
  elementId: number;
  element: SlideElement;
  initiatorUserId: number;
}

export interface ElementDeletedEvent {
  elementId: number;
  initiatorUserId: number;
}

export interface EditorGrantedEvent {
  userId: number;
  nickname: string;
  presentationId: number;
}

export interface EditorRemovedEvent {
  userId: number;
  nickname: string;
  presentationId: number;
}

export interface UserUpdateRightsEvent {
  userId: number;
  nickname: string;
  canEdit: boolean;
  presentationId: number;
}

export interface ErrorEvent {
  message: string;
}

export type SignalREvent = 
  | UserConnectedEvent
  | UserDisconnectedEvent
  | PresentationCreatedEvent
  | PresentationUpdatedEvent
  | PresentationDeletedEvent
  | JoinedPresentationEvent
  | UserJoinedPresentationEvent
  | UserLeftPresentationEvent
  | SlideAddedEvent
  | SlideDeletedEvent
  | SlidesReorderedEvent
  | ElementAddedEvent
  | ElementUpdatedEvent
  | ElementDeletedEvent
  | EditorGrantedEvent
  | EditorRemovedEvent
  | ErrorEvent
  | ConnectedUsersListUpdatedEvent 
  | UserUpdateRightsEvent;

export interface SignalRConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  userId?: number;
  nickname?: string;
  currentPresentationId?: number;
}

export interface PresentationHubMethods {
  connectUser: (nickname: string) => Promise<void>;
  createPresentation: (title: string) => Promise<void>;
  deletePresentation: (presentationId: number) => Promise<void>;
  joinPresentation: (presentationId: number) => Promise<void>;
  leavePresentation: () => Promise<void>;
  addSlide: () => Promise<void>;
  deleteSlide: (slideId: number) => Promise<void>;
  addSlideElement: (slideId: number, properties: string) => Promise<void>;
  updateSlideElement: (elementId: number, properties: string) => Promise<void>;
  deleteSlideElement: (elementId: number) => Promise<void>;
  grantEditorRights: (presentationId: number, userId: number) => Promise<void>;
  removeEditorRights: (presentationId: number, userId: number) => Promise<void>;
}