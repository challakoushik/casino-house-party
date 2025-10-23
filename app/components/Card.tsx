// Card component to display playing cards
import React from 'react';

interface CardProps {
  card: string; // Format: "A♠", "10♥", etc.
  className?: string;
  faceDown?: boolean;
  style?: React.CSSProperties;
}

export function Card({ card, className = '', faceDown = false, style }: CardProps) {
  if (faceDown) {
    return (
      <div className={`inline-block bg-gradient-to-br from-blue-800 to-blue-950 border-2 border-blue-600 rounded-lg shadow-lg ${className}`} style={style}>
        <div className="w-16 h-24 flex items-center justify-center">
          <div className="text-4xl">🂠</div>
        </div>
      </div>
    );
  }

  // Parse card: last character is suit, everything before is rank
  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  
  // Determine if red or black suit
  const isRed = suit === '♥' || suit === '♦';
  const suitColor = isRed ? 'text-red-600' : 'text-gray-900';
  
  return (
    <div className={`inline-block bg-white border-2 border-gray-300 rounded-lg shadow-lg ${className}`} style={style}>
      <div className="w-16 h-24 p-2 flex flex-col justify-between">
        {/* Top left corner */}
        <div className={`text-left ${suitColor} font-bold leading-none`}>
          <div className="text-lg">{rank}</div>
          <div className="text-xl">{suit}</div>
        </div>
        
        {/* Center suit */}
        <div className={`text-center ${suitColor} text-3xl`}>
          {suit}
        </div>
        
        {/* Bottom right corner (rotated) */}
        <div className={`text-right ${suitColor} font-bold leading-none rotate-180`}>
          <div className="text-lg">{rank}</div>
          <div className="text-xl">{suit}</div>
        </div>
      </div>
    </div>
  );
}

interface CardHandProps {
  cards: string[];
  label?: string;
  className?: string;
  faceDown?: boolean;
}

export function CardHand({ cards, label, className = '', faceDown = false }: CardHandProps) {
  return (
    <div className={`${className}`}>
      {label && (
        <div className="text-sm text-gray-300 mb-2 font-semibold">{label}</div>
      )}
      <div className="flex gap-2 flex-wrap justify-center">
        {cards.map((card, index) => (
          <Card 
            key={index} 
            card={card} 
            faceDown={faceDown}
            className="animate-[slideIn_0.3s_ease-out] transform transition-all hover:scale-105"
            style={{ animationDelay: `${index * 0.1}s` } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
