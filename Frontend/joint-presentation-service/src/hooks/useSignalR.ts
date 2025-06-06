import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  SignalRConnectionState,
  SIGNALR_EVENTS,
  UserConnectedEvent,
  UserDisconnectedEvent,
  PresentationCreatedEvent,
  PresentationDeletedEvent,
  JoinedPresentationEvent,
  UserJoinedPresentationEvent,
  UserLeftPresentationEvent,
  SlideAddedEvent,
  ElementAddedEvent,
  ElementUpdatedEvent,
  ElementDeletedEvent,
  ConnectedUsersListUpdatedEvent,
  EditorGrantedEvent,
  EditorRemovedEvent,
  UserUpdateRightsEvent,
  ErrorEvent,
  SlideDeletedEvent
} from '../types/signalr';
import signalRService from '../services/signalr';

interface UseSignalROptions {
  autoConnect?: boolean;
}

interface ForceLogoutEvent {
  reason: string;
}

interface UseSignalRReturn {
  connectionState: SignalRConnectionState;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectUser: (nickname: string) => Promise<void>;
  createPresentation: (title: string) => Promise<void>;
  deletePresentation: (presentationId: number) => Promise<void>;
  joinPresentation: (presentationId: number) => Promise<void>;
  leavePresentation: () => Promise<void>;
  addSlide: () => Promise<void>;
  addSlideElement: (slideId: number, properties: string) => Promise<void>;
  updateSlideElement: (elementId: number, properties: string) => Promise<void>;
  deleteSlideElement: (elementId: number) => Promise<void>;
  grantEditorRights: (presentationId: number, userId: number) => Promise<void>;
  removeEditorRights: (presentationId: number, userId: number) => Promise<void>;
  onUserConnected: (handler: (data: UserConnectedEvent) => void) => void;
  onUserDisconnected: (handler: (data: UserDisconnectedEvent) => void) => void;
  onPresentationCreated: (handler: (data: PresentationCreatedEvent) => void) => void;
  onPresentationDeleted: (handler: (data: PresentationDeletedEvent) => void) => void;
  onJoinedPresentation: (handler: (data: JoinedPresentationEvent) => void) => void;
  onUserJoinedPresentation: (handler: (data: UserJoinedPresentationEvent) => void) => void;
  onUserLeftPresentation: (handler: (data: UserLeftPresentationEvent) => void) => void;
  onSlideAdded: (handler: (data: SlideAddedEvent) => void) => void;
  onSlideDeleted: (handler: (data: SlideDeletedEvent) => void) => void;
  onElementAdded: (handler: (data: ElementAddedEvent) => void) => void;
  onElementUpdated: (handler: (data: ElementUpdatedEvent) => void) => void;
  onElementDeleted: (handler: (data: ElementDeletedEvent) => void) => void;
  onEditorGranted: (handler: (data: EditorGrantedEvent) => void) => void;
  onEditorRemoved: (handler: (data: EditorRemovedEvent) => void) => void;
  onUserUpdateRights: (handler: (data: UserUpdateRightsEvent) => void) => void;
  onError: (handler: (data: ErrorEvent) => void) => void;
  onForceLogout: (handler: (data: ForceLogoutEvent) => void) => void;
  onConnectedUsersUpdated: (handler: (data: ConnectedUsersListUpdatedEvent) => void) => void;
}

