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
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className="bg-tk-bg-card rounded-2xl w-[90%] max-w-[800px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 px-6 flex justify-between items-center border-b border-tk-border">
          <h3 className="m-0 text-xl text-tk-text font-bold">Crop Image</h3>
          <button className="bg-transparent border-none text-tk-text-secondary cursor-pointer p-1 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-tk-bg-hover hover:text-tk-text" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="relative w-full h-[60vh] bg-[#333]">
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
        <div className="p-6 flex flex-col gap-5 bg-tk-bg-card">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-tk-text-secondary min-w-[50px]">Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 bg-tk-border rounded-full outline-none cursor-pointer"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button className="py-2.5 px-5 rounded-lg border border-tk-border bg-tk-bg-elevated text-tk-text-secondary font-semibold text-sm cursor-pointer transition-all duration-200 hover:bg-tk-bg-hover" onClick={onCancel}>
              Cancel
            </button>
            <button className="py-2.5 px-6 rounded-lg border-none bg-[#4f755c] text-white font-semibold text-sm cursor-pointer flex items-center gap-2 transition-all duration-200 shadow-sm hover:bg-[#3d5a47] hover:-translate-y-[1px] active:translate-y-0" onClick={handleDone}>
              <Check size={18} />
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
