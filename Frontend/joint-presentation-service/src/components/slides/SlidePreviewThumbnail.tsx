import React from 'react';
import { Slide } from '../../types/api';
import SlideCanvas from './SlideCanvas';
import MockSlide from './MockSlide';

interface SlidePreviewThumbnailProps {
  slide?: Slide;
  width?: number;
  height?: number;
  className?: string;
  showPlaceholder?: boolean;
  placeholderText?: string;
}

const SlidePreviewThumbnail: React.FC<SlidePreviewThumbnailProps> = ({
  slide,
  width = 200,
  height = 150,
  className = "",
  showPlaceholder = true,
  placeholderText = "Loading..."
}) => {
  if (!slide && showPlaceholder) {
    return (
      <div className={className}>
        <MockSlide text={placeholderText} />
      </div>
    );
  }

  if (!slide) {
    return null;
  }

  return (
    <div className={`bg-white rounded overflow-hidden ${className}`} style={{ width, height }}>
      <SlideCanvas
        slide={slide}
        canEdit={false}
        selectedTool="select"
        selectedColor="#000000"
        skipElementsLoading={false}
        canvasSize={{ width, height }}
        enableZoomAndPan={false}
        onObjectCreate={() => {}}
        onObjectModified={() => {}}
        onSelectionChanged={() => {}}
      />
    </div>
  );
};

export default SlidePreviewThumbnail;