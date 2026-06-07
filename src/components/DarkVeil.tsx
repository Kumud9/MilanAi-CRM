"use client";

import React, { useEffect, useRef } from 'react';

interface DarkVeilProps {
  speed?: number;
  warpAmount?: number;
}

export function DarkVeil({ speed = 1.2, warpAmount = 0.3 }: DarkVeilProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    
    let animationId: number;
    let time = 0;

    const draw = () => {
      const W = cv.width = cv.offsetWidth;
      const H = cv.height = cv.offsetHeight;
      
      ctx.fillStyle = '#15080D';
      ctx.fillRect(0, 0, W, H);

      time += 0.005 * speed; 

      // Orb 1
      const orb1X = W * 0.3 + Math.sin(time) * W * warpAmount; 
      const orb1Y = H * 0.5 + Math.cos(time * 0.8) * H * 0.3;
      const grad1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, W * 0.9);
      grad1.addColorStop(0, 'rgba(224, 84, 112, 0.3)'); 
      grad1.addColorStop(1, 'transparent');

      // Orb 2
      const orb2X = W * 0.7 + Math.cos(time * 1.1) * W * warpAmount;
      const orb2Y = H * 0.4 + Math.sin(time * 0.9) * H * 0.3;
      const grad2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, W * 0.8);
      grad2.addColorStop(0, 'rgba(201, 168, 76, 0.2)'); 
      grad2.addColorStop(1, 'transparent');

      // Orb 3
      const orb3X = W * 0.5 + Math.sin(time * 0.5) * W * 0.4;
      const orb3Y = H * 0.8 + Math.cos(time * 1.2) * H * 0.2;
      const grad3 = ctx.createRadialGradient(orb3X, orb3Y, 0, orb3X, orb3Y, W * 1.0);
      grad3.addColorStop(0, 'rgba(80, 30, 140, 0.25)'); 
      grad3.addColorStop(1, 'transparent');

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = grad1; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = grad2; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = grad3; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';

      animationId = requestAnimationFrame(draw);
    };

    draw();
    
    const handleResize = () => {
      if (cv) {
        cv.width = cv.offsetWidth;
        cv.height = cv.offsetHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [speed, warpAmount]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
}
