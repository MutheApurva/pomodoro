import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Pen, Eraser, RotateCcw, Download } from 'lucide-react';

interface DrawingCanvasProps {
  initialData?: string;
  onChange: (data: string) => void;
}

export function DrawingCanvas({ initialData, onChange }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(3);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Set up canvas
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw dotted background
    drawDottedBackground(ctx);

    // Load initial data if provided
    if (initialData) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = initialData;
    }
  }, [initialData]);

  const drawDottedBackground = (ctx: CanvasRenderingContext2D) => {
    const dotSpacing = 20;
    const dotSize = 1;
    
    ctx.fillStyle = 'rgba(148, 163, 184, 0.3)'; // slate-400 with opacity
    
    for (let x = dotSpacing; x < ctx.canvas.width; x += dotSpacing) {
      for (let y = dotSpacing; y < ctx.canvas.height; y += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setLastPoint(point);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const currentPoint = getCanvasPoint(e);

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = tool === 'pen' ? '#ffffff' : 'transparent';
    ctx.lineWidth = brushSize;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(currentPoint.x, currentPoint.y);
    ctx.stroke();

    setLastPoint(currentPoint);
    
    // Save canvas data
    onChange(canvas!.toDataURL());
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas!.width, canvas!.height);
    drawDottedBackground(ctx);
    onChange(canvas!.toDataURL());
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
        <div className="flex gap-2">
          <Button
            variant={tool === 'pen' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('pen')}
            className={tool === 'pen' 
              ? 'bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 text-white' 
              : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white'
            }
          >
            <Pen className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'eraser' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('eraser')}
            className={tool === 'eraser' 
              ? 'bg-gradient-to-r from-emerald-500/80 to-cyan-500/80 text-white' 
              : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white'
            }
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        <div className="flex items-center gap-2 min-w-32">
          <span className="text-sm text-slate-300">Size:</span>
          <Slider
            value={[brushSize]}
            onValueChange={(value) => setBrushSize(value[0])}
            max={20}
            min={1}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-slate-300 w-6">{brushSize}</span>
        </div>

        <Separator orientation="vertical" className="h-6 bg-white/20" />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadCanvas}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-white/20 text-white"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="border border-white/20 rounded-xl overflow-hidden bg-white/5 backdrop-blur-sm">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className="w-full h-auto cursor-crosshair"
          style={{ maxHeight: '400px' }}
        />
      </div>
    </div>
  );
}
