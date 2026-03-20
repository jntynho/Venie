
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CropData } from '../types';

interface CroppedImageProps {
  src: string;
  crop?: CropData;
  className?: string;
  alt?: string;
}

export const CroppedImage: React.FC<CroppedImageProps> = ({ src, crop, className, alt = "" }) => {
  const [loaded, setLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setNaturalSize({ 
        width: imgRef.current.naturalWidth, 
        height: imgRef.current.naturalHeight 
      });
      setLoaded(true);
    }
  }, [src]);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setLoaded(true);
    }
  };

  const imageStyle = useMemo(() => {
    const pixelCrop = crop?.pixelCrop;

    if (!loaded || !pixelCrop || !pixelCrop.width || !pixelCrop.height || naturalSize.width === 0) {
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
        objectPosition: 'center',
        opacity: src ? 1 : 0,
        transition: 'opacity 300ms ease-out',
      };
    }

    const { x, y, width: cw, height: ch } = pixelCrop;
    
    // Scale is calculated as natural size vs crop size
    // In React Easy Crop, results are basically a viewport on the original image
    const scaleWidth = (naturalSize.width / cw) * 100;
    const scaleHeight = (naturalSize.height / ch) * 100;

    // Use percentage relative to the container width/height
    const left = -(x / cw) * 100;
    const top = -(y / ch) * 100;

    return {
      position: 'absolute' as const,
      width: `${scaleWidth}%`,
      height: 'auto',
      left: `${left}%`,
      top: `${top}%`,
      maxWidth: 'none',
      maxHeight: 'none',
      opacity: 1,
      transition: 'opacity 400ms ease-in-out',
      willChange: 'transform',
    };
  }, [loaded, crop, naturalSize, src]);

  return (
    <div className={`${className || 'w-full h-full'} overflow-hidden relative transition-colors duration-500 flex items-center justify-center`}>
      {!loaded && src && !src.startsWith('data:') && (
        <div className="absolute inset-0 bg-white/[0.03] overflow-hidden z-0">
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent animate-[shimmer_1.5s_infinite]" />
        </div>
      )}
      
      {src && (
        <img 
          ref={imgRef}
          key={src}
          src={src} 
          alt={alt}
          onLoad={handleLoad}
          onError={() => setLoaded(false)}
          style={imageStyle}
          className="gpu-accelerated block z-10 pointer-events-none"
        />
      )}
    </div>
  );
};
