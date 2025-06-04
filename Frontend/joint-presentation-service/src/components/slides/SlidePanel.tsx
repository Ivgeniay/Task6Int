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
}

const SlidePanel: React.FC<SlidePanelProps> = ({
  slides,
  currentSlideIndex,
  onSlideSelect,
  canEdit
}) => {
  const { addSlide } = useSignalR();

  const handleAddSlide = async () => {
    if (!canEdit) return;
    
    try {
      await addSlide();
    } catch (error) {
      console.error('Failed to add slide:', error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <SlidePanelHeader
        slidesCount={slides.length}
        canEdit={canEdit}
        onAddSlide={handleAddSlide}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlidePanel;