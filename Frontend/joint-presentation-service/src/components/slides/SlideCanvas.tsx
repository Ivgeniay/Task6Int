import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { Slide, SlideElement } from '../../types/api';
import { useSignalR } from '../../hooks/useSignalR';
import { useDragToCreate } from '../../hooks/useDragToCreate';
import SlideToolbar from './SlideToolbar';

interface SlideCanvasProps {
  slide?: Slide;
  canEdit: boolean;
  currentUserId?: number;
}

const SlideCanvas: React.FC<SlideCanvasProps> = ({ slide, canEdit, currentUserId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<string>('select');
  const [selectedColor, setSelectedColor] = useState<string>('#3B82F6');

  const {
    addSlideElement,
    updateSlideElement,
    deleteSlideElement,
    onElementAdded,
    onElementUpdated,
    onElementDeleted
  } = useSignalR();

  const handleObjectModified = useCallback(async (e: fabric.ModifiedEvent) => {
    if (!canEdit || !slide || !e.target) return;

    const object = e.target as any;
    const elementId = object.elementId;
    
    if (!elementId) return;

    try {
      const properties = JSON.stringify({
        type: object.type,
        left: object.left,
        top: object.top,
        width: object.width,
        height: object.height,
        scaleX: object.scaleX,
        scaleY: object.scaleY,
        angle: object.angle,
        fill: object.fill,
        stroke: object.stroke,
        strokeWidth: object.strokeWidth,
        text: object.text,
        fontSize: object.fontSize,
        fontFamily: object.fontFamily,
        radius: object.radius,
        x1: object.x1,
        y1: object.y1,
        x2: object.x2,
        y2: object.y2
      });

      await updateSlideElement(elementId, properties);
    } catch (error) {
      console.error('Failed to update element:', error);
    }
  }, [canEdit, slide, updateSlideElement]);

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
      let fabricObject: fabric.Object | null = null;

      switch (properties.type) {
        case 'text':
          fabricObject = new fabric.Textbox(properties.text || 'New Text', {
            left: properties.left || 100,
            top: properties.top || 100,
            fontSize: properties.fontSize || 20,
            fontFamily: properties.fontFamily || 'Arial',
            fill: properties.fill || '#000000',
            width: properties.width || 200
          });
          break;
        case 'rect':
          fabricObject = new fabric.Rect({
            left: properties.left || 100,
            top: properties.top || 100,
            width: properties.width || 100,
            height: properties.height || 100,
            fill: properties.fill || '#3B82F6',
            stroke: properties.stroke,
            strokeWidth: properties.strokeWidth || 0
          });
          break;
        case 'circle':
          fabricObject = new fabric.Circle({
            left: properties.left || 100,
            top: properties.top || 100,
            radius: properties.radius || 50,
            fill: properties.fill || '#10B981',
            stroke: properties.stroke,
            strokeWidth: properties.strokeWidth || 0
          });
          break;
        case 'triangle':
          fabricObject = new fabric.Triangle({
            left: properties.left || 100,
            top: properties.top || 100,
            width: properties.width || 100,
            height: properties.height || 87,
            fill: properties.fill || '#F59E0B',
            stroke: properties.stroke,
            strokeWidth: properties.strokeWidth || 0
          });
          break;
        case 'line':
          fabricObject = new fabric.Line([
            properties.x1 || 0,
            properties.y1 || 0,
            properties.x2 || 100,
            properties.y2 || 0
          ], {
            left: properties.left || 100,
            top: properties.top || 100,
            stroke: properties.stroke || '#EF4444',
            strokeWidth: properties.strokeWidth || 3
          });
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

  const updateElementOnCanvas = (element: SlideElement) => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    const fabricObject = objects.find((obj: any) => obj.elementId === element.id);
    
    if (fabricObject) {
      try {
        const properties = JSON.parse(element.properties);
        fabricObject.set(properties);
        fabricCanvasRef.current.renderAll();
      } catch (error) {
        console.error('Error updating element:', error);
      }
    }
  };

  const removeElementFromCanvas = (elementId: number) => {
    if (!fabricCanvasRef.current) return;

    const objects = fabricCanvasRef.current.getObjects();
    const fabricObject = objects.find((obj: any) => obj.elementId === elementId);
    
    if (fabricObject) {
      fabricCanvasRef.current.remove(fabricObject);
    }
  };

  const handleObjectCreate = useCallback(async (properties: any) => {
    if (!canEdit || !slide) return;

    try {
      await addSlideElement(slide.id, JSON.stringify(properties));
    } catch (error) {
      console.error('Failed to create element:', error);
    }
  }, [canEdit, slide, addSlideElement]);

  useDragToCreate({
    canvas: fabricCanvasRef.current,
    selectedTool,
    selectedColor,
    onObjectCreate: handleObjectCreate
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
    canvas.on('selection:cleared', () => setSelectedTool('select'));

    return () => {
      canvas.dispose();
    };
  }, [handleObjectModified, canEdit]);

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
    if (slide?.elements) {
      loadElementsToCanvas(slide.elements);
    } else {
      clearCanvas();
    }
  }, [slide, loadElementsToCanvas, clearCanvas]);

  useEffect(() => {
    onElementAdded((data) => {
      if (data.slideId === slide?.id) {
        addElementToCanvas(data.element);
      }
    });
  }, [onElementAdded, slide?.id, addElementToCanvas]);

  useEffect(() => {
    onElementUpdated((data) => {
      updateElementOnCanvas(data.element);
    });
  }, [onElementUpdated]);

  useEffect(() => {
    onElementDeleted((data) => {
      removeElementFromCanvas(data.elementId);
    });
  }, [onElementDeleted]);

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
  };

  const handleDeleteSelected = async () => {
    if (!canEdit || !fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && (activeObject as any).elementId) {
      try {
        await deleteSlideElement((activeObject as any).elementId);
      } catch (error) {
        console.error('Failed to delete element:', error);
      }
    }
  };

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
    <div className="h-full flex flex-col">
      {canEdit && (
        <SlideToolbar
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          onAddText={() => setSelectedTool('text')}
          onAddShape={(shapeType) => setSelectedTool(`shape-${shapeType}`)}
          onDeleteSelected={handleDeleteSelected}
        />
      )}
      
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            className="block"
          />
        </div>
      </div>
    </div>
  );
};

export default SlideCanvas;