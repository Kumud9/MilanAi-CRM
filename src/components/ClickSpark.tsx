"use client";

import React, { useEffect, useRef } from "react";

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  easing?: "ease-out" | "linear";
  extraScale?: number;
}

interface SparkGroup {
  id: number;
  x: number;
  y: number;
  startTime: number;
}

export function ClickSpark({
  sparkColor = "#ffffff",
  sparkSize = 1.5,
  sparkRadius = 30,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<SparkGroup[]>([]);
  const sparkIdCounterRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resizeCanvas = () => {
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(parent);

    const draw = (now: number) => {
      const rect = parent.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      sparksRef.current = sparksRef.current.filter((group) => {
        const elapsed = now - group.startTime;
        const progress = Math.min(elapsed / duration, 1);

        let easeProgress = progress;
        if (easing === "ease-out") {
          // Cubic ease-out
          easeProgress = 1 - Math.pow(1 - progress, 3);
        }

        const currentRadius = easeProgress * sparkRadius * extraScale;
        const opacity = 1 - progress;

        ctx.strokeStyle = sparkColor;
        ctx.lineCap = "round";

        for (let i = 0; i < sparkCount; i++) {
          const angle = (i * 2 * Math.PI) / sparkCount;
          
          // Draw a short spark line moving outward
          const startDist = currentRadius * 0.5;
          const endDist = currentRadius;

          const startX = group.x + Math.cos(angle) * startDist;
          const startY = group.y + Math.sin(angle) * startDist;
          const endX = group.x + Math.cos(angle) * endDist;
          const endY = group.y + Math.sin(angle) * endDist;

          ctx.beginPath();
          ctx.lineWidth = sparkSize * (1 - progress);
          ctx.globalAlpha = opacity;
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        return elapsed < duration;
      });

      ctx.globalAlpha = 1; // reset alpha

      if (sparksRef.current.length > 0) {
        animationId = requestAnimationFrame(draw);
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      sparksRef.current.push({
        id: sparkIdCounterRef.current++,
        x,
        y,
        startTime: performance.now(),
      });

      if (sparksRef.current.length === 1) {
        animationId = requestAnimationFrame(draw);
      }
    };

    parent.addEventListener("pointerdown", handlePointerDown);

    return () => {
      parent.removeEventListener("pointerdown", handlePointerDown);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationId);
    };
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easing, extraScale]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}
