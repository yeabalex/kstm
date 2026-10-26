import React from 'react';
import { useEffect, useState } from 'react';

interface LoaderProps {
  color?: string;
  size?: 'small' | 'medium' | 'large' | 'custom';
  customSize?: number;
  thickness?: number;
  speed?: 'slow' | 'normal' | 'fast';
  type?: 'spinner' | 'dots' | 'pulse';
  className?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  color = '#3b82f6', 
  size = 'medium', 
  customSize,
  thickness = 3,
  speed = 'normal',
  type = 'spinner',
  className = ''
}) => {
  const [rotation, setRotation] = useState(0);
  
  // Calculate actual size based on prop
  const getSize = () => {
    if (customSize) return customSize;
    
    switch (size) {
      case 'small': return 24;
      case 'medium': return 40;
      case 'large': return 64;
      default: return 40;
    }
  };
  
  // Calculate animation speed
  const getAnimationDuration = () => {
    switch (speed) {
      case 'slow': return 1.5;
      case 'normal': return 1;
      case 'fast': return 0.6;
      default: return 1;
    }
  };
  
  // Spinner animation
  useEffect(() => {
    if (type !== 'spinner') return;
    
    const interval = setInterval(() => {
      setRotation(prev => (prev + 6) % 360);
    }, getAnimationDuration() * 16.67); // Approximately 60fps
    
    return () => clearInterval(interval);
  }, [type, speed]);

  const actualSize = getSize();
  
  if (type === 'spinner') {
    return (
      <div 
        className={`inline-block ${className}`} 
        style={{ width: actualSize, height: actualSize }}
      >
        <div 
          className="relative w-full h-full"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 0.1s linear'
          }}
        >
          <div 
            className="absolute rounded-full border-transparent"
            style={{
              width: '100%',
              height: '100%',
              borderWidth: thickness,
              borderLeftColor: color,
              borderTopColor: color,
              borderStyle: 'solid'
            }}
          />
        </div>
      </div>
    );
  }
  
  if (type === 'dots') {
    return (
      <div 
        className={`flex items-center justify-center gap-2 ${className}`}
        style={{ width: actualSize * 2, height: actualSize }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-full animate-bounce"
            style={{
              width: actualSize / 4,
              height: actualSize / 4,
              backgroundColor: color,
              animationDuration: `${getAnimationDuration()}s`,
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>
    );
  }
  
  if (type === 'pulse') {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width: actualSize, height: actualSize }}
      >
        <div
          className="rounded-full animate-ping"
          style={{
            width: actualSize * 0.8,
            height: actualSize * 0.8,
            backgroundColor: 'transparent',
            border: `${thickness}px solid ${color}`,
            animationDuration: `${getAnimationDuration() * 1.5}s`
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: actualSize * 0.4,
            height: actualSize * 0.4,
            backgroundColor: color
          }}
        />
      </div>
    );
  }

  return null;
};