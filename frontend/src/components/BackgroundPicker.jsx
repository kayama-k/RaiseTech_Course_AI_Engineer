import { useRef } from 'react';

const PRESETS = [
  { name: 'ブルー', value: '#0079bf' },
  { name: 'オレンジ', value: '#d29034' },
  { name: 'グリーン', value: '#519839' },
  { name: 'レッド', value: '#b04632' },
  { name: 'パープル', value: '#89609e' },
  { name: 'スカイ', value: '#00aecc' },
  { name: 'グレー', value: '#838c91' },
  { name: 'ホワイト', value: '#f4f5f7' },
];

const MAX_IMAGE_DIMENSION = 1920;
const IMAGE_QUALITY = 0.82;

// Downscale + re-encode the picked image as a JPEG data URL so it stays
// small enough for localStorage (large photos can be several MB otherwise).
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', IMAGE_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function BackgroundPicker({ background, onChangeColor, onChangeImage, onClearImage }) {
  const fileInputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow picking the same file again later
    if (!file) return;
    try {
      const dataUrl = await resizeImageFile(file);
      onChangeImage(dataUrl);
    } catch (err) {
      window.alert(err.message || '画像の設定に失敗しました');
    }
  }

  return (
    <div className="bg-picker">
      <span className="bg-picker-label">背景</span>
      <div className="bg-picker-swatches">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            className={`bg-swatch${
              background.type === 'color' && background.value === preset.value ? ' bg-swatch--active' : ''
            }`}
            style={{ background: preset.value }}
            title={preset.name}
            aria-label={preset.name}
            onClick={() => onChangeColor(preset.value)}
          />
        ))}
      </div>
      <button type="button" className="bg-image-btn" onClick={() => fileInputRef.current?.click()}>
        🖼 画像を選択
      </button>
      {background.type === 'image' && (
        <button type="button" className="bg-image-btn" onClick={onClearImage}>
          画像を解除
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
