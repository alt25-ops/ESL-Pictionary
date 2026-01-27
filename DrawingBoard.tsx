
import React, { useRef, useEffect, useState } from 'react';

interface DrawingBoardProps {
  isReadOnly: boolean;
  onDraw?: (action: any) => void;
  remoteActions?: any[];
  brushColor: string;
  brushSize: number;
}

const DrawingBoard: React.FC<DrawingBoardProps> = ({ 
  isReadOnly, 
  onDraw, 
  remoteActions, 
  brushColor, 
  brushSize 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle high DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = brushColor;
      context.lineWidth = brushSize;
      contextRef.current = context;
    }
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = brushColor;
      contextRef.current.lineWidth = brushSize;
    }
  }, [brushColor, brushSize]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isReadOnly) return;
    
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    
    onDraw?.({ type: 'start', x, y, color: brushColor, width: brushSize });
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isReadOnly) return;
    
    const { x, y } = getCoordinates(e);
    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
    
    onDraw?.({ type: 'draw', x, y });
  };

  const stopDrawing = () => {
    if (!isDrawing || isReadOnly) return;
    setIsDrawing(false);
    contextRef.current?.closePath();
    onDraw?.({ type: 'end' });
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  return (
    <div className="relative w-full h-full bg-white rounded-xl shadow-inner border-2 border-sky-100 overflow-hidden cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="w-full h-full block"
      />
      {isReadOnly && (
        <div className="absolute top-4 right-4 bg-sky-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          WATCHING
        </div>
      )}
    </div>
  );
};

export default DrawingBoard;
