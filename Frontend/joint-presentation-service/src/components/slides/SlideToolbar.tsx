import React, { useState, useRef, useEffect } from 'react';

interface SelectedState {
  selectedObjects: any[];
  hasText: boolean;
  hasShapes: boolean;
  isSingleText: boolean;
  isMultiple: boolean;
}

interface SlideToolbarProps {
  selectedTool: string;
  selectedState: SelectedState;
  onToolSelect: (tool: string) => void;
  onAddText: () => void;
  onAddShape: (shapeType: 'rect' | 'circle' | 'triangle' | 'line') => void;
  onDeleteSelected: () => void;
  onClearSlide: () => void;
}

const SlideToolbar: React.FC<SlideToolbarProps> = ({
  selectedTool,
  selectedState,
  onToolSelect,
  onAddText,
  onAddShape,
  onDeleteSelected,
  onClearSlide
}) => {
  const [isShapesDropdownOpen, setIsShapesDropdownOpen] = useState(false);
  const [isColorsDropdownOpen, setIsColorsDropdownOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const shapesDropdownRef = useRef<HTMLDivElement>(null);
  const colorsDropdownRef = useRef<HTMLDivElement>(null);

  const shapes = [
    { id: 'rect', name: 'Rectangle', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
      </svg>
    )},
    { id: 'circle', name: 'Circle', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" strokeWidth={2} />
      </svg>
    )},
    { id: 'triangle', name: 'Triangle', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l9 20H3l9-20z" strokeWidth={2} />
      </svg>
    )},
    { id: 'line', name: 'Line', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M5 12h14" strokeWidth={2} />
      </svg>
    )}
  ];

  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
    '#EC4899', '#6B7280', '#000000', '#FFFFFF'
  ];

  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shapesDropdownRef.current && !shapesDropdownRef.current.contains(event.target as Node)) {
        setIsShapesDropdownOpen(false);
      }
      if (colorsDropdownRef.current && !colorsDropdownRef.current.contains(event.target as Node)) {
        setIsColorsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShapeSelect = (shapeType: 'rect' | 'circle' | 'triangle' | 'line') => {
    onAddShape(shapeType);
    onToolSelect(`shape-${shapeType}`);
    setIsShapesDropdownOpen(false);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setIsColorsDropdownOpen(false);
  };

  const isShapeToolSelected = selectedTool.startsWith('shape-');

  const renderBasicTools = () => (
    <>
      <div className="flex items-center space-x-1 pr-4 border-r border-gray-200">
        <button
          onClick={() => onToolSelect('select')}
          className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedTool === 'select'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Select"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>
      </div>

      <div className="flex items-center space-x-1 pr-4 border-r border-gray-200">
        <div className="relative" ref={shapesDropdownRef}>
          <button
            onClick={() => setIsShapesDropdownOpen(!isShapesDropdownOpen)}
            className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
              isShapeToolSelected
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Shapes"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth={2} />
            </svg>
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isShapesDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">Shapes</div>
                <div className="space-y-1">
                  {shapes.map((shape) => (
                    <button
                      key={shape.id}
                      onClick={() => handleShapeSelect(shape.id as 'rect' | 'circle' | 'triangle' | 'line')}
                      className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <span className="mr-3">{shape.icon}</span>
                      {shape.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onAddText}
          className={`flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
            selectedTool === 'text'
              ? 'bg-blue-100 text-blue-700 shadow-sm'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title="Text"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        </button>
      </div>

      <div className="flex items-center space-x-1 pr-4 border-r border-gray-200">
        <div className="relative" ref={colorsDropdownRef}>
          <button
            onClick={() => setIsColorsDropdownOpen(!isColorsDropdownOpen)}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all duration-200"
            title="Colors"
          >
            <div className="w-5 h-5 rounded border-2 border-gray-300" style={{ backgroundColor: selectedColor }}></div>
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isColorsDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-3">
                <div className="text-xs font-medium text-gray-500 mb-3">Colors</div>
                <div className="grid grid-cols-4 gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorSelect(color)}
                      className={`w-8 h-8 rounded border-2 transition-all duration-200 hover:scale-110 ${
                        selectedColor === color ? 'border-blue-500 shadow-md' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderTextTools = () => (
    <div className="flex items-center space-x-1 pr-4 border-r border-gray-200">
      <div className="text-xs font-medium text-gray-500 mr-2">Text:</div>
      
      <button
        className="flex items-center justify-center w-8 h-8 rounded text-sm font-bold transition-all duration-200 text-gray-600 hover:bg-gray-100"
        title="Bold"
      >
        B
      </button>
      
      <button
        className="flex items-center justify-center w-8 h-8 rounded text-sm font-medium italic transition-all duration-200 text-gray-600 hover:bg-gray-100"
        title="Italic"
      >
        I
      </button>
      
      <select 
        className="text-xs border border-gray-300 rounded px-2 py-1 ml-2"
        title="Font Size"
        defaultValue={20}
      >
        {fontSizes.map(size => (
          <option key={size} value={size}>{size}px</option>
        ))}
      </select>
    </div>
  );

  const renderActionTools = () => (
    <div className="flex items-center space-x-1">
      {selectedState.selectedObjects.length > 0 && (
        <button
          onClick={onDeleteSelected}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          title={`Delete ${selectedState.isMultiple ? 'Selected Objects' : 'Selected Object'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
      
      <button
        onClick={onClearSlide}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium text-orange-600 hover:bg-orange-50 transition-all duration-200"
        title="Clear Slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          {renderBasicTools()}
          {selectedState.isSingleText && renderTextTools()}
        </div>
        
        <div className="flex items-center space-x-4">
          {selectedState.selectedObjects.length > 0 && (
            <div className="text-xs text-gray-500">
              {selectedState.selectedObjects.length} selected
              {selectedState.hasText && selectedState.hasShapes && ' (mixed)'}
              {selectedState.hasText && !selectedState.hasShapes && ' (text)'}
              {!selectedState.hasText && selectedState.hasShapes && ' (shapes)'}
            </div>
          )}
          
          {renderActionTools()}
        </div>
      </div>
    </div>
  );
};

export default SlideToolbar;