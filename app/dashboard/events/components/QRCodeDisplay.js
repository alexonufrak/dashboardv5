'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function QRCodeDisplay({ value, size = 200 }) {
  const [mounted, setMounted] = useState(false);
  
  // Wait for client-side render to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div 
        style={{ width: size, height: size }} 
        className="bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center"
      >
        <span className="text-sm text-muted-foreground">Loading QR Code...</span>
      </div>
    );
  }
  
  return (
    <div className="p-4 bg-white rounded-lg">
      <QRCodeSVG 
        value={value}
        size={size}
        level="H" // High error correction
        includeMargin
        fgColor="#000000"
        bgColor="#FFFFFF"
      />
    </div>
  );
}