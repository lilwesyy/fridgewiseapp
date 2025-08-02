'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoImageProps {
  className?: string;
  priority?: boolean;
}

export default function LogoImage({ className, priority = false }: LogoImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback to text logo if SVG fails to load
  if (hasError) {
    return (
      <div className={`flex items-center justify-center bg-green-500 text-white font-bold text-xs rounded ${className}`}>
        FW
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image
        src="/assets/logo.svg"
        alt="FridgeWiseAI"
        fill
        className="object-contain"
        priority={priority}
        onError={() => {
          console.error('Failed to load SVG logo, using fallback');
          setHasError(true);
        }}
        onLoad={() => {
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse rounded"></div>
      )}
    </div>
  );
}