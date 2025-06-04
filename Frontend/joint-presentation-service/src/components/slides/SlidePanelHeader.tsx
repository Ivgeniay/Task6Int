import React from 'react';

interface SlidePanelHeaderProps {
  slidesCount: number;
  canEdit: boolean;
  onAddSlide: () => void;
}

const SlidePanelHeader: React.FC<SlidePanelHeaderProps> = ({
  slidesCount,
  canEdit,
  onAddSlide
}) => {
  return (
    <div className="p-4 border-b bg-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Slides</h3>
        <span className="text-xs text-gray-500">{slidesCount} slides</span>
      </div>
      
      {canEdit && (
        <button
          onClick={onAddSlide}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Slide
        </button>
      )}
    </div>
  );
};

export default SlidePanelHeader;