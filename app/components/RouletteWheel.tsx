// Roulette wheel animation component
import React from 'react';

interface RouletteWheelProps {
  spinning?: boolean;
  winningNumber?: number;
  className?: string;
}

export function RouletteWheel({ spinning = false, winningNumber, className = '' }: RouletteWheelProps) {
  // Red numbers in roulette
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600';
    return redNumbers.includes(num) ? 'bg-red-600' : 'bg-gray-900';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Outer wheel rim */}
      <div className="relative w-64 h-64 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-600 via-yellow-700 to-yellow-800 shadow-2xl border-8 border-yellow-500">
          {/* Inner wheel with numbers */}
          <div className={`absolute inset-4 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center ${spinning ? 'animate-spin' : ''}`}>
            {/* Center display */}
            <div className="text-center z-10">
              {winningNumber !== undefined ? (
                <div>
                  <div className={`inline-block px-6 py-3 rounded-full text-4xl font-bold text-white ${getNumberColor(winningNumber)}`}>
                    {winningNumber}
                  </div>
                </div>
              ) : (
                <div className="text-6xl">🎡</div>
              )}
            </div>
            
            {/* Decorative number segments around the edge */}
            {!spinning && (
              <div className="absolute inset-0">
                {[0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27].map((num, index) => {
                  const angle = (index * 30) - 90; // 12 segments
                  const radius = 85;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <div
                      key={index}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                      }}
                    >
                      <div className={`w-8 h-8 rounded-full ${getNumberColor(num)} flex items-center justify-center text-white text-xs font-bold`}>
                        {num}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Ball indicator */}
        {spinning && (
          <div className="absolute top-1/2 right-8 w-4 h-4 bg-white rounded-full shadow-lg animate-pulse" />
        )}
      </div>
      
      {spinning && (
        <div className="text-center mt-4 text-yellow-300 text-xl font-bold animate-pulse">
          Spinning...
        </div>
      )}
    </div>
  );
}
