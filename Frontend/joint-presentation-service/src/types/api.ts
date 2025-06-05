export interface User {
  id: number;
  nickname: string;
  createdAt: string;
}

export interface Presentation {
  id: number;
  title: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  creator?: User;
  slides?: Slide[];          
  editorUsers?: UserEditorPresentation[];  
}

export interface PresentationResponseDto {
  id: number;
  title: string;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  creator?: UserResponseDto;
  slides?: SlideResponseDto[];
  editorUsers?: UserResponseDto[];
}
export interface UserResponseDto {
  id: number;
  nickname: string;
  createdAt: string;
}

export interface SlideResponseDto {
  id: number;
  order: number;
  presentationId: number;
  createdAt: string;
  updatedAt: string;
  elementsCount: number;
  elementIds: number[];
}

export interface Slide {
  id: number;
  order: number;
  presentationId: number;
  createdAt: string;
  updatedAt: string;
  presentation?: Presentation;
  elements?: SlideElement[];
}

export interface SlideResponseDto {
  id: number;
  order: number;
  presentationId: number;
  createdAt: string;
  updatedAt: string;
  elementsCount: number;
  elementIds: number[];
}

export interface SlideElement {
  id: number;
  slideId: number;
  properties: string;
  createdAt: string;
  updatedAt: string;
  createdById: number;
  slide?: Slide;
  createdBy?: User;
}

export interface UserEditorPresentation {
  userId: number;
  presentationId: number;
  addedAt: string;
  user?: User;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePresentationRequest {
  title: string;
}

export interface CreateSlideElementRequest {
  slideId: number;
  properties: string;
}

export interface UpdateSlideElementRequest {
  elementId: number;
  properties: string;
}




export interface FabricObjectProperties {
  type: 'text' | 'rect' | 'circle' | 'image';
  left: number;
  top: number;
  width: number;
  height: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface TextProperties extends FabricObjectProperties {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
}

export interface ShapeProperties extends FabricObjectProperties {
  type: 'rect' | 'circle';
}

export interface ImageProperties extends FabricObjectProperties {
  type: 'image';
  src: string;
  alt?: string;
}

export type ElementProperties = TextProperties | ShapeProperties | ImageProperties;