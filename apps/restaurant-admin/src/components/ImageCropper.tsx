import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { X, Check } from 'lucide-react';
interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspect?: number;
  circular?: boolean;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  onCropComplete,
  onCancel,
  aspect = 1,
  circular = false
}) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropChange = (crop: Point) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleDone = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(image, croppedAreaPixels);
        onCropComplete(croppedImage);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] backdrop-blur-md p-4 animate-in fade-in duration-200 font-['Outfit',sans-serif]">
      <div className="bg-white dark:bg-tk-bg-card border border-[#E2E8F0] dark:border-tk-border rounded-[24px] w-full max-w-[750px] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-5 px-6 flex justify-between items-center border-b border-[#E2E8F0] dark:border-tk-border bg-[#F8FAFC] dark:bg-tk-bg-surface">
          <div>
            <h3 className="m-0 text-[18px] text-[#1A202C] dark:text-tk-text font-bold tracking-tight">Crop Image</h3>
            <p className="m-0 text-[12px] text-[#64748B] dark:text-tk-text-secondary mt-0.5">Drag to adjust image placement for optimal fit</p>
          </div>
          <button className="bg-transparent border-none text-[#94A3B8] hover:text-[#475569] dark:hover:text-tk-text cursor-pointer p-1.5 rounded-xl flex items-center justify-center transition-colors" onClick={onCancel} type="button">
            <X size={20} />
          </button>
        </div>
        <div className="relative w-full h-[55vh] min-h-[300px] bg-[#111827]">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            cropShape={circular ? 'round' : 'rect'}
            showGrid={true}
            onCropChange={onCropChange}
            onCropComplete={onCropAreaComplete}
            onZoomChange={onZoomChange}
          />
        </div>
        <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-5 bg-white dark:bg-tk-bg-card">
          <div className="flex items-center gap-3 w-full sm:w-1/2">
            <span className="text-[13px] font-bold text-[#4A5568] dark:text-tk-text-secondary uppercase tracking-wider min-w-[45px]">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-[#E2E8F0] dark:bg-tk-border rounded-full outline-none cursor-pointer accent-[#8B3A1E]"
            />
            <span className="text-[12px] font-semibold text-[#64748B] dark:text-tk-text-secondary min-w-[35px] text-right">{zoom.toFixed(1)}x</span>
          </div>
          <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            <button className="inline-flex items-center justify-center min-h-[42px] px-5 rounded-xl border-none bg-[#EDF2F7] hover:bg-[#E2E8F0] dark:bg-tk-bg-elevated dark:text-tk-text dark:hover:bg-tk-bg-hover text-[#2D3748] font-semibold text-[14px] cursor-pointer transition-all duration-200" onClick={onCancel} type="button">
              Cancel
            </button>
            <button className="inline-flex items-center justify-center gap-2 min-h-[42px] px-6 rounded-xl border-none bg-[linear-gradient(135deg,var(--tk-burgundy),#6B2A15)] text-white font-bold text-[14px] cursor-pointer shadow-[0_6px_16px_rgba(139,58,30,0.25)] hover:shadow-[0_10px_20px_rgba(139,58,30,0.35)] hover:-translate-y-px transition-all duration-200" onClick={handleDone} type="button">
              <Check size={18} strokeWidth={2.5} />
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
