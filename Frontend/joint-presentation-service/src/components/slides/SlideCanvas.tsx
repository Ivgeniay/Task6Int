import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as fabric from 'fabric';
import { Slide, SlideElement } from '../../types/api';
import { useDragToCreate } from '../../hooks/useDragToCreate';

interface ISize {
  width: number;
  height: number;
}

interface SelectedState {
  selectedObjects: any[];
  hasText: boolean;
  hasShapes: boolean;
  isSingleText: boolean;
  isSingleShape: boolean;
  isMultiple: boolean;
  selectedObjectType: 'text' | 'shape' | 'mixed' | 'none';
}

interface TextSelectionState {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isLinethrough: boolean;
  fontSize: number;
  fontFamily: string;
  hasSelection: boolean;
  isPartialFormat: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    linethrough: boolean;
  };
}

interface PendingCreatedObject {
  fabricObject: fabric.Object;
  properties: string;
  tempId: number;
}

interface SlideCanvasProps {
  slide?: Slide;
  canEdit: boolean;
  currentUserId?: number;
  selectedTool: string;
  selectedColor: string;
  skipElementsLoading?: boolean;
  canvasSize?: ISize | null;
  enableZoomAndPan?: boolean;
  onObjectCreate: (properties: any) => void;
  onObjectModified: (elementId: number, properties: any) => void;
  onSelectionChanged: (selectedState: SelectedState) => void;
  onTextSelectionChanged?: (textState: TextSelectionState) => void;
  onCanvasMethodsReady?: (methods: {
    updateElement: (element: SlideElement) => void;
    removeElement: (elementId: number) => void;
    addElement: (element: SlideElement) => void;
    saveCanvasState: () => any;
    restoreCanvasState: (state: any) => void;
    applyTextStyle: (property: string, value: any) => void;
    applyColorToSelected: () => void;
    handlerOwnElementCreate: (element: SlideElement) => void;
    clearSelection: () => void;
  }) => void;
}

