import React, { useRef, useState, useEffect } from "react";
import { Button } from "./Button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Point {
  x: number;
  y: number;
}

type Line = Point[];

const Whiteboard = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const socket = useRef<WebSocket | null>(null);
  const [otherCursors, setOtherCursors] = useState<Record<string, Point>>({});
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9)); // unique id per user

  useEffect(() => {
    
    socket.current = new WebSocket("ws://localhost:4000");

    socket.current.onopen = () => {
      console.log("Connected to WebSocket server");
    };

    socket.current.onmessage = async (event) => {
      let data: any;
    
      
      if (event.data instanceof Blob) {
        const text = await event.data.text(); 
        data = JSON.parse(text); 
      } else {
        data = JSON.parse(event.data); 
      }
    
      
      if (Array.isArray(data)) {
        setLines((prevLines) => [...prevLines, data]);
      } else if (data.type === "cursor" && data.userId !== userId) {
        setOtherCursors((prev) => ({
          ...prev,
          [data.userId]: { x: data.x, y: data.y },
        }));
      }
    };
    
    

    socket.current.onclose = () => {
      console.log("Disconnected from WebSocket server");
    };

    return () => {
      socket.current?.close();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 500;

    const redraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      lines.forEach((line) => {
        ctx.beginPath();
        line.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.stroke();
      });
    };

    redraw();
  }, [lines, color, brushSize]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const newLine: Line = [{ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }];
    setLines((prevLines) => [...prevLines, newLine]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
  
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
  
    setLines((prevLines) => {
      const newLines = [...prevLines];
      newLines[newLines.length - 1].push({ x, y });
      return newLines;
    });
  
    
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: "cursor", x, y }));
    }
  };
  

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      const lastLine = lines[lines.length - 1];
      socket.current.send(JSON.stringify(lastLine));
    }
  };

  const saveAsImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "whiteboard.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const saveAsPDF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasImg = await html2canvas(canvas);
    const pdf = new jsPDF();
    const imgData = canvasImg.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("Abc.pdf");
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setLines([]);
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold text-center">Collaborative Whiteboard</h1>

      <div className="flex gap-4 items-center">
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        <input type="range" min="1" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
        <Button onClick={saveAsImage}>Save as Image</Button>
        <Button onClick={saveAsPDF}>Save as PDF</Button>
        <Button onClick={clearCanvas}>Clear Whiteboard</Button>
      </div>

      <div className="relative border rounded-md">
        <canvas
          ref={canvasRef}
          className="border w-full h-[500px] bg-white"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        {Object.entries(otherCursors).map(([id, pos]) => (
    <div
      key={id}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: 10,
        height: 10,
        backgroundColor: "red",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  ))}
      </div>
    </div>
  );
};

export default Whiteboard;
