export const VALIDATION_RULES = {
  NICKNAME_MAX_LENGTH: 50,
  NICKNAME_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 250,
} as const;

export const API_ENDPOINTS = {
  PRESENTATIONS: '/api/presentations',
  USERS: '/api/users',
  SLIDES: '/api/slides',
} as const;

export const SIGNALR_EVENTS = {
  USER_CONNECTED: 'UserConnected',
  USER_DISCONNECTED: 'UserDisconnected',
  PRESENTATION_CREATED: 'PresentationCreated',
  USER_JOINED_PRESENTATION: 'UserJoinedPresentation',
  ELEMENT_ADDED: 'ElementAdded',
  ELEMENT_UPDATED: 'ElementUpdated',
  ERROR: 'Error',
} as const;