'use client';
import { useEffect, useRef, useState } from 'react';
import { uploadAdminImage } from '@/lib/admin/api-client';
import { affiliateDesignError, defaultAffiliateDesign, makeAffiliateDesign, readAffiliateDesign, type AffiliateDesign } from '@/lib/content/affiliate-design';
import type { BannerInput } from '@/lib/content/affiliate';

export function AffiliateBannerFields({ value, onChange }: { value: BannerInput; onChange: (v: BannerInput) => void }) {
  const [initial] = useState(() => readAffiliateDesign(value.source));
  const [format, setFormat] = useState<'code' | 'image' | 'button'>(initial?.kind ?? 'code');
  const [design, setDesign] = useState<AffiliateDesign>(initial ?? defaultAffiliateDesign);
  const [code, setCode] = useState(initial ? '' : value.source);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const generation = useRef(0);
  const latest = useRef({ design, value, onChange });
  latest.current = { design, value, onChange };
  useEffect(() => () => { generation.current++; }, []);
  const updateDesign = (next: AffiliateDesign) => {
    setDesign(next); setPreview(null);
    onChange({ ...value, source: makeAffiliateDesign(next), mode: 'native' });
  };
  const upload = async (file: File) => {
    const current = ++generation.current;
    setUploading(true); setUploadError(''); setPreview(null);
    onChange({ ...value, source: '' });
    try {
      const image = await uploadAdminImage(file, 'editor');
      if (generation.current !== current) return;
      const next = { ...latest.current.design, image: image.url };
      setDesign(next);
      latest.current.onChange({ ...latest.current.value, source: makeAffiliateDesign(next), mode: 'native' });
    } catch (error) {
      if (generation.current !== current) return;
      setUploadError(error instanceof Error ? error.message : 'Import impossible.');
      latest.current.onChange({ ...latest.current.value, source: makeAffiliateDesign(latest.current.design), mode: 'native' });
    } finally { if (generation.current === current) setUploading(false); }
  };
  const [preview, setPreview] = useState<string | null>(null);
  return <div className="grid gap-3">
    <label>Type de contenu<select className="block w-full rounded border p-2 text-slate-950" value={format} onChange={e => {
      const next = e.target.value as typeof format;
      generation.current++; setUploading(false); setUploadError(''); setPreview(null);
      if (format === 'code') setCode(value.source);
      setFormat(next);
      if (next === 'code') onChange({ ...value, source: code });
      else updateDesign({ ...design, kind: next });
    }}>
      <option value="code">Code de plateforme (HTML / scripts)</option>
      <option value="image">Image cliquable</option>
      <option value="button">Bouton</option>
    </select></label>
    <label>Nom interne (facultatif)<input maxLength={200} className="block w-full rounded border p-2 text-slate-950" value={value.name ?? ''} onChange={e => onChange({ ...value, name: e.target.value })} /></label>
    {format === 'code' ? <>
    <label>Code complet de la plateforme<textarea className="block min-h-40 w-full rounded border p-2 font-mono text-xs text-slate-950" value={value.source} onChange={e => { onChange({ ...value, source: e.target.value }); setPreview(null); }} /></label>
    <label>Intégration sur le site public<select className="block w-full rounded border p-2 text-slate-950" value={value.mode ?? 'native'} onChange={e => onChange({ ...value, mode: e.target.value as BannerInput['mode'] })}>
      <option value="native">Dans la page (liens, images, iframes, scripts)</option>
      <option value="isolated">Document isolé (notamment document.write)</option>
    </select></label>
    </> : <fieldset disabled={uploading} className="grid gap-3">
      {format === 'image' ? <>
        <label>Importer une image<input type="file" accept="image/*" className="block w-full" onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void upload(file); }} /></label>
        <p className="text-xs">Image de 10 Mo maximum, ou renseignez une URL ci-dessous.</p>
        <label>URL de l’image<input type="url" className="block w-full rounded border p-2 text-slate-950" placeholder="https://…" value={design.image} onChange={e => updateDesign({ ...design, image: e.target.value })} /></label>
        <label>Texte alternatif de l’image<input className="block w-full rounded border p-2 text-slate-950" value={design.alt} onChange={e => updateDesign({ ...design, alt: e.target.value })} /></label>
      </> : <label>Texte du bouton<input className="block w-full rounded border p-2 text-slate-950" placeholder="Voir l’offre" value={design.label} onChange={e => updateDesign({ ...design, label: e.target.value })} /></label>}
      <label>Lien de destination<input type="url" className="block w-full rounded border p-2 text-slate-950" placeholder="https://…" value={design.url} onChange={e => updateDesign({ ...design, url: e.target.value })} /></label>
      <label><input type="checkbox" checked={design.newTab} onChange={e => updateDesign({ ...design, newTab: e.target.checked })} /> Ouvrir dans un nouvel onglet</label>
      <label>Alignement<select className="block w-full rounded border p-2 text-slate-950" value={design.align} onChange={e => updateDesign({ ...design, align: e.target.value as AffiliateDesign['align'] })}>
        <option value="left">Gauche</option><option value="center">Centre</option><option value="right">Droite</option>
      </select></label>
      <label><input type="checkbox" checked={design.fullWidth} onChange={e => updateDesign({ ...design, fullWidth: e.target.checked })} /> Toute la largeur disponible</label>
      {format === 'button' ? <div className="flex flex-wrap gap-4">
        <label>Couleur du bouton<input type="color" className="block" value={design.background} onChange={e => updateDesign({ ...design, background: e.target.value })} /></label>
        <label>Couleur du texte<input type="color" className="block" value={design.color} onChange={e => updateDesign({ ...design, color: e.target.value })} /></label>
      </div> : null}
      <label>Coins arrondis : {design.radius} px<input type="range" min="0" max="50" className="block w-full" value={design.radius} onChange={e => updateDesign({ ...design, radius: Number(e.target.value) })} /></label>
      {affiliateDesignError(design) ? <p role="alert" className="text-sm text-amber-600">{affiliateDesignError(design)}</p> : null}
    </fieldset>}
    {uploading ? <p role="status">Import de l’image en cours…</p> : null}
    {uploadError ? <p role="alert" className="text-red-600">{uploadError}</p> : null}
    {value.source.length > 100000 ? <p role="alert" className="text-red-600">Le code dépasse la limite de 100 000 caractères. Il est conservé dans le champ sans être tronqué ; réduisez-le avant de l’appliquer.</p> : null}
    {format === 'code' ? <p className="text-xs">Le code source est conservé intégralement. Le mode dans la page donne aux scripts l’accès à la page publique. Pour document.write, choisissez le document isolé. Ce dernier peut être incompatible avec les fournisseurs exigeant le domaine, les cookies ou le DOM de la page parente.</p> : null}
    <button type="button" disabled={uploading || !value.source.trim()} className="rounded border px-3 py-2 disabled:opacity-50" onClick={() => setPreview(value.source)}>Actualiser l’aperçu isolé</button>
    {preview !== null ? <iframe title="Aperçu isolé de la bannière" sandbox="allow-scripts allow-popups" referrerPolicy="no-referrer" className="h-72 w-full resize-y overflow-auto rounded border bg-white" srcDoc={`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>img,iframe{max-width:100%}body{margin:0;overflow-wrap:anywhere}</style></head><body>${preview}</body></html>`} /> : null}
    <p className="text-xs">L’aperçu n’a pas accès à la session administrateur. Un aperçu réussi ne valide pas les restrictions de domaine, le consentement, les bloqueurs ou le suivi du fournisseur en production. Les liens de prévisualisation peuvent être bloqués par l’isolation.</p>
    {/document\s*\.\s*write\s*\(/i.test(value.source) && value.mode !== 'isolated' ? <p role="alert" className="text-amber-600">Ce code utilise document.write : choisissez « Document isolé ». Il ne sera pas exécuté dans la page publique avec le mode actuel.</p> : null}
  </div>;
}
