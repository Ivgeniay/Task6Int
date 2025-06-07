import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { 
  SIGNALR_EVENTS,
  SignalRConnectionState,
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
  SlideDeletedEvent,
  PresentationStartedEvent,
  PresentationStoppedEvent,
  SlideChangedEvent
} from '../types/signalr';

class SignalRService {
  private connection: HubConnection | null = null;
  private connectionState: SignalRConnectionState = {
    isConnected: false,
    isConnecting: false,
  };
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectionTimeout: NodeJS.Timeout | null = null;
  private readonly RECONNECTION_TIMEOUT_MS = 10000;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    const hubUrl: string = process.env.REACT_APP_SIGNALR_HUB_URL || "";

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Information)
      .build();

    this.setupConnectionEvents();
    this.setupSignalREvents();
  }

  private setupConnectionEvents(): void {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      this.clearReconnectionTimeout();
      this.connectionState = {
        ...this.connectionState,
        isConnected: false,
        isConnecting: false,
        error: error?.message,
      };
      this.notifyStateChange();
    });

    this.connection.onreconnecting((error) => {
      this.startReconnectionTimeout();
      this.connectionState = {
        ...this.connectionState,
        isConnected: false,
        isConnecting: true,
        error: error?.message,
      };
      this.notifyStateChange();
    });

    this.connection.onreconnected(() => {
      this.clearReconnectionTimeout();
      this.connectionState = {
        ...this.connectionState,
        isConnected: true,
        isConnecting: false,
        error: undefined,
      };
      this.notifyStateChange();
    });
  }

  private startReconnectionTimeout(): void {
    this.clearReconnectionTimeout();
    this.reconnectionTimeout = setTimeout(() => {
      this.handleReconnectionTimeout();
    }, this.RECONNECTION_TIMEOUT_MS);
  }

  private clearReconnectionTimeout(): void {
    if (this.reconnectionTimeout) {
      clearTimeout(this.reconnectionTimeout);
      this.reconnectionTimeout = null;
    }
  }

  private handleReconnectionTimeout(): void {
    this.connectionState = {
      ...this.connectionState,
      isConnected: false,
      isConnecting: false,
      error: 'Connection timeout - server unavailable',
    };
    this.notifyStateChange();
    this.emit('forceLogout', { reason: 'Connection timeout' });
  }

  private setupSignalREvents(): void {
    if (!this.connection) return;

    this.connection.on(SIGNALR_EVENTS.USER_CONNECTED, (data: UserConnectedEvent) => {
      this.emit(SIGNALR_EVENTS.USER_CONNECTED, data);
    });

    this.connection.on(SIGNALR_EVENTS.CONNECTED_USERS_UPDATED, (data: ConnectedUsersListUpdatedEvent) => {
      this.emit(SIGNALR_EVENTS.CONNECTED_USERS_UPDATED, data);
    });

    this.connection.on(SIGNALR_EVENTS.USER_DISCONNECTED, (data: UserDisconnectedEvent) => {
      this.emit(SIGNALR_EVENTS.USER_DISCONNECTED, data);
    });

    this.connection.on(SIGNALR_EVENTS.PRESENTATION_CREATED, (data: PresentationCreatedEvent) => {
      this.emit(SIGNALR_EVENTS.PRESENTATION_CREATED, data);
    });

    this.connection.on(SIGNALR_EVENTS.PRESENTATION_DELETED, (data: PresentationDeletedEvent) => {
      this.emit(SIGNALR_EVENTS.PRESENTATION_DELETED, data);
    });

    this.connection.on(SIGNALR_EVENTS.JOINED_PRESENTATION, (data: JoinedPresentationEvent) => {
      this.connectionState.currentPresentationId = data.presentation.id;
      this.emit(SIGNALR_EVENTS.JOINED_PRESENTATION, data);
    });

    this.connection.on(SIGNALR_EVENTS.USER_JOINED_PRESENTATION, (data: UserJoinedPresentationEvent) => {
      this.emit(SIGNALR_EVENTS.USER_JOINED_PRESENTATION, data);
    });

    this.connection.on(SIGNALR_EVENTS.USER_LEFT_PRESENTATION, (data: UserLeftPresentationEvent) => {
      this.emit(SIGNALR_EVENTS.USER_LEFT_PRESENTATION, data);
    });

    this.connection.on(SIGNALR_EVENTS.SLIDE_ADDED, (data: SlideAddedEvent) => {
      this.emit(SIGNALR_EVENTS.SLIDE_ADDED, data);
    });

    this.connection.on(SIGNALR_EVENTS.SLIDE_DELETED, (data: SlideDeletedEvent) => {
      this.emit(SIGNALR_EVENTS.SLIDE_DELETED, data);
    });

    this.connection.on(SIGNALR_EVENTS.ELEMENT_ADDED, (data: ElementAddedEvent) => {
      this.emit(SIGNALR_EVENTS.ELEMENT_ADDED, data);
    });

    this.connection.on(SIGNALR_EVENTS.ELEMENT_UPDATED, (data: ElementUpdatedEvent) => {
      this.emit(SIGNALR_EVENTS.ELEMENT_UPDATED, data);
    });

    this.connection.on(SIGNALR_EVENTS.ELEMENT_DELETED, (data: ElementDeletedEvent) => {
      this.emit(SIGNALR_EVENTS.ELEMENT_DELETED, data);
    });

    this.connection.on(SIGNALR_EVENTS.EDITOR_GRANTED, (data: EditorGrantedEvent) => {
      this.emit(SIGNALR_EVENTS.EDITOR_GRANTED, data);
    });

    this.connection.on(SIGNALR_EVENTS.EDITOR_REMOVED, (data: EditorRemovedEvent) => {
      this.emit(SIGNALR_EVENTS.EDITOR_REMOVED, data);
    });

    this.connection.on(SIGNALR_EVENTS.USER_UPDATE_RIGHTS, (data: UserUpdateRightsEvent) => {
      this.emit(SIGNALR_EVENTS.USER_UPDATE_RIGHTS, data);
    });

    this.connection.on(SIGNALR_EVENTS.ERROR, (data: ErrorEvent) => {
      this.emit(SIGNALR_EVENTS.ERROR, data);
    });

    this.connection.on(SIGNALR_EVENTS.PRESENTATION_STARTED, (data: PresentationStartedEvent) => {
      this.emit(SIGNALR_EVENTS.PRESENTATION_STARTED, data);
    });

    this.connection.on(SIGNALR_EVENTS.PRESENTATION_STOPPED, (data: PresentationStoppedEvent) => {
      this.emit(SIGNALR_EVENTS.PRESENTATION_STOPPED, data);
    });

    this.connection.on(SIGNALR_EVENTS.SLIDE_CHANGED, (data: SlideChangedEvent) => {
      this.emit(SIGNALR_EVENTS.SLIDE_CHANGED, data);
    });
  }

  async connect(): Promise<void> {
    if (!this.connection || this.connectionState.isConnected || this.connectionState.isConnecting) {
      return;
    }

    try {
      this.connectionState = {
        ...this.connectionState,
        isConnecting: true,
        error: undefined,
      };
      this.notifyStateChange();

      await this.connection.start();
      
      this.connectionState = {
        ...this.connectionState,
        isConnected: true,
        isConnecting: false,
      };
      this.notifyStateChange();
    } catch (error) {
      this.connectionState = {
        ...this.connectionState,
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
      this.notifyStateChange();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.clearReconnectionTimeout();
    
    if (!this.connection || !this.connectionState.isConnected) {
      return;
    }

    try {
      await this.connection.stop();
      this.connectionState = {
        isConnected: false,
        isConnecting: false,
      };
      this.notifyStateChange();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  async connectUser(nickname: string): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    try {
      await this.connection.invoke('ConnectUser', nickname);
      this.connectionState.nickname = nickname;
    } catch (error) {
      throw new Error(`Failed to connect user: ${error}`);
    }
  }

  async createPresentation(title: string): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('CreatePresentation', title);
  }

  async deletePresentation(presentationId: number): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('DeletePresentation', presentationId);
  }

  async joinPresentation(presentationId: number): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('JoinPresentation', presentationId);
  }

  async leavePresentation(): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('LeavePresentation');
    this.connectionState.currentPresentationId = undefined;
  }

  async addSlide(): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }
    await this.connection.invoke('AddSlide');
  }

  async deleteSlide(slideId: number): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('DeleteSlide', slideId);
  }

  async addSlideElement(slideId: number, properties: string): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('AddSlideElement', slideId, properties);
  }

  async updateSlideElement(elementId: number, properties: string): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('UpdateSlideElement', elementId, properties);
  }

  async deleteSlideElement(elementId: number): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('DeleteSlideElement', elementId);
  }

  async grantEditorRights(presentationId: number, userId: number): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('GrantEditorRights', presentationId, userId);
  }

  async removeEditorRights(presentationId: number, userId: number): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('RemoveEditorRights', presentationId, userId);
  }

  async startPresentation(): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('StartPresentation');
  }

  async stopPresentation(): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('StopPresentation');
  }

  async nextSlide(): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('NextSlide');
  }

  async prevSlide(): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('PrevSlide');
  }

  async goToSlide(slideIndex: number): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected to SignalR hub');
    }

    await this.connection.invoke('GoToSlide', slideIndex);
  }

  on(eventName: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, []);
    }
    this.eventHandlers.get(eventName)!.push(handler);
  }

  off(eventName: string, handler?: (data: any) => void): void {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }

    if (!handler) {
      this.eventHandlers.delete(eventName);
      return;
    }

    const handlers = this.eventHandlers.get(eventName)!;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  private emit(eventName: string, data: any): void {
    const handlers = this.eventHandlers.get(eventName);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  private notifyStateChange(): void {
    this.emit('connectionStateChanged', this.connectionState);
  }

  getConnectionState(): SignalRConnectionState {
    return { ...this.connectionState };
  }
}

export const signalRService = new SignalRService();
export default signalRService;