import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import './ImageCropper.css';

const ImageCropper = ({
  image,
  onCropComplete,
  onCancel,
  aspect = 1,
  circular = false
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom) => {
    setZoom(zoom);
  };

  const onCropAreaComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc,
    pixelCrop
  ) => {
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
    <div className="cropper-modal-overlay">
      <div className="cropper-modal-container">
        <div className="cropper-modal-header">
          <h3>Crop Image</h3>
          <button className="cropper-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="cropper-wrapper">
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
        <div className="cropper-controls">
          <div className="zoom-control">
            <span>Zoom</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="zoom-range"
            />
          </div>
          <div className="cropper-actions">
            <button className="cropper-btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button className="cropper-btn-done" onClick={handleDone}>
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