const SlideCanvas: React.FC<SlideCanvasProps> = ({ 
  slide, 
  canEdit, 
  currentUserId,
  selectedTool,
  selectedColor,
  skipElementsLoading = false,
  canvasSize = null,
  enableZoomAndPan = true,
  onObjectCreate,
  onObjectModified,
  onSelectionChanged,
  onTextSelectionChanged,
  onCanvasMethodsReady
}) => {

  const pendingCreatedObjectsRef = useRef<PendingCreatedObject[]>([]);
  const pendingDeletedObjectsRef = useRef<number[]>([]);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempIdCounterRef = useRef(1);

  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const isCtrlPressedRef = useRef(false);
  const isPanningRef = useRef(false);

  const actualSize = useMemo(() => {
      return canvasSize || { width: 800, height: 600 };
    }, [canvasSize]);

  const updateSelectionState = useCallback((selected: fabric.Object[]) => {
    const selectedObjects = selected as any[];
    const hasText = selectedObjects.some(obj => obj.type === 'textbox' || obj.type === 'Textbox');
    const hasShapes = selectedObjects.some(obj => ['rect', 'circle', 'triangle', 'line', 'Rect', 'Circle', 'Triangle', 'Line'].includes(obj.type));
    const isSingleText = selectedObjects.length === 1 && hasText;
    const isSingleShape = selectedObjects.length === 1 && hasShapes;
    const isMultiple = selectedObjects.length > 1;

    let selectedObjectType: 'text' | 'shape' | 'mixed' | 'none' = 'none';
    if (selectedObjects.length === 0) {
      selectedObjectType = 'none';
    } else if (hasText && hasShapes) {
      selectedObjectType = 'mixed';
    } else if (hasText) {
      selectedObjectType = 'text';
    } else if (hasShapes) {
      selectedObjectType = 'shape';
    }

    onSelectionChanged({
      selectedObjects,
      hasText,
      hasShapes,
      isSingleText,
      isSingleShape,
      isMultiple,
      selectedObjectType
    });
  }, [onSelectionChanged]);

  const handleObjectModified = useCallback(async (e: fabric.ModifiedEvent) => {
    if (!canEdit || !slide || !e.target) return;

    const object = e.target as any;
    const elementId = object.elementId;
    
    if (!elementId) return;

    try {
      const properties = object.toJSON(['elementId']);
      onObjectModified(elementId, properties);
    } catch (error) {
      console.error('Failed to update element:', error);
    }
  }, [canEdit, slide, onObjectModified]);

  const analyzeTextSelection = useCallback((textObject: fabric.Textbox): TextSelectionState => {
    const selectionStart = textObject.selectionStart || 0;
    const selectionEnd = textObject.selectionEnd || 0;
    const hasSelection = selectionStart !== selectionEnd;
    
    if (!hasSelection) {
      return {
        isBold: textObject.fontWeight === 'bold',
        isItalic: textObject.fontStyle === 'italic', 
        isUnderline: textObject.underline || false,
        isLinethrough: textObject.linethrough || false,
        fontSize: textObject.fontSize || 20,
        fontFamily: textObject.fontFamily || 'Arial',
        hasSelection: false,
        isPartialFormat: {
          bold: false,
          italic: false,
          underline: false,
          linethrough: false
        }
      };
    }

    const selectionStyles = textObject.getSelectionStyles(selectionStart, selectionEnd);
    
    const boldStyles = selectionStyles.filter(style => style && style.fontWeight === 'bold');
    const italicStyles = selectionStyles.filter(style => style && style.fontStyle === 'italic');
    const underlineStyles = selectionStyles.filter(style => style && style.underline === true);
    const linethroughStyles = selectionStyles.filter(style => style && style.linethrough === true);
    
    const allBold = boldStyles.length === selectionStyles.length;
    const someBold = boldStyles.length > 0;
    const allItalic = italicStyles.length === selectionStyles.length;
    const someItalic = italicStyles.length > 0;
    const allUnderline = underlineStyles.length === selectionStyles.length;
    const someUnderline = underlineStyles.length > 0;
    const allLinethrough = linethroughStyles.length === selectionStyles.length;
    const someLinethrough = linethroughStyles.length > 0;

    const firstStyle = selectionStyles[0] || {};
    
    return {
      isBold: allBold,
      isItalic: allItalic,
      isUnderline: allUnderline,
      isLinethrough: allLinethrough,
      fontSize: firstStyle.fontSize || textObject.fontSize || 20,
      fontFamily: firstStyle.fontFamily || textObject.fontFamily || 'Arial',
      hasSelection: true,
      isPartialFormat: {
        bold: someBold && !allBold,
        italic: someItalic && !allItalic,
        underline: someUnderline && !allUnderline,
        linethrough: someLinethrough && !allLinethrough
      }
    };
  }, []);

  const updateToolbarFromSelection = useCallback(() => {
    if (!fabricCanvasRef.current || !onTextSelectionChanged) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'Textbox')) {
      const textObject = activeObject as fabric.Textbox;
      const textState = analyzeTextSelection(textObject);
      onTextSelectionChanged(textState);
    }
  }, [onTextSelectionChanged, analyzeTextSelection]);

  const handleTextSelectionChanged = useCallback(() => {
    updateToolbarFromSelection();
  }, [updateToolbarFromSelection]);

  const handleTextEditing = useCallback(() => {
    updateToolbarFromSelection();
  }, [updateToolbarFromSelection]);

  const handleSelectionCreated = useCallback((e: any) => {
    updateSelectionState(e.selected || []);
  }, [updateSelectionState]);

  const handleSelectionUpdated = useCallback((e: any) => {
    updateSelectionState(e.selected || []);
    updateToolbarFromSelection();
  }, [updateSelectionState, updateToolbarFromSelection]);

  const handleSelectionCleared = useCallback(() => {
    updateSelectionState([]);
  }, [updateSelectionState]);

  const handleObjectCreatedLocally = useCallback((fabricObject: fabric.Object, properties: any) => {
    const tempId = tempIdCounterRef.current++;
    const propertiesString = JSON.stringify(properties);
    
    (fabricObject as any).tempId = tempId;
    
    pendingCreatedObjectsRef.current = [...pendingCreatedObjectsRef.current, {
      fabricObject,
      properties: propertiesString,
      tempId
    }];
  }, []);

  const handlerOwnElementCreate = useCallback((element: SlideElement) => {
    const pendingObject = pendingCreatedObjectsRef.current.find(
      pending => pending.properties === element.properties
    );

    if (!pendingObject) return;

    if (pendingDeletedObjectsRef.current.includes(pendingObject.tempId)) {
      pendingDeletedObjectsRef.current = pendingDeletedObjectsRef.current.filter(id => id !== pendingObject.tempId);
      pendingCreatedObjectsRef.current = pendingCreatedObjectsRef.current.filter(p => p.tempId !== pendingObject.tempId);
      
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.remove(pendingObject.fabricObject);
      }
      return;
    }

    (pendingObject.fabricObject as any).elementId = element.id;
    delete (pendingObject.fabricObject as any).tempId;

    pendingCreatedObjectsRef.current = pendingCreatedObjectsRef.current.filter(p => p.tempId !== pendingObject.tempId);
  }, []);

  const clearCanvas = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const clearSelection = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const addElementToCanvas = useCallback((element: SlideElement) => {
    if (!fabricCanvasRef.current) return;

    try {
      const properties = JSON.parse(element.properties);
      const { type, version, styles, ...cleanProperties } = properties;
      let fabricObject: fabric.Object | null = null;

      switch (type) {
        case 'Textbox':
        case 'textbox':
        case 'Text':
        case 'text':
          fabricObject = new fabric.Textbox(properties.text || 'New Text', cleanProperties);
          
          if (styles && Array.isArray(styles)) {
            const stylesObject: any = {};
            styles.forEach((styleRange: any) => {
              for (let i = styleRange.start; i < styleRange.end; i++) {
                if (!stylesObject[0]) stylesObject[0] = {};
                stylesObject[0][i] = { ...styleRange.style };
              }
            });
            
            (fabricObject as fabric.Textbox).styles = stylesObject;
            (fabricObject as fabric.Textbox).initDimensions();
          }
          break;
        case 'Rect':
        case 'rect':
          fabricObject = new fabric.Rect(cleanProperties);
          break;
        case 'Circle':
        case 'circle':
          fabricObject = new fabric.Circle(cleanProperties);
          break;
        case 'Triangle':
        case 'triangle':
          fabricObject = new fabric.Triangle(cleanProperties);
          break;
        case 'Line':
        case 'line':
          fabricObject = new fabric.Line([
            properties.x1 || 0,
            properties.y1 || 0,
            properties.x2 || 100,
            properties.y2 || 0
          ], cleanProperties);
          if (fabricObject && properties.left !== undefined && properties.top !== undefined) {
            fabricObject.set({
              left: properties.left,
              top: properties.top
            });
          }
          break;
      }

      if (fabricObject) {
        fabricObject.set('elementId', element.id);
        fabricObject.selectable = canEdit;
        fabricObject.evented = canEdit;
        fabricCanvasRef.current.add(fabricObject);
      }
    } catch (error) {
      console.error('Error parsing element properties:', error);
    }
  }, [canEdit]);

  const loadElementsToCanvas = useCallback((elements: SlideElement[]) => {
    if (!fabricCanvasRef.current) return;

    clearCanvas();
    
    elements.forEach(element => {
      addElementToCanvas(element);
    });
  }, [clearCanvas, addElementToCanvas]);

  const updateElementOnCanvas = useCallback((element: SlideElement) => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    const fabricObject = objects.find((obj: any) => obj.elementId === element.id);
    
    if (fabricObject) {
      try {
        const properties = JSON.parse(element.properties);
        
        if ((fabricObject.type === 'textbox' || fabricObject.type === 'Textbox') && properties.styles) {
          const textObject = fabricObject as fabric.Textbox;
          const { type, styles, ...updateProperties } = properties;
          
          textObject.set(updateProperties);
          
          if (styles && Array.isArray(styles)) {
            const stylesObject: any = {};
            styles.forEach((styleRange: any) => {
              for (let i = styleRange.start; i < styleRange.end; i++) {
                if (!stylesObject[0]) stylesObject[0] = {};
                stylesObject[0][i] = { ...styleRange.style };
              }
            });
            
            textObject.styles = stylesObject;
          }
          
          textObject.initDimensions();
          textObject.setCoords();
        } else {
          const { type, ...updateProperties } = properties;
          fabricObject.set(updateProperties);
        }
        
        fabricCanvasRef.current.renderAll();
      } catch (error) {
        console.error('Error updating element:', error);
      }
    }
  }, []);

  const removeElementFromCanvas = useCallback((elementId: number) => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    const fabricObject = objects.find((obj: any) => obj.elementId === elementId);
    
    if (fabricObject) {
      fabricCanvasRef.current.remove(fabricObject);
    }
  }, []);

  const saveCanvasState = useCallback(() => {
    if (!fabricCanvasRef.current) return null;
    return fabricCanvasRef.current.toJSON();
  }, []);

  const restoreCanvasState = useCallback((state: any) => {
    if (!fabricCanvasRef.current || !state) return;
    
    fabricCanvasRef.current.loadFromJSON(state, () => {
      if (fabricCanvasRef.current) {
        const objects = fabricCanvasRef.current.getObjects();
        objects.forEach((obj: any) => {
          obj.selectable = canEdit;
          obj.evented = canEdit;
        });
        fabricCanvasRef.current.renderAll();
      }
    });
  }, [canEdit]);

  const applyTextStyle = useCallback((property: string, value: any) => {
    if (!fabricCanvasRef.current || !canEdit) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject || (activeObject.type !== 'textbox' && activeObject.type !== 'Textbox')) return;

    const textObject = activeObject as fabric.Textbox;
    const selectionStart = textObject.selectionStart || 0;
    const selectionEnd = textObject.selectionEnd || 0;
    const hasSelection = selectionStart !== selectionEnd;

    if (hasSelection) {
      let newValue = value;
      
      if (property === 'fontWeight') {
        const currentStyles = textObject.getSelectionStyles(selectionStart, selectionEnd);
        const allBold = currentStyles.every(style => style && style.fontWeight === 'bold');
        newValue = allBold ? 'normal' : 'bold';
      } else if (property === 'fontStyle') {
        const currentStyles = textObject.getSelectionStyles(selectionStart, selectionEnd);
        const allItalic = currentStyles.every(style => style && style.fontStyle === 'italic');
        newValue = allItalic ? 'normal' : 'italic';
      } else if (property === 'underline') {
        const currentStyles = textObject.getSelectionStyles(selectionStart, selectionEnd);
        const allUnderline = currentStyles.every(style => style && style.underline === true);
        newValue = !allUnderline;
      } else if (property === 'linethrough') {
        const currentStyles = textObject.getSelectionStyles(selectionStart, selectionEnd);
        const allLinethrough = currentStyles.every(style => style && style.linethrough === true);
        newValue = !allLinethrough;
      }

      const selectionStyles: any = {};
      selectionStyles[property] = newValue;
      textObject.setSelectionStyles(selectionStyles, selectionStart, selectionEnd);
    } else {
      let newValue = value;

      if (property === 'fontWeight') {
        const currentWeight = textObject.get('fontWeight') || 'normal';
        newValue = currentWeight === 'bold' ? 'normal' : 'bold';
      } else if (property === 'fontStyle') {
        const currentStyle = textObject.get('fontStyle') || 'normal';
        newValue = currentStyle === 'italic' ? 'normal' : 'italic';
      } else if (property === 'underline') {
        const currentUnderline = textObject.get('underline') || false;
        newValue = !currentUnderline;
      } else if (property === 'linethrough') {
        const currentLinethrough = textObject.get('linethrough') || false;
        newValue = !currentLinethrough;
      }

      textObject.set(property, newValue);
    }

    fabricCanvasRef.current.renderAll();

    if (onTextSelectionChanged) {
      const textState = analyzeTextSelection(textObject);
      onTextSelectionChanged(textState);
    }

    const elementId = (activeObject as any).elementId;
    if (elementId) {
      const properties = activeObject.toJSON();
      onObjectModified(elementId, properties);
    }
  }, [canEdit, onObjectModified, onTextSelectionChanged, analyzeTextSelection]);

  const applyColorToSelected = useCallback(() => {
    if (!fabricCanvasRef.current || !canEdit) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject) return;

    activeObject.set('fill', selectedColor);
    fabricCanvasRef.current.renderAll();

    const elementId = (activeObject as any).elementId;
    if (elementId) {
      const properties = activeObject.toJSON();
      onObjectModified(elementId, properties);
    }
  }, [canEdit, selectedColor, onObjectModified]);

  const updateCursor = useCallback(() => {
    if (!fabricCanvasRef.current) return;

    const isShapeTool = ['shape-rect', 'shape-circle', 'shape-triangle', 'shape-line'].includes(selectedTool);
    const isTextTool = selectedTool === 'text';

    if (isShapeTool) {
      fabricCanvasRef.current.defaultCursor = 'crosshair';
      fabricCanvasRef.current.hoverCursor = 'crosshair';
    } else if (isTextTool) {
      fabricCanvasRef.current.defaultCursor = 'text';
      fabricCanvasRef.current.hoverCursor = 'text';
    } else {
      fabricCanvasRef.current.defaultCursor = 'default';
      fabricCanvasRef.current.hoverCursor = 'move';
    }
  }, [selectedTool]);

  const handleMouseWheel = useCallback((opt: fabric.TEvent) => {
    if (!fabricCanvasRef.current || !enableZoomAndPan) return;

    const event = opt.e as WheelEvent;
    const delta = event.deltaY;
    let zoomLevel = fabricCanvasRef.current.getZoom();
    
    zoomLevel *= 0.999 ** delta;
    
    if (zoomLevel > 5) zoomLevel = 5;
    if (zoomLevel < 0.1) zoomLevel = 0.1;

    const canvas = fabricCanvasRef.current;
    const pointer = canvas.getPointer(event);
    
    canvas.zoomToPoint(new fabric.Point(pointer.x, pointer.y), zoomLevel);
    
    event.preventDefault();
    event.stopPropagation();
  }, [enableZoomAndPan]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enableZoomAndPan) return;
    
    if (event.ctrlKey && !isCtrlPressedRef.current) {
      isCtrlPressedRef.current = true;
      
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.defaultCursor = 'grab';
        fabricCanvasRef.current.hoverCursor = 'grab';
      }
    }
  }, [enableZoomAndPan]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enableZoomAndPan) return;
    
    if (!event.ctrlKey && isCtrlPressedRef.current) {
      isCtrlPressedRef.current = false;
      isPanningRef.current = false;
      
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.defaultCursor = 'default';
        fabricCanvasRef.current.hoverCursor = 'move';
      }
    }
  }, [enableZoomAndPan]);

  useEffect(() => {
    if (!enableZoomAndPan) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enableZoomAndPan, handleKeyDown, handleKeyUp]);

  const handleMouseDown = useCallback((opt: fabric.TEvent) => {
    if (!enableZoomAndPan || !isCtrlPressedRef.current) return;

    const event = opt.e as MouseEvent;
    
    if (event.button === 0) {
      event.preventDefault();
      opt.e.preventDefault();
      
      isPanningRef.current = true;
      lastPanPointRef.current = { x: event.clientX, y: event.clientY };
      
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.defaultCursor = 'grabbing';
      }
    }
  }, [enableZoomAndPan]);

  const handleMouseMove = useCallback((opt: fabric.TEvent) => {
    if (!enableZoomAndPan || !isPanningRef.current || !fabricCanvasRef.current) return;

    const event = opt.e as MouseEvent;
    const canvas = fabricCanvasRef.current;
    
    const deltaX = event.clientX - lastPanPointRef.current.x;
    const deltaY = event.clientY - lastPanPointRef.current.y;

    canvas.relativePan(new fabric.Point(deltaX, deltaY));
    
    lastPanPointRef.current = { x: event.clientX, y: event.clientY };
    event.preventDefault();
  }, [enableZoomAndPan]);

  const handleMouseUp = useCallback((opt: fabric.TEvent) => {
    if (!enableZoomAndPan || !isPanningRef.current) return;

    isPanningRef.current = false;
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.defaultCursor = 'grab';
    }
  }, [enableZoomAndPan]);

  useDragToCreate({
    canvas: fabricCanvasRef.current,
    selectedTool,
    selectedColor,
    onObjectCreate,
    onObjectCreatedLocally: handleObjectCreatedLocally
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: actualSize.width,
      height: actualSize.height,
      backgroundColor: '#ffffff',
      selection: canEdit
    });

    fabricCanvasRef.current = canvas;

    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);

    canvas.on('text:selection:changed', handleTextSelectionChanged);
    canvas.on('text:editing:entered', handleTextEditing);
    canvas.on('text:editing:exited', handleTextEditing);

    if (enableZoomAndPan) {
      canvas.on('mouse:wheel', handleMouseWheel);
      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);
    }

    return () => {
      canvas.dispose();
    };
  }, [handleObjectModified, handleSelectionCreated, handleSelectionUpdated, handleSelectionCleared, canEdit, handleTextSelectionChanged, handleTextEditing, enableZoomAndPan, handleMouseWheel, handleMouseDown, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (fabricCanvasRef.current && canvasSize) {
      const defaultWidth = 800;
      const defaultHeight = 600;
      const scaleX = canvasSize.width / defaultWidth;
      const scaleY = canvasSize.height / defaultHeight;
      const scale = Math.min(scaleX, scaleY);
      
      fabricCanvasRef.current.setZoom(scale);
      fabricCanvasRef.current.setViewportTransform([scale, 0, 0, scale, 0, 0]);
    }
  }, [canvasSize, fabricCanvasRef.current]);
  
  useEffect(() => {
    updateCursor();
  }, [updateCursor]);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.selection = canEdit;
      const objects = fabricCanvasRef.current.getObjects();
      objects.forEach((obj: any) => {
        obj.selectable = canEdit;
        obj.evented = canEdit;
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [canEdit]);

  useEffect(() => {
    if (skipElementsLoading || !slide) return;
    
    if (slide.elements && slide.elements.length > 0) {
      loadElementsToCanvas(slide.elements);
    } else {
      clearCanvas();
    }
  }, [slide, loadElementsToCanvas, clearCanvas, skipElementsLoading]);

  useEffect(() => {
    if (onCanvasMethodsReady) {
      onCanvasMethodsReady({
        updateElement: updateElementOnCanvas,
        removeElement: removeElementFromCanvas,
        addElement: addElementToCanvas,
        saveCanvasState,
        restoreCanvasState,
        applyTextStyle,
        applyColorToSelected,
        handlerOwnElementCreate,
        clearSelection
      });
    }
  }, [onCanvasMethodsReady, updateElementOnCanvas, removeElementFromCanvas, addElementToCanvas, saveCanvasState, restoreCanvasState, applyTextStyle, applyColorToSelected, handlerOwnElementCreate, clearSelection]);

  if (!slide) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600">Select a slide to start editing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          className="block"
        />
      </div>
    </div>
  );
};

export default SlideCanvas;