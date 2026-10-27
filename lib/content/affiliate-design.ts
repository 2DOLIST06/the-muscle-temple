import { parseFragment } from 'parse5';

export type AffiliateDesign = {
  kind: 'image' | 'button';
  url: string;
  image: string;
  label: string;
  alt: string;
  newTab: boolean;
  align: 'left' | 'center' | 'right';
  fullWidth: boolean;
  widthPercent?: number;
  background: string;
  color: string;
  radius: number;
};
export const defaultAffiliateDesign: AffiliateDesign = {
  kind: 'image', url: '', image: '', label: '', alt: '', newTab: true,
  align: 'center', fullWidth: false, background: '#0f172a', color: '#ffffff', radius: 12
};
const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function isAffiliateHttpUrl(value: string) {
  try { return ['http:', 'https:'].includes(new URL(value).protocol); } catch { return false; }
}
export function affiliateDesignError(value: AffiliateDesign): string | null {
  if (!isAffiliateHttpUrl(value.url.trim())) return 'Saisissez un lien complet commençant par http:// ou https://.';
  if (value.kind === 'image' && !isAffiliateHttpUrl(value.image.trim())) return 'Importez une image ou saisissez son URL complète (http:// ou https://).';
  if (value.kind === 'button' && !value.label.trim()) return 'Saisissez le texte du bouton.';
  if (!/^#[0-9a-f]{6}$/i.test(value.background) || !/^#[0-9a-f]{6}$/i.test(value.color)) return 'Choisissez des couleurs valides.';
  if (!['left', 'center', 'right'].includes(value.align) || !Number.isFinite(value.radius) || value.radius < 0 || value.radius > 50) return 'Vérifiez l’alignement et les coins arrondis.';
  if (value.widthPercent !== undefined && (!Number.isFinite(value.widthPercent) || value.widthPercent < 10 || value.widthPercent > 100)) return 'La largeur doit être comprise entre 10 et 100 %.';
  return null;
}
export function makeAffiliateDesign(value: AffiliateDesign) {
  if (affiliateDesignError(value)) return '';
  const metadata = encodeURIComponent(JSON.stringify(value)).replace(/'/g, '%27');
  const target = value.newTab ? ' target="_blank"' : '';
  const width = value.fullWidth ? 'width:100%;box-sizing:border-box;' : value.widthPercent !== undefined ? `width:${value.widthPercent}%;box-sizing:border-box;` : '';
  const imageWidth = value.fullWidth || value.widthPercent !== undefined ? 'width:100%;box-sizing:border-box;' : '';
  const content = value.kind === 'image'
    ? `<img src="${escape(value.image.trim())}" alt="${escape(value.alt)}" style="display:block;max-width:100%;height:auto;margin:0;${imageWidth}border-radius:${value.radius}px" loading="lazy">`
    : escape(value.label.trim());
  const style = value.kind === 'image' ? `display:inline-block;max-width:100%;padding:0;background:transparent;${width}`
    : `display:inline-flex;align-items:center;justify-content:center;max-width:100%;padding:12px 24px;background:${value.background};color:${value.color};border-radius:${value.radius}px;font-weight:600;text-decoration:none;overflow-wrap:anywhere;${width}`;
  return `<div data-affiliate-design="${metadata}" style="text-align:${value.align}"><a href="${escape(value.url.trim())}"${target} rel="sponsored nofollow noopener noreferrer" style="${style}">${content}</a></div>`;
}
export function readAffiliateDesign(source: string): AffiliateDesign | null {
  const fragment = parseFragment(source);
  if (fragment.childNodes.length !== 1) return null;
  const root = fragment.childNodes[0];
  const encoded = 'attrs' in root ? root.attrs.find(a => a.name === 'data-affiliate-design')?.value : undefined;
  if (!encoded) return null;
  try {
    const value = JSON.parse(decodeURIComponent(encoded));
    if (!value || !['image', 'button'].includes(value.kind)) return null;
    for (const key of ['url', 'image', 'label', 'alt', 'align', 'background', 'color']) if (typeof value[key] !== 'string') return null;
    if (typeof value.newTab !== 'boolean' || typeof value.fullWidth !== 'boolean' || affiliateDesignError(value)) return null;
    // Only reopen exact generated code as a visual design; preserve modified HTML as code.
    return makeAffiliateDesign(value) === source ? value : null;
  } catch { return null; }
}
