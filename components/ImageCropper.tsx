
import React, { useState, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { THEME_CONFIGS } from '../constants';
import { useApp } from '../AppContext';
import { CropData } from '../types';

interface ImageCropperProps {
  image: string;
  initialCrop?: { x: number; y: number };
  initialZoom?: number;
  onCropUpdate: (cropData: CropData) => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ 
  image, 
  initialCrop, 
  initialZoom, 
  onCropUpdate
}) => {
  const { state } = useApp();
  const { theme, accentColor, circleBorderColor } = state.settings;
  const colors = (THEME_CONFIGS as any)[theme];

  const [crop, setCrop] = useState(initialCrop || { x: 0, y: 0 });
  const [zoom, setZoom] = useState(initialZoom || 1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (newCrop: { x: number; y: number }) => setCrop(newCrop);
  const onZoomChange = (newZoom: number) => setZoom(newZoom);

  const onCropCompleteInternal = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    if (croppedAreaPixels) {
      onCropUpdate({
        x: crop.x,
        y: crop.y,
        zoom: zoom,
        pixelCrop: croppedAreaPixels
      });
    }
  }, [crop, zoom, croppedAreaPixels, onCropUpdate]);

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <div className="flex flex-col h-full w-full gpu-accelerated overflow-hidden bg-[var(--bg)]">
      <div className="relative flex-1 w-full max-w-lg mx-auto overflow-hidden">
        <Cropper
          key={image} // Force re-mount if image URL changes
          image={image}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
          style={{
            containerStyle: { background: 'transparent' },
            cropAreaStyle: { 
              border: `2.5px solid ${circleBorderColor}`, 
              boxShadow: `0 0 0 9999em ${colors.bg}cc`,
              transition: 'border-color 0.3s ease'
            }
          }}
        />
      </div>

      <div className="w-full max-w-lg mx-auto flex flex-col gap-6 px-4 pt-8 pb-12 z-20 bg-[var(--bg)]">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-end px-1">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest leading-none">Scaling Factor</span>
            <span className="text-[12px] font-black text-[var(--text-primary)] tabular-nums leading-none">{(zoom * 100).toFixed(0)}%</span>
          </div>
          <input 
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer outline-none transition-all"
            style={{ accentColor: accentColor }}
          />
        </div>

        <button
          onClick={resetCrop}
          className="w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-[0.98] bg-[var(--text-primary)] text-[var(--surface)] shadow-xl shadow-black/20"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};
