'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type ScannerProps = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
  locale?: 'en' | 'fr';
};

type BarcodeResult = { rawValue: string };
type BarcodeDetectorLike = { detect(source: ImageBitmapSource): Promise<BarcodeResult[]> };
type BarcodeDetectorConstructor = {
  new (options: { formats: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};
type CameraCapabilities = MediaTrackCapabilities & {
  focusMode?: string[];
  zoom?: { min: number; max: number; step?: number };
  torch?: boolean;
};

const barcodeFormats = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];

export function BarcodeScanner({ onDetected, onClose, locale = 'fr' }: ScannerProps) {
  const english = locale === 'en';
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop(): void } | null>(null);
  const frameRef = useRef(0);
  const detectedRef = useRef(false);
  const [status, setStatus] = useState<'opening' | 'active' | 'denied' | 'unavailable'>('opening');
  const [zoomRange, setZoomRange] = useState<{ min: number; max: number; step: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

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
    if ('vibrate' in navigator) navigator.vibrate(80);
    stop();
    onDetected(code);
  }, [onDetected, stop]);

  const applyCameraSetting = async (setting: Record<string, boolean | number>) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [setting as MediaTrackConstraintSet] });
    } catch {
      // Capabilities may change while a camera is in use; scanning should continue.
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function openScanner() {
      if (!navigator.mediaDevices?.getUserMedia || !videoRef.current) {
        setStatus('unavailable');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((track) => track.stop());
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        const capabilities = (track.getCapabilities?.() ?? {}) as CameraCapabilities;
        if (capabilities.focusMode?.includes('continuous')) {
          try {
            await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] });
          } catch {
            // Never prevent scanning when a browser reports a stale capability.
          }
        }
        if (capabilities.zoom && Number.isFinite(capabilities.zoom.min) && Number.isFinite(capabilities.zoom.max) && capabilities.zoom.max > capabilities.zoom.min) {
          const initialZoom = Math.min(capabilities.zoom.max, Math.max(capabilities.zoom.min, 1));
          setZoom(initialZoom);
          setZoomRange({ min: capabilities.zoom.min, max: capabilities.zoom.max, step: capabilities.zoom.step || 0.1 });
        }
        setTorchAvailable(capabilities.torch === true);

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setStatus('active');

        const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
        const nativeFormats = Detector?.getSupportedFormats ? await Detector.getSupportedFormats() : [];
        const usableFormats = barcodeFormats.filter((format) => nativeFormats.includes(format));
        if (Detector && usableFormats.length > 0) {
          const detector = new Detector({ formats: usableFormats });
          const detectFrame = async () => {
            if (cancelled || detectedRef.current) return;
            try {
              const results = await detector.detect(video);
              if (results[0]?.rawValue) return complete(results[0].rawValue);
            } catch {
              // A frame can be blurred or incomplete; keep scanning the live stream.
            }
            frameRef.current = requestAnimationFrame(detectFrame);
          };
          frameRef.current = requestAnimationFrame(detectFrame);
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser');
          if (cancelled) return;
          const reader = new BrowserMultiFormatReader();
          controlsRef.current = await reader.decodeFromStream(stream, video, (result) => {
            if (result) complete(result.getText());
          });
        }
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
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 p-4 text-white sm:inset-6 sm:mx-auto sm:max-w-4xl sm:rounded-3xl sm:border sm:border-white/20 sm:shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
      <div className="flex items-center justify-between gap-4">
        <h3 id="scanner-title" className="font-bold">{english ? 'Scan a barcode' : 'Scanner un code-barres'}</h3>
        <button type="button" onClick={close} className="rounded-full border border-white/40 px-4 py-2 text-sm font-semibold hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-400">{english ? 'Close' : 'Fermer'}</button>
      </div>
      {status === 'opening' ? <p className="m-auto text-center text-sm" aria-live="polite">{english ? 'Opening rear camera…' : 'Ouverture de la caméra arrière…'}</p> : null}
      <div className={status === 'active' ? 'relative mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl bg-black' : 'hidden'}>
        <video ref={videoRef} muted playsInline className="h-full w-full object-cover" aria-label={english ? 'Live camera preview' : 'Aperçu caméra en direct'} />
        <div className="pointer-events-none absolute left-[6%] right-[6%] top-1/2 h-40 -translate-y-1/2 rounded-xl border-2 border-amber-400 shadow-[0_0_0_9999px_rgba(0,0,0,.38)]" aria-hidden="true"><span className="absolute -left-0.5 -top-0.5 h-6 w-6 border-l-4 border-t-4 border-white" /><span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 border-b-4 border-r-4 border-white" /></div>
        <p className="absolute inset-x-3 bottom-4 text-center text-sm font-semibold drop-shadow">{english ? 'Place the barcode inside the frame' : 'Placez le code-barres dans le cadre'}</p>
      </div>
      {status === 'active' && (torchAvailable || zoomRange) ? <div className="mt-4 flex flex-wrap items-center justify-center gap-4 rounded-xl bg-white/10 p-3">
        {torchAvailable ? <button type="button" aria-pressed={torchOn} onClick={() => { const next = !torchOn; setTorchOn(next); void applyCameraSetting({ torch: next }); }} className="rounded-full border border-white/50 px-4 py-2 text-sm font-semibold">{torchOn ? (english ? 'Turn torch off' : 'Éteindre la lampe') : (english ? 'Turn torch on' : 'Allumer la lampe')}</button> : null}
        {zoomRange ? <label className="flex min-w-52 items-center gap-3 text-sm font-semibold"><span>{english ? 'Zoom' : 'Zoom'}</span><input type="range" min={zoomRange.min} max={zoomRange.max} step={zoomRange.step} value={zoom} onChange={(event) => { const next = event.currentTarget.valueAsNumber; setZoom(next); void applyCameraSetting({ zoom: next }); }} className="accent-amber-400" /></label> : null}
      </div> : null}
      {status === 'denied' ? <p className="m-auto rounded-xl bg-red-50 p-4 text-sm font-medium text-red-900" role="alert">{english ? 'Camera access was denied. Enter the barcode manually or choose a photo.' : 'L’accès à la caméra a été refusé. Saisissez le code-barres manuellement ou choisissez une photo.'}</p> : null}
      {status === 'unavailable' ? <p className="m-auto rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-950" role="alert">{english ? 'The camera is unavailable. Enter the barcode manually or choose a photo.' : 'La caméra n’est pas disponible. Saisissez le code-barres manuellement ou choisissez une photo.'}</p> : null}
    </div>
  );
}
