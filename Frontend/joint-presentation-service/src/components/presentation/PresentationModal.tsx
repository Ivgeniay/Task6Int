import React, { useState, useEffect, useCallback } from 'react';
import { Slide } from '../../types/api';
import { PresentationMode } from '../../types/signalr';
import SlideCanvas from '../slides/SlideCanvas';

interface PresentationModalProps {
  isOpen: boolean;
  slides: Slide[];
  currentSlideIndex: number;
  presentationMode: PresentationMode;
  isPresenter: boolean;
  totalSlides: number;
  onClose: () => void;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onGoToSlide: (slideIndex: number) => void;
}

const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  slides,
  currentSlideIndex,
  presentationMode,
  isPresenter,
  totalSlides,
  onClose,
  onNextSlide,
  onPrevSlide,
  onGoToSlide
}) => {
  const [showControls, setShowControls] = useState(false);
  const [mouseTimer, setMouseTimer] = useState<NodeJS.Timeout | null>(null);

  const currentSlide = slides[currentSlideIndex];

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    if (mouseTimer) {
      clearTimeout(mouseTimer);
    }
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    
    setMouseTimer(timer);
  }, [mouseTimer]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isPresenter) return;
    
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        onNextSlide();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onPrevSlide();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        if (e.key >= '1' && e.key <= '9') {
          const slideIndex = parseInt(e.key) - 1;
          if (slideIndex < totalSlides) {
            onGoToSlide(slideIndex);
          }
        }
        break;
    }
  }, [isPresenter, onNextSlide, onPrevSlide, onClose, onGoToSlide, totalSlides]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    return () => {
      if (mouseTimer) {
        clearTimeout(mouseTimer);
      }
    };
  }, [mouseTimer]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col"
      onMouseMove={handleMouseMove}
    >
      <div 
        className={`absolute top-0 left-0 right-0 bg-black bg-opacity-50 transition-opacity duration-300 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4 text-white">
            <span className="text-sm">
              Slide {currentSlideIndex + 1} of {totalSlides}
            </span>
            {!isPresenter && (
              <span className="text-xs bg-gray-600 px-2 py-1 rounded">
                Viewing mode
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300 transition-colors p-2"
            title={isPresenter ? "Stop presentation (ESC)" : "Leave presentation (ESC)"}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {currentSlide ? (
          <div className="shadow-2xl rounded-lg overflow-hidden" style={{ 
            transform: 'scale(min(90vw/800px, 70vh/600px))',
            transformOrigin: 'center'
          }}>
            <SlideCanvas
              slide={currentSlide}
              canEdit={false}
              selectedTool="select"
              selectedColor="#000000"
              skipElementsLoading={false}
              enableZoomAndPan={true}
              onObjectCreate={() => {}}
              onObjectModified={() => {}}
              onSelectionChanged={() => {}}
            />
          </div>
        ) : (
          <div className="text-white text-center">
            <h2 className="text-2xl mb-4">No slide available</h2>
            <p>Slide {currentSlideIndex + 1} could not be loaded</p>
          </div>
        )}
      </div>

      {isPresenter && (
        <div 
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="flex items-center space-x-4 bg-black bg-opacity-50 rounded-lg px-6 py-3">
            <button
              onClick={onPrevSlide}
              disabled={currentSlideIndex === 0}
              className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors p-2"
              title="Previous slide (←)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="text-white text-sm">
              {currentSlideIndex + 1} / {totalSlides}
            </span>
            
            <button
              onClick={onNextSlide}
              disabled={currentSlideIndex >= totalSlides - 1}
              className="text-white hover:text-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors p-2"
              title="Next slide (→ or Space)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationModal;