'use client';
import { useState } from 'react';
import type { BannerInput } from '@/lib/content/affiliate';

export function AffiliateBannerFields({ value, onChange }: { value: BannerInput; onChange: (v: BannerInput) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  return <div className="grid gap-3">
    <label>Nom interne (facultatif)<input maxLength={200} className="block w-full rounded border p-2 text-slate-950" value={value.name ?? ''} onChange={e => onChange({ ...value, name: e.target.value })} /></label>
    <label>Code complet de la plateforme<textarea className="block min-h-40 w-full rounded border p-2 font-mono text-xs text-slate-950" value={value.source} onChange={e => { onChange({ ...value, source: e.target.value }); setPreview(null); }} /></label>
    <label>Intégration sur le site public<select className="block w-full rounded border p-2 text-slate-950" value={value.mode ?? 'native'} onChange={e => onChange({ ...value, mode: e.target.value as BannerInput['mode'] })}>
      <option value="native">Dans la page (liens, images, iframes, scripts)</option>
      <option value="isolated">Document isolé (notamment document.write)</option>
    </select></label>
    {value.source.length > 100000 ? <p role="alert" className="text-red-600">Le code dépasse la limite de 100 000 caractères. Il est conservé dans le champ sans être tronqué ; réduisez-le avant de l’appliquer.</p> : null}
    <p className="text-xs">Le code source est conservé intégralement. Le mode dans la page donne aux scripts l’accès à la page publique. Pour document.write, choisissez le document isolé. Ce dernier peut être incompatible avec les fournisseurs exigeant le domaine, les cookies ou le DOM de la page parente.</p>
    <button type="button" className="rounded border px-3 py-2" onClick={() => setPreview(value.source)}>Actualiser l’aperçu isolé</button>
    {preview !== null ? <iframe title="Aperçu isolé de la bannière" sandbox="allow-scripts allow-popups" referrerPolicy="no-referrer" className="h-72 w-full resize-y overflow-auto rounded border bg-white" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>img,iframe{max-width:100%}body{margin:0;overflow-wrap:anywhere}</style></head><body>${preview}</body></html>`} /> : null}
    <p className="text-xs">L’aperçu n’a pas accès à la session administrateur. Un aperçu réussi ne valide pas les restrictions de domaine, le consentement, les bloqueurs ou le suivi du fournisseur en production. Les liens de prévisualisation peuvent être bloqués par l’isolation.</p>
    {/document\s*\.\s*write\s*\(/i.test(value.source) && value.mode !== 'isolated' ? <p role="alert" className="text-amber-600">Ce code utilise document.write : choisissez « Document isolé ». Il ne sera pas exécuté dans la page publique avec le mode actuel.</p> : null}
  </div>;
}
