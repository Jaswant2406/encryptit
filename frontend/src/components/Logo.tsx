import React from 'react';

export const FingerprintLogo = ({ className = "w-6 h-6" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.02-.3 3" />
      <path d="M14 22a10 10 0 1 1 8-4" />
      <path d="M18 10a6 6 0 0 0-12 0c0 7 1 9 5 12" />
      <path d="M12 2v1" />
      <path d="M12 10a2 2 0 0 0-2 2c0 .21-.01.43-.04.65" />
      <path d="M8 22a10 10 0 0 1 0-20" />
      <path d="M16 22a10 10 0 0 0 0-20" />
      <circle cx="12" cy="12" r="10" strokeWidth="1.5" opacity="0.2" />
    </svg>
  );
};
