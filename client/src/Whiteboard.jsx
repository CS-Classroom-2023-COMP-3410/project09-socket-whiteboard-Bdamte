import React, { useEffect, useRef, useState } from 'react';
import { io } from "socket.io-client";

const socket = io('http://localhost:3000');

const Whiteboard = () => {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#000000');
    
    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
        const ctx = canvas.getContext("2d");
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctxRef.current = ctx;

        socket.on("draw", ({ x, y, prevX, prevY, color }) => {
            drawLine(prevX, prevY, x, y, color, false);
        });

        socket.on("load-board", (board) => {
            board.forEach(({ x, y, prevX, prevY, color }) =>
                drawLine(prevX, prevY, x, y, color, false)
            );
        });

        socket.on("clear-board", () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });

        return () => {
            socket.off("draw");
            socket.off("load-board");
            socket.off("clear-board");
        };
    }, []);

    const startDrawing = (e) => {
        setIsDrawing(true);
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        ctxRef.current.beginPath();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = e.nativeEvent;
        const prevX = ctxRef.current.prevX;
        const prevY = ctxRef.current.prevY;
        
        drawLine(prevX, prevY, offsetX, offsetY, color, true);
        console.log("Emitting draw event:", { x: offsetX, y: offsetY, prevX, prevY, color });

        socket.emit("draw", { x: offsetX, y: offsetY, prevX, prevY, color });
        ctxRef.current.prevX = offsetX;
        ctxRef.current.prevY = offsetY;
    };

    const drawLine = (prevX, prevY, x, y, color, emit) => {
        if (!ctxRef.current) return;
        ctxRef.current.strokeStyle = color;
        ctxRef.current.lineTo(x, y);
        ctxRef.current.stroke();
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);

        if (emit) {
            socket.emit("draw", { x, y, prevX, prevY, color });
        }
    };

    const clearBoard = () => {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        socket.emit("clear-board");
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                style={{ border: "2px solid black", background: "white" }}
            />
            <div>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
                <button onClick={clearBoard}>Clear Board</button>
            </div>
        </div>
    );
};

export default Whiteboard;