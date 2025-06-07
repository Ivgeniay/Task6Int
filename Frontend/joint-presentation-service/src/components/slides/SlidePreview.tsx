import React from 'react';
import { Slide } from '../../types/api';
import MockSlide from './MockSlide';

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

  const canDelete = isCreator && index > 0;

  return (
    <div
      onClick={onSelect}
      className={`group relative p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">
          Slide {formatSlideNumber(index)}
        </span>
        <div className="flex items-center space-x-2 relative">
          {isSelected && (
            <div className={`w-2 h-2 bg-blue-500 rounded-full transition-transform duration-200 ${
              canDelete ? 'group-hover:-translate-x-6' : ''
            }`}></div>
          )}
          {canDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="w-4 h-4 bg-white border border-gray-300 rounded-full hover:border-red-400 hover:bg-red-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 absolute right-0"
            >
              <svg className="w-2.5 h-2.5 text-gray-400 hover:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <MockSlide text={`${slide.elements?.length || 0} elements`} />

      <div className="mt-2 text-xs text-gray-500">
        Updated {formatDate(slide.updatedAt)}
      </div>
    </div>
  );
};

export default SlidePreview;