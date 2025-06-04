import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Presentation, Slide } from '../types/api';
import { useSignalR } from '../hooks/useSignalR';
import SlidePanel from '../components/slides/SlidePanel';
import SlideCanvas from '../components/slides/SlideCanvas';
import UserList from '../components/users/UserList';

interface PresentationEditorPageProps {
  currentUserId?: number;
}

const PresentationEditorPage: React.FC<PresentationEditorPageProps> = ({ currentUserId }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [canEdit, setCanEdit] = useState(false);

  const {
    joinPresentation,
    leavePresentation,
    onJoinedPresentation,
    onSlideAdded,
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
    });
  }, [onSlideAdded]);

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

  const handleSlideSelect = (slideIndex: number) => {
    setCurrentSlideIndex(slideIndex);
  };

  const handleBackToList = () => {
    navigate('/');
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

  const currentSlide = slides[currentSlideIndex];

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
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
            canEdit ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {canEdit ? 'Editor' : 'Viewer'}
          </span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Present
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-64 bg-gray-50 border-r">
          <SlidePanel
            slides={slides}
            currentSlideIndex={currentSlideIndex}
            onSlideSelect={handleSlideSelect}
            canEdit={canEdit}
          />
        </div>

        <div className="flex-1 bg-white">
          <SlideCanvas
            slide={currentSlide}
            canEdit={canEdit}
            currentUserId={currentUserId}
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