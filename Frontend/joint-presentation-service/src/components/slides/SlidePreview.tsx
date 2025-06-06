import React from 'react';
import { Slide } from '../../types/api';

interface SlidePreviewProps {
  slide: Slide;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  isCreator: boolean;
  onDelete?: () => void;
}

const SlidePreview: React.FC<SlidePreviewProps> = ({
  slide,
  index,
  isSelected,
  onSelect,
  isCreator,
  onDelete
}) => {
  const formatSlideNumber = (slideIndex: number) => {
    return (slideIndex + 1).toString().padStart(2, '0');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      onClick={onSelect}
      className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {isCreator && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center z-10"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">
          Slide {formatSlideNumber(index)}
        </span>
        {isSelected && (
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        )}
      </div>
      
      <div className="aspect-video bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-6 h-6 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-gray-500">
            {slide.elements?.length || 0} elements
          </p>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Updated {formatDate(slide.updatedAt)}
      </div>
    </div>
  );
};

export default SlidePreview;