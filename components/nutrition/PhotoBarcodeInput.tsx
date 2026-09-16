'use client';

import { useRef, useState, type ChangeEvent } from 'react';

type Detector = { detect(source: ImageBitmapSource): Promise<Array<{ rawValue: string }>> };
type DetectorConstructor = new (options: { formats: string[] }) => Detector;

export function PhotoBarcodeInput({ onDetected, disabled, locale = 'fr' }: { onDetected: (code: string) => void; disabled?: boolean; locale?: 'en' | 'fr' }) {
  const english = locale === 'en';
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'reading' | 'missing' | 'invalid'>('idle');

  const readPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatus('invalid');
      return;
    }
    setStatus('reading');
    let objectUrl: string | undefined;
    try {
      const NativeDetector = (window as unknown as { BarcodeDetector?: DetectorConstructor }).BarcodeDetector;
      let code: string | undefined;
      if (NativeDetector) {
        const bitmap = await createImageBitmap(file);
        try {
          const detected = await new NativeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }).detect(bitmap);
          code = detected[0]?.rawValue;
        } finally {
          bitmap.close();
        }
      } else {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        objectUrl = URL.createObjectURL(file);
        const result = await new BrowserMultiFormatReader().decodeFromImageUrl(objectUrl);
        code = result.getText();
      }
      if (code) {
        setStatus('idle');
        onDetected(code.replace(/\s+/g, ''));
      } else setStatus('missing');
    } catch {
      setStatus('missing');
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={readPhoto} disabled={disabled} aria-describedby="photo-help photo-status" />
      <button type="button" disabled={disabled || status === 'reading'} onClick={() => inputRef.current?.click()} className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-800 transition hover:border-brand-700 disabled:cursor-wait disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-brand-50">
        {status === 'reading' ? (english ? 'Analyzing photo…' : 'Analyse de la photo…') : (english ? 'Upload a photo' : 'Importer une photo')}
      </button>
      <p id="photo-help" className="mt-2 text-xs text-slate-500">{english ? 'JPG, PNG, or WebP. The image is analyzed on your device and is never uploaded.' : 'JPG, PNG ou WebP. L’image est analysée localement et n’est jamais envoyée.'}</p>
      <p id="photo-status" aria-live="polite" className="mt-2 text-sm font-medium text-red-700">
        {status === 'missing' ? (english ? 'No readable barcode was found in this photo.' : 'Aucun code-barres détectable dans cette photo.') : status === 'invalid' ? (english ? 'Choose a JPG, PNG, or WebP image.' : 'Choisissez une image JPG, PNG ou WebP.') : ''}
      </p>
    </div>
  );
}
