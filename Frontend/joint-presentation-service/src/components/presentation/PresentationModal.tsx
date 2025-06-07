import React, { useEffect, useCallback, useRef } from 'react';
import { Slide } from '../../types/api';
import { PresentationMode } from '../../types/signalr';
import SlideCanvas from '../slides/SlideCanvas';
import './styles/modal.css';

interface PresentationModalProps {
  isOpen: boolean;
  currentSlide?: Slide;
  currentSlideIndex: number;
  totalSlides: number;
  presentationMode: PresentationMode;
  isPresenter: boolean;
  onClose: () => void;
  onNextSlide: () => void;
  onPrevSlide: () => void;
  onGoToSlide: (slideIndex: number) => void;
}

const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  currentSlide,
  currentSlideIndex,
  totalSlides,
  presentationMode,
  isPresenter,
  onClose,
  onNextSlide,
  onPrevSlide,
  onGoToSlide
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const mouseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseMove = useCallback(() => {
    if (headerRef.current) {
      headerRef.current.classList.add('visible');
    }
    if (controlsRef.current) {
      controlsRef.current.classList.add('visible');
    }
    
    if (mouseTimerRef.current) {
      clearTimeout(mouseTimerRef.current);
    }
    
    mouseTimerRef.current = setTimeout(() => {
      if (headerRef.current) {
        headerRef.current.classList.remove('visible');
      }
      if (controlsRef.current) {
        controlsRef.current.classList.remove('visible');
      }
    }, 3000);
  }, []);

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
      if (mouseTimerRef.current) {
        clearTimeout(mouseTimerRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div 
      ref={containerRef}
      className="presentation-container"
      onMouseMove={handleMouseMove}
    >
      <div 
        ref={headerRef}
        className="presentation-header"
      >
        <div className="header-content">
          <div className="slide-info">
            <span className="slide-counter">
              Slide {currentSlideIndex + 1} of {totalSlides}
            </span>
            {!isPresenter && (
              <span className="viewing-badge">
                Viewing mode
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="close-button"
            title={isPresenter ? "Stop presentation (ESC)" : "Leave presentation (ESC)"}
          >
            <svg className="close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="slide-content">
        {currentSlide ? (
          <div className="slide-wrapper">
            <SlideCanvas
              slide={currentSlide}
              canEdit={false}
              selectedTool="select"
              selectedColor="#000000"
              skipElementsLoading={false}
              enableZoomAndPan={false}
              onObjectCreate={() => {}}
              onObjectModified={() => {}}
              onSelectionChanged={() => {}}
            />
          </div>
        ) : (
          <div className="no-slide">
            <h2 className="no-slide-title">No slide available</h2>
            <p className="no-slide-text">Slide {currentSlideIndex + 1} could not be loaded</p>
          </div>
        )}
      </div>

      {isPresenter && (
        <div 
          ref={controlsRef}
          className="presentation-controls"
        >
          <div className="controls-content">
            <button
              onClick={onPrevSlide}
              disabled={currentSlideIndex === 0}
              className="control-button"
              title="Previous slide (←)"
            >
              <svg className="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="slide-progress">
              {currentSlideIndex + 1} / {totalSlides}
            </span>
            
            <button
              onClick={onNextSlide}
              disabled={currentSlideIndex >= totalSlides - 1}
              className="control-button"
              title="Next slide (→ or Space)"
            >
              <svg className="control-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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