"use client";

import React from "react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#080415] text-[#EBE5F7] animate-fade-in">
      {/* Subtle mandala watermark background */}
      <div className="absolute inset-0 opacity-[0.015] select-none pointer-events-none flex items-center justify-center">
        <svg className="w-[60%] h-[60%] text-[#FF4500]" fill="currentColor" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.5" fill="none" />
          <circle cx="50" cy="50" r="30" stroke="currentColor" strokeWidth="0.5" fill="none" />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 360) / 24;
            return (
              <line 
                key={i} 
                x1="50" 
                y1="50" 
                x2={50 + 45 * Math.cos((angle * Math.PI) / 180)} 
                y2={50 + 45 * Math.sin((angle * Math.PI) / 180)} 
                stroke="currentColor" 
                strokeWidth="0.3" 
              />
            );
          })}
        </svg>
      </div>

      <div className="relative flex flex-col items-center gap-6 z-10 select-none">
        {/* Pulsing Logo Container */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white overflow-hidden p-0 shadow-2xl animate-pulse border border-[#2b1e52]/40">
          <img src="/logo.png" alt="MilanAI Logo" className="h-full w-full object-cover" />
        </div>

        {/* Brand Name & Spinner */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-serif font-bold text-xl tracking-wide bg-gradient-to-r from-[#FF4500] to-[#E91E63] bg-clip-text text-transparent">
            MilanAI
          </h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF4500] animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#E91E63] animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#32ADE6] animate-bounce" />
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8b8b99] mt-2">
            Loading Workspace...
          </span>
        </div>
      </div>
    </div>
  );
}
