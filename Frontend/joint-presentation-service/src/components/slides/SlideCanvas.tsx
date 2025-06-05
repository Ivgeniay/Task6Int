import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Slide, SlideElement } from '../../types/api';
import { useSignalR } from '../../hooks/useSignalR';
import { useDragToCreate } from '../../hooks/useDragToCreate';

interface SelectedState {
  selectedObjects: any[];
  hasText: boolean;
  hasShapes: boolean;
  isSingleText: boolean;
  isMultiple: boolean;
}

interface SlideCanvasProps {
  slide?: Slide;
  canEdit: boolean;
  currentUserId?: number;
  selectedTool: string;
  selectedColor: string;
  skipElementsLoading?: boolean;
  onObjectCreate: (properties: any) => void;
  onObjectModified: (elementId: number, properties: any) => void;
  onSelectionChanged: (selectedState: SelectedState) => void;
  onCanvasMethodsReady?: (methods: {
    updateElement: (element: SlideElement) => void;
    removeElement: (elementId: number) => void;
    addElement: (element: SlideElement) => void;
    saveCanvasState: () => any;
    restoreCanvasState: (state: any) => void;
  }) => void;
}

const SlideCanvas: React.FC<SlideCanvasProps> = ({ 
  slide, 
  canEdit, 
  currentUserId,
  selectedTool,
  selectedColor,
  skipElementsLoading = false,
  onObjectCreate,
  onObjectModified,
  onSelectionChanged,
  onCanvasMethodsReady
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const updateSelectionState = useCallback((selected: fabric.Object[]) => {
    const selectedObjects = selected as any[];
    const hasText = selectedObjects.some(obj => obj.type === 'textbox' || obj.type === 'text');
    const hasShapes = selectedObjects.some(obj => ['rect', 'circle', 'triangle', 'line'].includes(obj.type));
    const isSingleText = selectedObjects.length === 1 && hasText;
    const isMultiple = selectedObjects.length > 1;

    onSelectionChanged({
      selectedObjects,
      hasText,
      hasShapes,
      isSingleText,
      isMultiple
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

  const handleSelectionCreated = useCallback((e: any) => {
    updateSelectionState(e.selected || []);
  }, [updateSelectionState]);

  const handleSelectionUpdated = useCallback((e: any) => {
    updateSelectionState(e.selected || []);
  }, [updateSelectionState]);

  const handleSelectionCleared = useCallback(() => {
    updateSelectionState([]);
  }, [updateSelectionState]);

  const clearCanvas = useCallback(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.backgroundColor = '#ffffff';
      fabricCanvasRef.current.renderAll();
    }
  }, []);

  const addElementToCanvas = useCallback((element: SlideElement) => {
    if (!fabricCanvasRef.current) return;

    try {
      const properties = JSON.parse(element.properties);
      const { type, version, ...cleanProperties } = properties;
      let fabricObject: fabric.Object | null = null;

      switch (type) {
        case 'Textbox':
        case 'textbox':
        case 'Text':
        case 'text':
          fabricObject = new fabric.Textbox(properties.text || 'New Text', cleanProperties);
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
        const { type, ...updateProperties } = properties;
        fabricObject.set(updateProperties);
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

  useDragToCreate({
    canvas: fabricCanvasRef.current,
    selectedTool,
    selectedColor,
    onObjectCreate
  });

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: canEdit
    });

    fabricCanvasRef.current = canvas;

    canvas.on('object:modified', handleObjectModified);
    canvas.on('selection:created', handleSelectionCreated);
    canvas.on('selection:updated', handleSelectionUpdated);
    canvas.on('selection:cleared', handleSelectionCleared);

    return () => {
      canvas.dispose();
    };
  }, [handleObjectModified, handleSelectionCreated, handleSelectionUpdated, handleSelectionCleared, canEdit]);

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
    if (skipElementsLoading) return;
    
    if (slide?.elements && slide.elements.length > 0) {
      loadElementsToCanvas(slide.elements);
    } else if (slide && (!slide.elements || slide.elements.length === 0)) {
      clearCanvas();
    }
  }, [slide?.id, slide?.elements, loadElementsToCanvas, clearCanvas, skipElementsLoading]);

  useEffect(() => {
    if (onCanvasMethodsReady) {
      onCanvasMethodsReady({
        updateElement: updateElementOnCanvas,
        removeElement: removeElementFromCanvas,
        addElement: addElementToCanvas,
        saveCanvasState,
        restoreCanvasState
      });
    }
  }, [onCanvasMethodsReady, updateElementOnCanvas, removeElementFromCanvas, addElementToCanvas, saveCanvasState, restoreCanvasState]);

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