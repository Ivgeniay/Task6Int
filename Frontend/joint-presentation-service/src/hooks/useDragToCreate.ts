import { useState, useEffect, useCallback, useRef } from 'react';
import * as fabric from 'fabric';

interface DragToCreateOptions {
  canvas: fabric.Canvas | null;
  selectedTool: string;
  selectedColor?: string;
  onObjectCreate: (properties: any) => void;
}

interface DragState {
  isCreating: boolean;
  startPoint: { x: number; y: number } | null;
  previewObject: fabric.Object | null;
}

export const useDragToCreate = ({
  canvas,
  selectedTool,
  selectedColor = '#3B82F6',
  onObjectCreate
}: DragToCreateOptions): void => {
  const [dragState, setDragState] = useState<DragState>({
    isCreating: false,
    startPoint: null,
    previewObject: null
  });

  const dragStateRef = useRef(dragState);
  dragStateRef.current = dragState;

  const isShapeTool = useCallback(() => {
    return ['shape-rect', 'shape-circle', 'shape-triangle', 'shape-line'].includes(selectedTool);
  }, [selectedTool]);

  const isTextTool = useCallback(() => {
    return selectedTool === 'text';
  }, [selectedTool]);

  const updateCursor = useCallback(() => {
    if (!canvas) return;

    if (isShapeTool()) {
      canvas.defaultCursor = 'crosshair';
      canvas.hoverCursor = 'crosshair';
    } else if (isTextTool()) {
      canvas.defaultCursor = 'text';
      canvas.hoverCursor = 'text';
    } else {
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    }
  }, [canvas, isShapeTool, isTextTool]);

  const createPreviewObject = useCallback((startX: number, startY: number, currentX: number, currentY: number) => {
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);

    const shapeType = selectedTool.replace('shape-', '');
    let previewObject: fabric.Object | null = null;

    const previewOptions = {
      left,
      top,
      fill: selectedColor,
      stroke: selectedColor,
      strokeWidth: 2,
      opacity: 0.5,
      selectable: false,
      evented: false
    };

    switch (shapeType) {
      case 'rect':
        previewObject = new fabric.Rect({
          ...previewOptions,
          width: Math.max(width, 10),
          height: Math.max(height, 10)
        });
        break;
      case 'circle':
        const radius = Math.max(Math.min(width, height) / 2, 5);
        previewObject = new fabric.Circle({
          ...previewOptions,
          radius,
          left: startX - radius,
          top: startY - radius
        });
        break;
      case 'triangle':
        previewObject = new fabric.Triangle({
          ...previewOptions,
          width: Math.max(width, 10),
          height: Math.max(height, 10)
        });
        break;
      case 'line':
        previewObject = new fabric.Line([startX, startY, currentX, currentY], {
          stroke: selectedColor,
          strokeWidth: 3,
          opacity: 0.5,
          selectable: false,
          evented: false
        });
        break;
    }

    return previewObject;
  }, [selectedTool, selectedColor]);

  const createFinalObject = useCallback((startX: number, startY: number, endX: number, endY: number) => {
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);

    if (isTextTool()) {
      const properties = {
        type: 'text',
        left: startX,
        top: startY,
        width: 200,
        text: 'New Text',
        fontSize: 20,
        fontFamily: 'Arial',
        fill: selectedColor
      };
      onObjectCreate(properties);
      return;
    }

    if (width < 10 || height < 10) return;

    const shapeType = selectedTool.replace('shape-', '');
    let properties: any = {
      type: shapeType,
      left,
      top,
      fill: selectedColor,
      stroke: selectedColor,
      strokeWidth: 2
    };

    switch (shapeType) {
      case 'rect':
        properties = {
          ...properties,
          width,
          height
        };
        break;
      case 'circle':
        const radius = Math.min(width, height) / 2;
        properties = {
          ...properties,
          radius,
          left: startX - radius,
          top: startY - radius
        };
        break;
      case 'triangle':
        properties = {
          ...properties,
          width,
          height
        };
        break;
      case 'line':
        properties = {
          ...properties,
          x1: 0,
          y1: 0,
          x2: endX - startX,
          y2: endY - startY,
          left: startX,
          top: startY,
          fill: undefined
        };
        break;
    }

    onObjectCreate(properties);
  }, [selectedTool, selectedColor, onObjectCreate, isTextTool]);

  const handleMouseDown = useCallback((e: fabric.TEvent) => {
    if (!canvas || selectedTool === 'select') return;

    const pointer = canvas.getPointer(e.e as MouseEvent);

    if (isTextTool()) {
      createFinalObject(pointer.x, pointer.y, pointer.x, pointer.y);
      return;
    }

    if (isShapeTool()) {
      setDragState({
        isCreating: true,
        startPoint: { x: pointer.x, y: pointer.y },
        previewObject: null
      });
      canvas.selection = false;
    }
  }, [canvas, selectedTool, isTextTool, isShapeTool, createFinalObject]);

  const handleMouseMove = useCallback((e: fabric.TEvent) => {
    if (!canvas || !dragStateRef.current.isCreating || !dragStateRef.current.startPoint) return;

    const pointer = canvas.getPointer(e.e as MouseEvent);
    const { startPoint } = dragStateRef.current;

    if (dragStateRef.current.previewObject) {
      canvas.remove(dragStateRef.current.previewObject);
    }

    const newPreviewObject = createPreviewObject(
      startPoint.x,
      startPoint.y,
      pointer.x,
      pointer.y
    );

    if (newPreviewObject) {
      canvas.add(newPreviewObject);
      canvas.renderAll();
      
      setDragState(prev => ({
        ...prev,
        previewObject: newPreviewObject
      }));
    }
  }, [canvas, createPreviewObject]);

  const handleMouseUp = useCallback((e: fabric.TEvent) => {
    if (!canvas || !dragStateRef.current.isCreating || !dragStateRef.current.startPoint) return;

    const pointer = canvas.getPointer(e.e as MouseEvent);
    const { startPoint, previewObject } = dragStateRef.current;

    if (previewObject) {
      canvas.remove(previewObject);
    }

    createFinalObject(startPoint.x, startPoint.y, pointer.x, pointer.y);

    setDragState({
      isCreating: false,
      startPoint: null,
      previewObject: null
    });

    canvas.selection = true;
    canvas.renderAll();
  }, [canvas, createFinalObject]);

  useEffect(() => {
    updateCursor();
  }, [updateCursor, selectedTool]);

  useEffect(() => {
    if (!canvas) return;

    const cleanup = () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);

      if (dragStateRef.current.previewObject) {
        canvas.remove(dragStateRef.current.previewObject);
        canvas.renderAll();
      }

      setDragState({
        isCreating: false,
        startPoint: null,
        previewObject: null
      });
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return cleanup;
  }, [canvas, handleMouseDown, handleMouseMove, handleMouseUp]);
};