import { 
  User, 
  Presentation, 
  Slide, 
  SlideElement,
  PresentationResponseDto
} from '../types/api';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || '';
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async getPresentations(): Promise<Presentation[]> {
    const dtos = await this.fetchJson<PresentationResponseDto[]>('/api/presentations');
    
    return dtos.map(dto => ({
      id: dto.id,
      title: dto.title,
      creatorId: dto.creatorId,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      creator: dto.creator,
      slides: dto.slides,
      editorUsers: dto.editorUsers?.map(user => ({
        userId: user.id,
        presentationId: dto.id,
        addedAt: user.createdAt,
        user: user
      }))
    }));
  }

  async getPresentation(id: number): Promise<Presentation> {
    return this.fetchJson<Presentation>(`/api/presentations/${id}`);
  }

  async getPresentationSlides(presentationId: number): Promise<Slide[]> {
    return this.fetchJson<Slide[]>(`/api/presentations/${presentationId}/slides`);
  }

  async getPresentationEditors(presentationId: number): Promise<User[]> {
    return this.fetchJson<User[]>(`/api/presentations/${presentationId}/editors`);
  }

  async getSlide(id: number): Promise<Slide> {
    return this.fetchJson<Slide>(`/api/slides/${id}`);
  }

  async getSlideElements(slideId: number): Promise<SlideElement[]> {
    return this.fetchJson<SlideElement[]>(`/api/slides/${slideId}/elements`);
  }

  async getUsers(): Promise<User[]> {
    return this.fetchJson<User[]>('/api/users');
  }

  async getUser(id: number): Promise<User> {
    return this.fetchJson<User>(`/api/users/${id}`);
  }

  async getUserEditablePresentations(userId: number): Promise<Presentation[]> {
    return this.fetchJson<Presentation[]>(`/api/users/${userId}/editable`);
  }
}

export const apiService = new ApiService();
export default apiService;