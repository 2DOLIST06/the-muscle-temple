'use client';

import { useRef, useState, type ChangeEvent } from 'react';

type Detector = { detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>> };
type DetectorConstructor = { new (options: { formats: string[] }): Detector; getSupportedFormats?: () => Promise<string[]> };
const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

export function PhotoBarcodeInput({ onDetected, disabled, locale = 'fr' }: { onDetected: (code: string) => void; disabled?: boolean; locale?: 'en' | 'fr' }) {
  const english = locale === 'en';
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'missing' | 'invalid'>('idle');

  const readPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setStatus('invalid'); return; }
    setStatus('reading');
    let objectUrl: string | undefined;
    try {
      const NativeDetector = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
      const nativeFormats = NativeDetector?.getSupportedFormats ? await NativeDetector.getSupportedFormats() : [];
      const usableFormats = formats.filter((format) => nativeFormats.includes(format));
      let code: string | undefined;
      if (NativeDetector && usableFormats.length) {
        const bitmap = await createImageBitmap(file);
        try { code = (await new NativeDetector({ formats: usableFormats }).detect(bitmap))[0]?.rawValue; }
        finally { bitmap.close(); }
      } else {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        objectUrl = URL.createObjectURL(file);
        code = (await new BrowserMultiFormatReader().decodeFromImageUrl(objectUrl)).getText();
      }
      if (code) { setStatus('idle'); onDetected(code.replace(/\s+/g, '')); }
      else setStatus('missing');
    } catch { setStatus('missing'); }
    finally { if (objectUrl) URL.revokeObjectURL(objectUrl); }
  };

  const buttonClass = 'inline-flex min-h-11 items-center justify-center rounded-full border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-brand-700 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-brand-50';
  return (
    <div>
      <input ref={cameraInputRef} className="sr-only" type="file" accept="image/*" capture="environment" onChange={readPhoto} disabled={disabled} aria-describedby="photo-help photo-status" />
      <input ref={libraryInputRef} className="sr-only" type="file" accept="image/*" onChange={readPhoto} disabled={disabled} aria-describedby="photo-help photo-status" />
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={disabled || status === 'reading'} onClick={() => cameraInputRef.current?.click()} className={buttonClass}>{english ? 'Take a barcode photo' : 'Prendre une photo du code-barres'}</button>
        <button type="button" disabled={disabled || status === 'reading'} onClick={() => libraryInputRef.current?.click()} className={buttonClass}>{status === 'reading' ? (english ? 'Analyzing photo…' : 'Analyse de la photo…') : (english ? 'Choose a photo' : 'Choisir une photo')}</button>
      </div>
      <p id="photo-help" className="mt-2 text-xs text-slate-500">{english ? 'The image is analyzed only on your device and is never uploaded.' : 'L’image est analysée uniquement sur votre appareil et n’est jamais envoyée.'}</p>
      <p id="photo-status" aria-live="polite" className="mt-2 text-sm font-medium text-red-700">
        {status === 'missing' ? (english ? 'No barcode was detected in this photo. Try moving closer or improving the lighting.' : 'Aucun code-barres n’a été détecté sur cette photo. Essayez de vous rapprocher ou d’améliorer l’éclairage.') : status === 'invalid' ? (english ? 'Choose an image file.' : 'Choisissez un fichier image.') : ''}
      </p>
    </div>
  );
}