export const useSignalR = (options: UseSignalROptions = {}): UseSignalRReturn => {
  const { autoConnect = false } = options;
  const [connectionState, setConnectionState] = useState<SignalRConnectionState>(
    signalRService.getConnectionState()
  );
  const handlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  useEffect(() => {
    const handleConnectionStateChange = (newState: SignalRConnectionState) => {
      setConnectionState(newState);
    };

    const currentHandlers = handlersRef.current;

    signalRService.on('connectionStateChanged', handleConnectionStateChange);

    if (autoConnect && !connectionState.isConnected && !connectionState.isConnecting) {
      signalRService.connect().catch(console.error);
    }

    return () => {
      signalRService.off('connectionStateChanged', handleConnectionStateChange);
      currentHandlers.forEach((handler, eventName) => {
        signalRService.off(eventName, handler);
      });
      currentHandlers.clear();
    };
  }, [autoConnect, connectionState.isConnected, connectionState.isConnecting]);

  const connect = useCallback(async () => {
    try {
      await signalRService.connect();
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await signalRService.disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw error;
    }
  }, []);

  const connectUser = useCallback(async (nickname: string) => {
    try {
      await signalRService.connectUser(nickname);
    } catch (error) {
      console.error('Failed to connect user:', error);
      throw error;
    }
  }, []);

  const createPresentation = useCallback(async (title: string) => {
    try {
      await signalRService.createPresentation(title);
    } catch (error) {
      console.error('Failed to create presentation:', error);
      throw error;
    }
  }, []);

  const deletePresentation = useCallback(async (presentationId: number) => {
    try {
      await signalRService.deletePresentation(presentationId);
    } catch (error) {
      console.error('Failed to delete presentation:', error);
      throw error;
    }
  }, []);

  const joinPresentation = useCallback(async (presentationId: number) => {
    try {
      await signalRService.joinPresentation(presentationId);
    } catch (error) {
      console.error('Failed to join presentation:', error);
      throw error;
    }
  }, []);

  const leavePresentation = useCallback(async () => {
    try {
      await signalRService.leavePresentation();
    } catch (error) {
      console.error('Failed to leave presentation:', error);
      throw error;
    }
  }, []);

  const addSlide = useCallback(async () => {
    try {
      await signalRService.addSlide();
    } catch (error) {
      console.error('Failed to add slide:', error);
      throw error;
    }
  }, []);

  const addSlideElement = useCallback(async (slideId: number, properties: string) => {
    try {
      await signalRService.addSlideElement(slideId, properties);
    } catch (error) {
      console.error('Failed to add slide element:', error);
      throw error;
    }
  }, []);

  const updateSlideElement = useCallback(async (elementId: number, properties: string) => {
    try {
      await signalRService.updateSlideElement(elementId, properties);
    } catch (error) {
      console.error('Failed to update slide element:', error);
      throw error;
    }
  }, []);

  const deleteSlideElement = useCallback(async (elementId: number) => {
    try {
      await signalRService.deleteSlideElement(elementId);
    } catch (error) {
      console.error('Failed to delete slide element:', error);
      throw error;
    }
  }, []);

  const grantEditorRights = useCallback(async (presentationId: number, userId: number) => {
    try {
      await signalRService.grantEditorRights(presentationId, userId);
    } catch (error) {
      console.error('Failed to grant editor rights:', error);
      throw error;
    }
  }, []);

  const removeEditorRights = useCallback(async (presentationId: number, userId: number) => {
    try {
      await signalRService.removeEditorRights(presentationId, userId);
    } catch (error) {
      console.error('Failed to remove editor rights:', error);
      throw error;
    }
  }, []);

  const createEventHandler = (eventName: string) => {
    return (handler: (data: any) => void) => {
      const existingHandler = handlersRef.current.get(eventName);
      if (existingHandler) {
        signalRService.off(eventName, existingHandler);
      }
      
      handlersRef.current.set(eventName, handler);
      signalRService.on(eventName, handler);
    };
  };

  const onUserConnected = createEventHandler(SIGNALR_EVENTS.USER_CONNECTED);
  const onUserDisconnected = createEventHandler(SIGNALR_EVENTS.USER_DISCONNECTED);
  const onPresentationCreated = createEventHandler(SIGNALR_EVENTS.PRESENTATION_CREATED);
  const onPresentationDeleted = createEventHandler(SIGNALR_EVENTS.PRESENTATION_DELETED);
  const onJoinedPresentation = createEventHandler(SIGNALR_EVENTS.JOINED_PRESENTATION);
  const onUserJoinedPresentation = createEventHandler(SIGNALR_EVENTS.USER_JOINED_PRESENTATION);
  const onUserLeftPresentation = createEventHandler(SIGNALR_EVENTS.USER_LEFT_PRESENTATION);
  const onSlideAdded = createEventHandler(SIGNALR_EVENTS.SLIDE_ADDED);
  const onSlideDeleted = createEventHandler(SIGNALR_EVENTS.SLIDE_DELETED);
  const onElementAdded = createEventHandler(SIGNALR_EVENTS.ELEMENT_ADDED);
  const onElementUpdated = createEventHandler(SIGNALR_EVENTS.ELEMENT_UPDATED);
  const onElementDeleted = createEventHandler(SIGNALR_EVENTS.ELEMENT_DELETED);
  const onEditorGranted = createEventHandler(SIGNALR_EVENTS.EDITOR_GRANTED);
  const onEditorRemoved = createEventHandler(SIGNALR_EVENTS.EDITOR_REMOVED);
  const onUserUpdateRights = createEventHandler(SIGNALR_EVENTS.USER_UPDATE_RIGHTS);
  const onError = createEventHandler(SIGNALR_EVENTS.ERROR);
  const onForceLogout = createEventHandler('forceLogout');
  const onConnectedUsersUpdated = createEventHandler(SIGNALR_EVENTS.CONNECTED_USERS_UPDATED);

  return {
    connectionState,
    connect,
    disconnect,
    connectUser,
    createPresentation,
    deletePresentation,
    joinPresentation,
    leavePresentation,
    addSlide,
    addSlideElement,
    updateSlideElement,
    deleteSlideElement,
    grantEditorRights,
    removeEditorRights,
    onUserConnected,
    onUserDisconnected,
    onPresentationCreated,
    onPresentationDeleted,
    onJoinedPresentation,
    onUserJoinedPresentation,
    onUserLeftPresentation,
    onSlideAdded,
    onSlideDeleted,
    onElementAdded,
    onElementUpdated,
    onElementDeleted,
    onEditorGranted,
    onEditorRemoved,
    onUserUpdateRights,
    onError,
    onForceLogout,
    onConnectedUsersUpdated
  };
};