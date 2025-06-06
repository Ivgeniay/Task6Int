import React from 'react';
import { Slide } from '../../types/api';
import { useSignalR } from '../../hooks/useSignalR';
import SlidePanelHeader from './SlidePanelHeader';
import SlidePreview from './SlidePreview';
import EmptySlidesState from './EmptySlidesState';

interface SlidePanelProps {
  slides: Slide[];
  currentSlideIndex: number;
  onSlideSelect: (slideIndex: number) => void;
  canEdit: boolean;
  isCreator: boolean;
  onDeleteSlide?: (slideId: number) => void;
}

const SlidePanel: React.FC<SlidePanelProps> = ({
  slides,
  currentSlideIndex,
  onSlideSelect,
  canEdit,
  isCreator,
  onDeleteSlide
}) => {
  const { addSlide } = useSignalR();

  const handleAddSlide = async () => {
    if (!isCreator) return;
    
    try {
      await addSlide();
    } catch (error) {
      console.error('Failed to add slide:', error);
    }
  };

  const handleDeleteSlide = (slideId: number) => {
    if (!isCreator || !onDeleteSlide) return;
    onDeleteSlide(slideId);
  };

  return (
    <div className="h-full flex flex-col">
      <SlidePanelHeader
        slidesCount={slides.length}
        canEdit={canEdit}
        onAddSlide={handleAddSlide}
        isCreator={isCreator}
      />

      <div className="flex-1 overflow-y-auto p-2">
        {slides.length === 0 ? (
          <EmptySlidesState />
        ) : (
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <SlidePreview
                key={slide.id}
                slide={slide}
                index={index}
                isSelected={index === currentSlideIndex}
                onSelect={() => onSlideSelect(index)}
                isCreator={isCreator}
                onDelete={() => handleDeleteSlide(slide.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlidePanel;