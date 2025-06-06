import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Presentation, Slide, SlideElement } from '../types/api';
import { useSignalR } from '../hooks/useSignalR';
import SlidePanel from '../components/slides/SlidePanel';
import SlideCanvas from '../components/slides/SlideCanvas';
import SlideToolbar from '../components/slides/SlideToolbar';
import UserList from '../components/users/UserList';
import apiService from '../services/api';

interface PresentationEditorPageProps {
  currentUserId?: number;
}

interface SelectedState {
  selectedObjects: any[];
  hasText: boolean;
  hasShapes: boolean;
  isSingleText: boolean;
  isSingleShape: boolean;
  isMultiple: boolean;
  selectedObjectType: 'text' | 'shape' | 'mixed' | 'none';
}

const PresentationEditorPage: React.FC<PresentationEditorPageProps> = ({ currentUserId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentSlideWithElements, setCurrentSlideWithElements] = useState<Slide | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideLoading, setSlideLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);
  const [slideCache, setSlideCache] = useState<Map<number, Slide>>(new Map());
  
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');
  const [selectedState, setSelectedState] = useState<SelectedState>({
    selectedObjects: [],
    hasText: false,
    hasShapes: false,
    isSingleText: false,
    isSingleShape: false,
    isMultiple: false,
    selectedObjectType: 'none'
  });

  const [canvasMethodsRef, setCanvasMethodsRef] = useState<{
    updateElement: (element: SlideElement) => void;
    removeElement: (elementId: number) => void;
    addElement: (element: SlideElement) => void;
    saveCanvasState: () => any;
    restoreCanvasState: (state: any) => void;
    applyTextStyle: (property: string, value: any) => void;
    applyColorToSelected: () => void;
    handlerOwnElementCreate: (element: SlideElement) => void;
    clearSelection: () => void;
  } | null>(null);

  const {
    joinPresentation,
    leavePresentation,
    addSlideElement,
    updateSlideElement,
    deleteSlideElement,
    onJoinedPresentation,
    deleteSlide,
    onSlideAdded,
    onSlideDeleted,
    onUserUpdateRights,
    onEditorGranted,
    onEditorRemoved,
    onElementAdded,
    onElementUpdated,
    onElementDeleted,
    onError
  } = useSignalR();

  const loadPresentationData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const presentationId = parseInt(id!);
      await joinPresentation(presentationId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presentation');
      setLoading(false);
    }
  }, [id, joinPresentation]);

  const invalidateSlideCache = useCallback((slideId: number) => {
    setSlideCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(slideId);
      return newCache;
    });
  }, []);

  const loadSlideWithElements = useCallback(async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) {
      setCurrentSlideWithElements(null);
      return;
    }

    if (slideCache.has(slide.id)) {
      const cachedSlide = slideCache.get(slide.id)!;
      setCurrentSlideWithElements(cachedSlide);
      return;
    }

    try {
      setSlideLoading(true);
      const fullSlide = await apiService.getSlide(slide.id);
      
      setSlideCache(prev => new Map(prev).set(slide.id, fullSlide));
      setCurrentSlideWithElements(fullSlide);
    } catch (err) {
      console.error('Failed to load slide elements:', err);
      setCurrentSlideWithElements(slide);
    } finally {
      setSlideLoading(false);
    }
  }, [slides, slideCache]);

  useEffect(() => {
    onSlideDeleted((data) => {
      const deletedSlideIndex = slides.findIndex(slide => slide.id === data.slideId);

      setSlides(prev => prev.filter(slide => slide.id !== data.slideId));
      invalidateSlideCache(data.slideId);
      
      if (currentSlideIndex === deletedSlideIndex && deletedSlideIndex > 0) {
        setCurrentSlideIndex(deletedSlideIndex - 1);
      } else if (currentSlideIndex > deletedSlideIndex) {
        setCurrentSlideIndex(prev => prev - 1);
      }
    });
  }, [onSlideDeleted, invalidateSlideCache, currentSlideIndex, slides]);

  useEffect(() => {
    if (!id || !currentUserId) {
      navigate('/');
      return;
    }
    loadPresentationData();
  }, [id, currentUserId, navigate, loadPresentationData]);

  useEffect(() => {
    onJoinedPresentation((data) => {
      setPresentation(data.presentation);
      setSlides(data.presentation.slides || []);
      setCanEdit(data.canEdit);
      setLoading(false);
    });
  }, [onJoinedPresentation]);

  useEffect(() => {
    onSlideAdded((data) => {
      setSlides(prev => [...prev, data.slide].sort((a, b) => a.order - b.order));
      invalidateSlideCache(data.slide.id);
    });
  }, [onSlideAdded, invalidateSlideCache]);

  useEffect(() => {
    onUserUpdateRights((data) => {
      if (data.userId === currentUserId && data.presentationId === parseInt(id!)) {
        setCanEdit(data.canEdit);
      }
    });
  }, [onUserUpdateRights, currentUserId, id]);

  useEffect(() => {
    onEditorGranted((data) => {
      if (data.userId === currentUserId && data.presentationId === parseInt(id!)) {
        setCanEdit(true);
      }
    });
  }, [onEditorGranted, currentUserId, id]);

  useEffect(() => {
    onEditorRemoved((data) => {
      if (data.userId === currentUserId && data.presentationId === parseInt(id!)) {
        setCanEdit(false);
      }
    });
  }, [onEditorRemoved, currentUserId, id]);

  useEffect(() => {
    onElementAdded((data) => {
      if (data.slideId === currentSlideWithElements?.id && canvasMethodsRef) {
        if (data.initiatorUserId !== currentUserId) {
          canvasMethodsRef.addElement(data.element);
          invalidateSlideCache(data.slideId);
        } else {
          canvasMethodsRef.handlerOwnElementCreate(data.element);
        }
      }
    });
  }, [onElementAdded, currentSlideWithElements?.id, canvasMethodsRef, invalidateSlideCache, currentUserId]);

  useEffect(() => {
    onElementUpdated((data) => {
      if (currentSlideWithElements?.elements?.some(el => el.id === data.elementId) && canvasMethodsRef) {
        if (data.initiatorUserId !== currentUserId) {
          canvasMethodsRef.updateElement(data.element);
          invalidateSlideCache(currentSlideWithElements.id);
        }
      }
    });
  }, [onElementUpdated, currentSlideWithElements, canvasMethodsRef, invalidateSlideCache, currentUserId]);

  useEffect(() => {
    onElementDeleted((data) => {
      if (currentSlideWithElements?.elements?.some(el => el.id === data.elementId) && canvasMethodsRef) {
        if (data.initiatorUserId !== currentUserId) {
          canvasMethodsRef.removeElement(data.elementId);
          if (currentSlideWithElements) {
            invalidateSlideCache(currentSlideWithElements.id);
          }
        }
      }
    });
  }, [onElementDeleted, currentSlideWithElements, canvasMethodsRef, invalidateSlideCache, currentUserId]);

  useEffect(() => {
    onError((data) => {
      setError(data.message);
    });
  }, [onError]);

  useEffect(() => {
    return () => {
      leavePresentation().catch(() => {});
    };
  }, [leavePresentation]);

  useEffect(() => {
    if (slides.length > 0 && currentSlideIndex >= 0) {
      loadSlideWithElements(currentSlideIndex);
    } else {
      setCurrentSlideWithElements(null);
    }
  }, [currentSlideIndex, slides.length, loadSlideWithElements]);

  const handleSlideSelect = (slideIndex: number) => {
    setCurrentSlideIndex(slideIndex);
  };

  const handleBackToList = () => {
    navigate('/');
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
  };

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
  };

  const handleAddText = () => {
    setSelectedTool('text');
  };

  const handleAddShape = (shapeType: 'rect' | 'circle' | 'triangle' | 'line') => {
    setSelectedTool(`shape-${shapeType}`);
  };

  const handleObjectCreate = useCallback(async (properties: any) => {
    if (!canEdit || !currentSlideWithElements) return;

    try {
      await addSlideElement(currentSlideWithElements.id, JSON.stringify(properties));
    } catch (error) {
      console.error('Failed to create element:', error);
    }
  }, [canEdit, currentSlideWithElements, addSlideElement]);

  const handleObjectModified = useCallback(async (elementId: number, properties: any) => {
    if (!canEdit) return;

    try {
      await updateSlideElement(elementId, JSON.stringify(properties));
    } catch (error) {
      console.error('Failed to update element:', error);
    }
  }, [canEdit, updateSlideElement]);

  const handleDeleteSelected = async () => {
    if (!canEdit || selectedState.selectedObjects.length === 0) return;

    try {
      selectedState.selectedObjects.forEach(obj => {
        if (obj.elementId && canvasMethodsRef) {
          canvasMethodsRef.removeElement(obj.elementId);
        }
      });

      canvasMethodsRef?.clearSelection();

      for (const obj of selectedState.selectedObjects) {
        if (obj.elementId) {
          await deleteSlideElement(obj.elementId);
        }
      }
    } catch (error) {
    console.error('Failed to delete elements:', error);
  }
  };

  const handleClearSlide = async () => {
    if (!canEdit || !currentSlideWithElements?.elements) return;

    const confirmClear = window.confirm('Are you sure you want to clear all elements from this slide?');
    if (!confirmClear) return;

    try {
      for (const element of currentSlideWithElements.elements) {
        await deleteSlideElement(element.id);
      }
    } catch (error) {
      console.error('Failed to clear slide:', error);
    }
  };

  const handleTextBold = () => {
    if (canvasMethodsRef) {
      canvasMethodsRef.applyTextStyle('fontWeight', 'bold');
    }
  };

  const handleTextItalic = () => {
    if (canvasMethodsRef) {
      canvasMethodsRef.applyTextStyle('fontStyle', 'italic');
    }
  };

  const handleTextFontSize = (size: number) => {
    if (canvasMethodsRef) {
      canvasMethodsRef.applyTextStyle('fontSize', size);
    }
  };

  const handleTextUnderline = () => {
    if (canvasMethodsRef) {
      canvasMethodsRef.applyTextStyle('underline', true);
    }
  };

  const handleTextStrikethrough = () => {
    if (canvasMethodsRef) {
      canvasMethodsRef.applyTextStyle('linethrough', true);
    }
  };

  const handleApplyColorToSelected = () => {
    if (canvasMethodsRef) {
      canvasMethodsRef.applyColorToSelected();
    }
  };

  const handleDeleteSlide = useCallback(async (slideId: number) => {
    if (!presentation || presentation.creatorId !== currentUserId) return;

    try {
      await deleteSlide(slideId);
    } catch (error) {
      console.error('Failed to delete slide:', error);
    }
  }, [presentation, currentUserId, deleteSlide]);

  const handleCanvasMethodsReady = useCallback((methods: {
    updateElement: (element: SlideElement) => void;
    removeElement: (elementId: number) => void;
    addElement: (element: SlideElement) => void;
    saveCanvasState: () => any;
    restoreCanvasState: (state: any) => void;
    applyTextStyle: (property: string, value: any) => void;
    applyColorToSelected: () => void;
    handlerOwnElementCreate: (element: SlideElement) => void;
    clearSelection: () => void;
  }) => {
    setCanvasMethodsRef(methods);
  }, []);

  const getUserRole = (presentation: Presentation, currentUserId?: number) => {
    if (!currentUserId) return 'Viewer';
    if (presentation.creatorId === currentUserId) return 'Creator';
    if (presentation.editorUsers?.some(editor => editor.userId === currentUserId)) return 'Editor';
    return 'Viewer';
  };

  const getConnectionStatusColor = () => {
    return canEdit ? 'bg-green-500' : 'bg-gray-400';
  };

  const getConnectionStatusText = () => {
    return canEdit ? 'Can Edit' : 'View Only';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading presentation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Presentations
          </button>
        </div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Presentation not found</h2>
          <button
            onClick={handleBackToList}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Presentations
          </button>
        </div>
      </div>
    );
  }

  const isCreator = presentation.creatorId === currentUserId;
  const userRole = getUserRole(presentation, currentUserId);

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToList}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">{presentation.title}</h1>
          {slideLoading && (
            <div className="flex items-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Loading slide...
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
            <span className="text-sm text-gray-600">{getConnectionStatusText()}</span>
          </div>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            userRole === 'Creator'
              ? 'bg-blue-100 text-blue-800'
              : userRole === 'Editor'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {userRole}
          </span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Present
          </button>
        </div>
      </div>

      {canEdit && (
        <SlideToolbar
          selectedTool={selectedTool}
          selectedState={selectedState}
          selectedColor={selectedColor}
          onToolSelect={handleToolSelect}
          onColorChange={handleColorChange}
          onAddText={handleAddText}
          onAddShape={handleAddShape}
          onDeleteSelected={handleDeleteSelected}
          onClearSlide={handleClearSlide}
          onTextBold={handleTextBold}
          onTextItalic={handleTextItalic}
          onTextUnderline={handleTextUnderline}
          onTextStrikethrough={handleTextStrikethrough}
          onTextFontSize={handleTextFontSize}
          onApplyColorToSelected={handleApplyColorToSelected}
        />
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-50 border-r">
          <SlidePanel
            slides={slides}
            currentSlideIndex={currentSlideIndex}
            onSlideSelect={handleSlideSelect}
            canEdit={canEdit}
            isCreator={isCreator}
            onDeleteSlide={handleDeleteSlide}
          />
        </div>

        <div className="flex-1 bg-white">
          <SlideCanvas
            slide={currentSlideWithElements ?? undefined}
            canEdit={canEdit}
            currentUserId={currentUserId}
            selectedTool={selectedTool}
            selectedColor={selectedColor}
            onObjectCreate={handleObjectCreate}
            onObjectModified={handleObjectModified}
            onSelectionChanged={setSelectedState}
            onCanvasMethodsReady={handleCanvasMethodsReady}
          />
        </div>

        <div className="w-80 bg-gray-50 border-l">
          <UserList
            presentationId={presentation.id}
            currentUserId={currentUserId}
            canManageRoles={presentation.creatorId === currentUserId}
          />
        </div>
      </div>
    </div>
  );
};

export default PresentationEditorPage;