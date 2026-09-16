'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ScannerProps = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
};

type BarcodeResult = { rawValue: string };
type BarcodeDetectorLike = { detect(source: ImageBitmapSource): Promise<BarcodeResult[]> };
type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

const supportedFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

export function BarcodeScanner({ onDetected, onClose }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop(): void } | null>(null);
  const frameRef = useRef(0);
  const detectedRef = useRef(false);
  const [status, setStatus] = useState<'opening' | 'active' | 'denied' | 'unavailable'>('opening');

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const complete = useCallback((rawValue: string) => {
    const code = rawValue.replace(/\s+/g, '');
    if (detectedRef.current || !code) return;
    detectedRef.current = true;
    stop();
    onDetected(code);
  }, [onDetected, stop]);

  useEffect(() => {
    let cancelled = false;

    async function openScanner() {
      if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
        setStatus('unavailable');
        return;
      }
      try {
        const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
        const nativeFormats = Detector?.getSupportedFormats ? await Detector.getSupportedFormats() : supportedFormats;
        if (Detector && supportedFormats.some((format) => nativeFormats.includes(format))) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
          if (cancelled) return stream.getTracks().forEach((track) => track.stop());
          streamRef.current = stream;
          const video = videoRef.current;
          video.srcObject = stream;
          await video.play();
          setStatus('active');
          const detector = new Detector({ formats: supportedFormats });
          const detectFrame = async () => {
            if (cancelled || detectedRef.current) return;
            try {
              const results = await detector.detect(video);
              if (results[0]?.rawValue) return complete(results[0].rawValue);
            } catch {
              // A transient frame decoding failure is normal; keep scanning.
            }
            frameRef.current = requestAnimationFrame(detectFrame);
          };
          frameRef.current = requestAnimationFrame(detectFrame);
          return;
        }

        // Loaded only when native BarcodeDetector is unavailable and scanning starts.
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (result) complete(result.getText());
        });
        controlsRef.current = controls;
        const stream = videoRef.current.srcObject;
        if (stream instanceof MediaStream) streamRef.current = stream;
        setStatus('active');
      } catch (error) {
        stop();
        const denied = error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError');
        setStatus(denied ? 'denied' : 'unavailable');
      }
    }

    void openScanner();
    return () => { cancelled = true; stop(); };
  }, [complete, stop]);

  const close = () => { stop(); onClose(); };

  return (
    <div className="rounded-2xl border border-slate-300 bg-slate-950 p-4 text-white" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
      <div className="flex items-center justify-between gap-4">
        <h3 id="scanner-title" className="font-bold">Scanner un code-barres</h3>
        <button type="button" onClick={close} className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400">Fermer le scanner</button>
      </div>
      {status === 'opening' ? <p className="py-10 text-center text-sm" aria-live="polite">Ouverture de la caméra…</p> : null}
      <div className={status === 'active' ? 'relative mt-4 overflow-hidden rounded-xl bg-black' : 'hidden'}>
        <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" aria-label="Aperçu de la caméra" />
        <div className="pointer-events-none absolute inset-[18%_8%] rounded-xl border-2 border-amber-400 shadow-[0_0_0_999px_rgba(0,0,0,.3)]" aria-hidden="true" />
        <p className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold drop-shadow">Placez le code-barres dans le cadre</p>
      </div>
      {status === 'denied' ? <p className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-900" role="alert">L’accès à la caméra a été refusé. Vous pouvez saisir le code-barres manuellement ou importer une photo.</p> : null}
      {status === 'unavailable' ? <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-950" role="alert">La caméra n’est pas disponible. Saisissez le code-barres manuellement ou importez une photo.</p> : null}
    </div>
  );
}
