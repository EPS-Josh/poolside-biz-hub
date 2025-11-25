import React from 'react';

export const WaterDropLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <div className="relative w-24 h-24">
        {/* Water drop SVG */}
        <svg
          viewBox="0 0 100 120"
          className="w-full h-full"
        >
          {/* Drop outline */}
          <path
            d="M50,10 Q30,35 30,60 Q30,85 50,95 Q70,85 70,60 Q70,35 50,10 Z"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            className="opacity-50"
          />
          
          {/* Animated water fill */}
          <defs>
            <clipPath id="dropClip">
              <path d="M50,10 Q30,35 30,60 Q30,85 50,95 Q70,85 70,60 Q70,35 50,10 Z" />
            </clipPath>
          </defs>
          
          <g clipPath="url(#dropClip)">
            {/* Animated water level */}
            <rect
              x="0"
              y="0"
              width="100"
              height="120"
              fill="hsl(var(--primary))"
              className="animate-fill"
              style={{
                transform: 'translateY(100%)',
                animation: 'fillUp 2s ease-in-out infinite'
              }}
            />
            
            {/* Wave effect */}
            <path
              d="M0,60 Q25,55 50,60 T100,60 L100,120 L0,120 Z"
              fill="hsl(var(--primary) / 0.6)"
              className="animate-wave"
              style={{
                transform: 'translateY(100%)',
                animation: 'fillUp 2s ease-in-out infinite, wave 1.5s ease-in-out infinite'
              }}
            />
          </g>
        </svg>
      </div>
      
      <p className="text-sm text-muted-foreground animate-pulse">Loading photos...</p>
      
      <style>{`
        @keyframes fillUp {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0%);
          }
        }
        
        @keyframes wave {
          0%, 100% {
            transform: translateY(100%) translateX(0);
          }
          50% {
            transform: translateY(100%) translateX(-5px);
          }
        }
      `}</style>
    </div>
  );
};
