'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AffiliateBannerFields } from './AffiliateBannerFields';
import { decodeAffiliate, inertBanners, makeBanner, type BannerMode } from '@/lib/content/affiliate';
import { InternalLinkPicker } from '@/components/admin/InternalLinkPicker';
import { InternalLinksSummary } from '@/components/admin/InternalLinksSummary';
import { extractLinkOccurrences, getLinkGroupKey, groupLinkOccurrences, type InternalLinkTarget, type LinkGroup } from '@/lib/admin/internal-links';
import type { Locale } from '@/lib/i18n/routing';

export interface RichContentValue {
  type: 'doc';
  html: string;
}

type ActiveFormats = {
  block: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
  link: boolean;
};

type AffiliateBlockDraft = {
  kind: 'link' | 'banner';
  url: string;
  label: string;
  bannerHtml: string;
  name?: string;
  mode?: BannerMode;
};

const emptyAffiliateBlock: AffiliateBlockDraft = {
  kind: 'link',
  url: '',
  label: '',
  bannerHtml: ''
};

const emptyFormats: ActiveFormats = {
  block: 'p',
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  insertUnorderedList: false,
  insertOrderedList: false,
  justifyLeft: false,
  justifyCenter: false,
  justifyRight: false,
  link: false
};

const toolbarButton =
  'rounded-md border px-2.5 py-1.5 text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500/50';
const inactiveButton = 'border-slate-600 bg-slate-900 text-slate-100 hover:border-slate-400 hover:bg-slate-800';
const activeButton = 'border-brand-400 bg-brand-700 text-white shadow shadow-brand-950/30';

const getNodeTagName = (node: Node | null) => {
  if (!node) return '';
  const element = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return element?.tagName.toLowerCase() ?? '';
};

const getSelectionElement = () => {
  const selection = document.getSelection();
  const node = selection?.anchorNode;
  return node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement;
};

const getSelectedLink = () => getSelectionElement()?.closest('a') as HTMLAnchorElement | null;

const selectionHasLink = () => Boolean(getSelectedLink());

const getSelectedImage = () => {
  const closest = getSelectionElement()?.closest('img, figure');
  if (!closest) return null;
  return closest.tagName.toLowerCase() === 'img' ? (closest as HTMLImageElement) : closest.querySelector('img');
};

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function RichContentEditor({
  value,
  onChange,
  onUploadImage,
  locale = 'fr'
}: {
  value: RichContentValue;
  onChange: (value: RichContentValue) => void;
  onUploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;
  locale?: Locale;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const editingAffiliateBlock = useRef<HTMLElement | null>(null);
  const draggedAffiliateBlock = useRef<HTMLElement | null>(null);
  const savedSelection = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const refreshFrameRef = useRef<number | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [activeFormats, setActiveFormats] = useState<ActiveFormats>(emptyFormats);
  const [hasTextSelection, setHasTextSelection] = useState(false);
  const [internalLinkPickerOpen, setInternalLinkPickerOpen] = useState(false);
  const [internalLinkError, setInternalLinkError] = useState('');
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([]);
  const [affiliateBlock, setAffiliateBlock] = useState<AffiliateBlockDraft | null>(null);
  const [affiliateError, setAffiliateError] = useState('');

  const refreshLinkGroups = useCallback(() => {
    if (refreshFrameRef.current !== null) window.cancelAnimationFrame(refreshFrameRef.current);
    refreshFrameRef.current = window.requestAnimationFrame(() => {
      refreshFrameRef.current = null;
      setLinkGroups(ref.current ? groupLinkOccurrences(extractLinkOccurrences(ref.current)) : []);
    });
  }, []);

  const decorateAffiliateBlocks = useCallback(() => {
    ref.current?.querySelectorAll<HTMLElement>('[data-affiliate-block="banner"], [data-affiliate-block="link"]').forEach(block => {
      block.contentEditable = 'false';
      block.querySelectorAll('[data-affiliate-controls]').forEach(control => control.remove());
      if (block.dataset.affiliateBlock === 'banner') {
        block.replaceChildren();
        const label = document.createElement('strong');
        label.textContent = `Bannière d’affiliation${block.dataset.affiliateName ? ' : ' + decodeAffiliate(block.dataset.affiliateName) : ''}`;
        block.append(label);
      }
      const disclosure = block.querySelector('.affiliate-block__disclosure');
      if (disclosure) block.append(disclosure);
      const toolbar = document.createElement('div');
      toolbar.className = 'flex flex-wrap justify-center gap-2 mt-2';
      toolbar.dataset.affiliateControls = 'true';
      for (const [action, title] of [['drag', '⠿ Déplacer'], ['up', 'Monter'], ['down', 'Descendre'], ['edit', 'Modifier / remplacer'], ['delete', 'Supprimer']]) {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = title;
        button.className = 'rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700';
        button.dataset.affiliateAction = action;
        if (action === 'drag') { button.draggable = true; button.style.cursor = 'grab'; }
        toolbar.append(button);
      }
      block.append(toolbar);
    });
  }, []);

  const serializeEditor = useCallback(() => {
    const clone = ref.current?.cloneNode(true) as HTMLDivElement | undefined;
    clone?.querySelectorAll('[data-affiliate-controls]').forEach(control => control.remove());
    clone?.querySelectorAll<HTMLElement>('[data-affiliate-block="banner"]').forEach(block => {
      block.outerHTML = makeBanner({ source: decodeAffiliate(block.dataset.affiliateSource ?? ''), name: decodeAffiliate(block.dataset.affiliateName ?? ''), mode: block.dataset.affiliateMode === 'isolated' ? 'isolated' : 'native' });
    });
    return clone?.innerHTML ?? '';
  }, []);

  useEffect(() => {
    if (ref.current && serializeEditor() !== inertBanners(value.html)) {
      ref.current.innerHTML = inertBanners(value.html);
      decorateAffiliateBlocks();
    }
    refreshLinkGroups();
  }, [decorateAffiliateBlocks, refreshLinkGroups, serializeEditor, value.html]);

  useEffect(() => () => {
    if (refreshFrameRef.current !== null) window.cancelAnimationFrame(refreshFrameRef.current);
    if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
  }, []);

  const emit = useCallback(() => {
    onChange({ type: 'doc', html: serializeEditor() });
    refreshLinkGroups();
  }, [onChange, refreshLinkGroups, serializeEditor]);

  const saveSelection = useCallback(() => {
    const selection = document.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    if (ref.current?.contains(range.commonAncestorContainer)) savedSelection.current = range.cloneRange();
  }, []);

  const restoreSelection = useCallback(() => {
    ref.current?.focus();
    const selection = document.getSelection();
    const range = savedSelection.current;
    if (!selection || !range || !range.startContainer.isConnected || !range.endContainer.isConnected || !ref.current?.contains(range.commonAncestorContainer)) return false;
    try {
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    } catch {
      return false;
    }
  }, []);

  const refreshActiveFormats = useCallback(() => {
    if (typeof document === 'undefined') return;

    const selection = document.getSelection();
    const anchorNode = selection?.anchorNode ?? null;
    if (!anchorNode || !ref.current?.contains(anchorNode)) {
      setHasTextSelection(false);
      setActiveFormats((current) => ({ ...current, block: current.block || 'p' }));
      return;
    }

    setHasTextSelection(Boolean(selection && !selection.isCollapsed && selection.toString().length > 0));

    let block = 'p';
    const formatBlock = String(document.queryCommandValue('formatBlock') || '').toLowerCase();
    if (formatBlock) block = formatBlock.replace(/[<>]/g, '');
    if (!block) block = getNodeTagName(anchorNode) || 'p';

    setActiveFormats({
      block,
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      insertUnorderedList: document.queryCommandState('insertUnorderedList'),
      insertOrderedList: document.queryCommandState('insertOrderedList'),
      justifyLeft: document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight: document.queryCommandState('justifyRight'),
      link: selectionHasLink()
    });
  }, []);

  useEffect(() => {
    document.addEventListener('selectionchange', refreshActiveFormats);
    return () => document.removeEventListener('selectionchange', refreshActiveFormats);
  }, [refreshActiveFormats]);

  const exec = (cmd: string, valueArg?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, valueArg);
    saveSelection();
    emit();
    refreshActiveFormats();
  };

  const addOrEditLink = () => {
    saveSelection();
    const selectedText = document.getSelection()?.toString().trim();
    const selectedLink = getSelectedLink();
    const currentUrl = selectedLink?.getAttribute('href') ?? '';
    const url = window.prompt('URL du lien (https://...)', currentUrl);
    if (url === null) return;

    const nextUrl = url.trim();
    restoreSelection();

    if (selectedLink && ref.current?.contains(selectedLink)) {
      if (nextUrl) selectedLink.setAttribute('href', nextUrl);
      else selectedLink.replaceWith(...Array.from(selectedLink.childNodes));
    } else if (nextUrl) {
      const safeUrl = escapeHtmlAttribute(nextUrl);
      if (selectedText) document.execCommand('createLink', false, nextUrl);
      else document.execCommand('insertHTML', false, `<a href="${safeUrl}">${safeUrl}</a>`);
    }

    emit();
    saveSelection();
    refreshActiveFormats();
  };

  const openInternalLinkPicker = () => {
    saveSelection();
    const range = savedSelection.current;
    if (!range || range.collapsed || !ref.current?.contains(range.commonAncestorContainer) || !document.getSelection()?.toString()) return;
    setInternalLinkError('');
    setInternalLinkPickerOpen(true);
  };

  const applyInternalLink = (target: InternalLinkTarget) => {
    if (!restoreSelection()) {
      setInternalLinkPickerOpen(false);
      setInternalLinkError('La sélection n’est plus disponible. Sélectionnez à nouveau le texte à lier.');
      return;
    }
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString() || !ref.current?.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      setInternalLinkPickerOpen(false);
      setInternalLinkError('La sélection n’est plus disponible. Sélectionnez à nouveau le texte à lier.');
      return;
    }
    document.execCommand('createLink', false, target.url);
    const linked = getSelectedLink();
    linked?.removeAttribute('target');
    emit();
    saveSelection();
    refreshActiveFormats();
    setInternalLinkPickerOpen(false);
    setInternalLinkError('');
  };

  const goToLink = useCallback((group: LinkGroup, occurrenceIndex: number) => {
    const links = ref.current ? Array.from(ref.current.querySelectorAll<HTMLAnchorElement>('a[href]')).filter((link) => {
      const href = link.getAttribute('href');
      return href !== null && getLinkGroupKey(link.textContent ?? '', href) === group.key;
    }) : [];
    const link = links[occurrenceIndex];
    if (!link || !ref.current) {
      refreshLinkGroups();
      return;
    }
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(link);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    savedSelection.current = range.cloneRange();
    link.scrollIntoView({ behavior: 'smooth', block: 'center' });
    ref.current.querySelectorAll('.internal-link-target-highlight').forEach((element) => element.classList.remove('internal-link-target-highlight'));
    link.classList.add('internal-link-target-highlight');
    if (highlightTimerRef.current !== null) window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => link.classList.remove('internal-link-target-highlight'), 2000);
    refreshActiveFormats();
  }, [refreshActiveFormats, refreshLinkGroups]);

  const insertImage = (url: string, alt = '') => {
    const safeUrl = escapeHtmlAttribute(url.trim());
    if (!safeUrl) return;
    const safeAlt = escapeHtmlAttribute(alt.trim());
    exec(
      'insertHTML',
      `<figure><img src="${safeUrl}" alt="${safeAlt}" /></figure><p><br></p>`
    );
  };

  const editSelectedImageAlt = () => {
    saveSelection();
    const image = getSelectedImage();
    if (!image || !ref.current?.contains(image)) {
      setUploadError('Cliquez d’abord sur une image dans le contenu pour modifier sa balise alt.');
      return;
    }

    const currentAlt = image.getAttribute('alt') ?? '';
    const nextAlt = window.prompt('Texte alternatif de l’image', currentAlt);
    if (nextAlt === null) return;

    image.setAttribute('alt', nextAlt.trim());
    const figure = image.closest('figure');
    const figcaption = figure?.querySelector('figcaption');
    // Remove captions duplicated from alt text by earlier editor versions.
    if (figcaption && figcaption.textContent?.trim() === currentAlt.trim()) figcaption.remove();
    setUploadError('');
    emit();
    saveSelection();
  };

  const addImageByUrl = () => {
    saveSelection();
    const url = window.prompt('URL de l’image (https://...)');
    if (!url) return;
    const alt = window.prompt('Texte alternatif de l’image (optionnel)') ?? '';
    restoreSelection();
    setUploadError('');
    insertImage(url, alt);
  };

  const insertMacroCalculator = () => {
    exec('insertHTML', '<p>[[macro-calculator]]</p><p><br></p>');
  };

  const editAffiliateBlock = (block: HTMLElement) => {
    saveSelection();
    editingAffiliateBlock.current = block;
    setAffiliateError('');
    if (block.dataset.affiliateBlock === 'link') {
      const link = block.querySelector('a');
      setAffiliateBlock({ ...emptyAffiliateBlock, url: link?.getAttribute('href') ?? '', label: link?.textContent ?? '' });
    } else {
      setAffiliateBlock({ ...emptyAffiliateBlock, kind: 'banner', bannerHtml: decodeAffiliate(block.dataset.affiliateSource ?? ''), name: decodeAffiliate(block.dataset.affiliateName ?? ''), mode: block.dataset.affiliateMode === 'isolated' ? 'isolated' : 'native' });
    }
  };

  const openAffiliateBlock = () => {
    saveSelection();
    const selected = getSelectionElement()?.closest<HTMLElement>('[data-affiliate-block]');
    if (selected && ref.current?.contains(selected)) {
      editAffiliateBlock(selected);
      return;
    }
    editingAffiliateBlock.current = null;
    setAffiliateError('');
    setAffiliateBlock({ ...emptyAffiliateBlock, label: document.getSelection()?.toString().trim() || '' });
  };

  const insertAffiliateBlock = () => {
    if (!affiliateBlock) return;
    if (editingAffiliateBlock.current && !ref.current?.contains(editingAffiliateBlock.current)) {
      setAffiliateError('Ce bloc n’est plus disponible. Fermez le formulaire et sélectionnez à nouveau le bloc à modifier.');
      return;
    }

    const isHttpUrl = (candidate: string) => {
      try {
        const parsed = new URL(candidate);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    let blockHtml: string;
    if (affiliateBlock.kind === 'banner') {
      if (affiliateBlock.bannerHtml.length > 100000) { setAffiliateError('Le code dépasse la limite de 100 000 caractères. Il n’a pas été tronqué.'); return; }
      if (!affiliateBlock.bannerHtml.trim()) { setAffiliateError('Collez le code complet de la bannière.'); return; }
      const banners = ref.current?.querySelectorAll<HTMLElement>('[data-affiliate-block="banner"]');
      if (!editingAffiliateBlock.current?.isConnected && banners?.length === 1) editingAffiliateBlock.current = banners[0];
      if ((banners?.length ?? 0) > 1 && !editingAffiliateBlock.current) { setAffiliateError('Plusieurs anciennes bannières : utilisez « Modifier / remplacer » sur le bloc voulu.'); return; }
      blockHtml = makeBanner({ source: affiliateBlock.bannerHtml, name: affiliateBlock.name, mode: affiliateBlock.mode });
    } else {
      const destination = affiliateBlock.url.trim();
      if (!isHttpUrl(destination)) {
        setAffiliateError('Saisissez une URL d’affiliation complète commençant par http:// ou https://.');
        return;
      }
      const safeLabel = escapeHtmlAttribute(affiliateBlock.label.trim() || 'Voir l’offre');
      blockHtml = `<aside class="affiliate-block affiliate-block--link" data-affiliate-block="link" contenteditable="false"><a href="${escapeHtmlAttribute(destination)}" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="${safeLabel}"><span>${safeLabel}</span></a><span class="affiliate-block__disclosure">${locale === 'en' ? 'Affiliate link' : 'Lien affilié'}</span></aside>`;
    }

    if (editingAffiliateBlock.current?.isConnected && ref.current?.contains(editingAffiliateBlock.current)) {
      editingAffiliateBlock.current.outerHTML = blockHtml;
    } else {
      restoreSelection();
      document.execCommand('insertHTML', false, blockHtml + '<p><br></p>');
    }
    editingAffiliateBlock.current = null;
    decorateAffiliateBlocks();
    emit();
    saveSelection();
    setAffiliateBlock(null);
    setAffiliateError('');
  };

  const uploadImageFile = async (file?: File) => {
    setUploadError('');

    if (!file) {
      setUploadError('Aucun fichier image sélectionné.');
      return;
    }

    if (!onUploadImage) {
      setUploadError('Upload image indisponible: aucun endpoint backend n’est configuré pour cet éditeur.');
      return;
    }

    setUploading(true);
    try {
      const alt = window.prompt('Texte alternatif de l’image', file.name);
      if (alt === null) return;
      const uploaded = await onUploadImage(file);
      insertImage(uploaded.url, alt || uploaded.alt || file.name);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload image impossible.');
    } finally {
      setUploading(false);
    }
  };

  const buttonClass = (active = false) => `${toolbarButton} ${active ? activeButton : inactiveButton}`;
  const isBlock = (tag: string) => activeFormats.block === tag.toLowerCase();
  const contentHtml = useMemo(() => value.html, [value.html]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-black/20">
      <div className="sticky top-[var(--admin-sticky-top,0px)] z-30 flex flex-wrap items-center gap-2 rounded-t-xl border-b border-slate-700 bg-slate-900/95 p-3 shadow-lg shadow-slate-950/20 backdrop-blur">
        <button type="button" className={buttonClass(isBlock('p'))} onClick={() => exec('formatBlock', 'P')}>Paragraphe</button>
        <button type="button" className={buttonClass(isBlock('h1'))} onClick={() => exec('formatBlock', 'H1')}>H1</button>
        <button type="button" className={buttonClass(isBlock('h2'))} onClick={() => exec('formatBlock', 'H2')}>H2</button>
        <button type="button" className={buttonClass(isBlock('h3'))} onClick={() => exec('formatBlock', 'H3')}>H3</button>
        <button type="button" className={buttonClass(isBlock('h4'))} onClick={() => exec('formatBlock', 'H4')}>H4</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass(activeFormats.bold)} onClick={() => exec('bold')}>Gras</button>
        <button type="button" className={buttonClass(activeFormats.italic)} onClick={() => exec('italic')}>Italique</button>
        <button type="button" className={buttonClass(activeFormats.underline)} onClick={() => exec('underline')}>Souligné</button>
        <button type="button" className={buttonClass(activeFormats.strikeThrough)} onClick={() => exec('strikeThrough')}>Barré</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass(activeFormats.insertUnorderedList)} onClick={() => exec('insertUnorderedList')}>Puces</button>
        <button type="button" className={buttonClass(activeFormats.insertOrderedList)} onClick={() => exec('insertOrderedList')}>Numérotée</button>
        <button type="button" className={buttonClass(isBlock('blockquote'))} onClick={() => exec('formatBlock', 'BLOCKQUOTE')}>Citation</button>
        <button type="button" className={buttonClass(isBlock('pre'))} onClick={() => exec('formatBlock', 'PRE')}>Code</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass(activeFormats.justifyLeft)} onClick={() => exec('justifyLeft')}>Gauche</button>
        <button type="button" className={buttonClass(activeFormats.justifyCenter)} onClick={() => exec('justifyCenter')}>Centrer</button>
        <button type="button" className={buttonClass(activeFormats.justifyRight)} onClick={() => exec('justifyRight')}>Droite</button>
        <button type="button" className={buttonClass()} onClick={() => exec('outdent')}>- Retrait</button>
        <button type="button" className={buttonClass()} onClick={() => exec('indent')}>+ Retrait</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={buttonClass()} onClick={() => exec('insertHorizontalRule')}>Ligne</button>
        <button type="button" className={buttonClass()} onClick={insertMacroCalculator}>Calculatrice macros</button>
        <button type="button" className={buttonClass()} onClick={openAffiliateBlock}>Bloc affiliation</button>
        <button type="button" className={buttonClass(activeFormats.link)} onClick={addOrEditLink}>{activeFormats.link ? 'Modifier lien' : 'Lien'}</button>
        <button type="button" disabled={!hasTextSelection} className={`${buttonClass()} disabled:cursor-not-allowed disabled:opacity-40`} onMouseDown={(event) => event.preventDefault()} onClick={openInternalLinkPicker}>Lien interne</button>
        <button type="button" className={buttonClass()} onClick={() => exec('unlink')}>Retirer lien</button>
        <button type="button" className={buttonClass()} onClick={addImageByUrl}>Image URL</button>
        <button type="button" className={buttonClass()} onClick={() => { saveSelection(); fileInputRef.current?.click(); }}>Image fichier</button>
        <button type="button" className={buttonClass()} onClick={editSelectedImageAlt}>Alt image</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.currentTarget.value = '';
            await uploadImageFile(file);
          }}
        />
        <button type="button" className={buttonClass()} onClick={() => exec('insertHTML', '<br>')}>Saut ligne</button>
        <button type="button" className={buttonClass()} onClick={() => exec('removeFormat')}>Nettoyer</button>
        <button type="button" className={buttonClass()} onClick={() => exec('undo')}>Undo</button>
        <button type="button" className={buttonClass()} onClick={() => exec('redo')}>Redo</button>
      </div>

      {affiliateBlock ? (
        <div className="border-b border-slate-700 bg-slate-900 p-4 text-slate-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{editingAffiliateBlock.current ? 'Modifier le bloc d’affiliation' : 'Insérer un bloc d’affiliation'}</h3>
              <p className="mt-1 text-xs text-slate-400">Code complet conservé. L’aperçu des scripts reste isolé de l’administration.</p>
            </div>
            <button type="button" className={buttonClass()} onClick={() => { editingAffiliateBlock.current = null; setAffiliateBlock(null); setAffiliateError(''); }}>Fermer</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">Format
              <select className="mt-1 w-full rounded border border-slate-600 bg-white p-2 text-slate-950" value={affiliateBlock.kind} onChange={(event) => setAffiliateBlock({ ...affiliateBlock, kind: event.target.value as AffiliateBlockDraft['kind'] })}>
                <option value="link">Lien / bouton</option>
                <option value="banner">Bannière HTML / scripts</option>
              </select>
            </label>
            {affiliateBlock.kind === 'link' ? (
              <>
                <label className="text-sm">Lien d’affiliation
                  <input type="url" className="mt-1 w-full rounded border border-slate-600 bg-white p-2 text-slate-950" placeholder="https://..." value={affiliateBlock.url} onChange={(event) => setAffiliateBlock({ ...affiliateBlock, url: event.target.value })} />
                </label>
                <label className="text-sm md:col-span-2">Texte du bouton
                  <input className="mt-1 w-full rounded border border-slate-600 bg-white p-2 text-slate-950" placeholder="Voir l’offre" value={affiliateBlock.label} onChange={(event) => setAffiliateBlock({ ...affiliateBlock, label: event.target.value })} />
                </label>
              </>
            ) : (
              <div className="md:col-span-2"><AffiliateBannerFields value={{ source: affiliateBlock.bannerHtml, name: affiliateBlock.name, mode: affiliateBlock.mode }} onChange={v => setAffiliateBlock({ ...affiliateBlock, bannerHtml: v.source, name: v.name, mode: v.mode })} /></div>
            )}
          </div>
          {affiliateError ? <p className="mt-3 text-sm text-red-300">{affiliateError}</p> : null}
          <button type="button" className="mt-4 rounded bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500" onClick={insertAffiliateBlock}>{editingAffiliateBlock.current ? 'Enregistrer les modifications' : 'Insérer à la position du curseur'}</button>
        </div>
      ) : null}

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="rich-content min-h-[520px] w-full bg-white p-8 text-base leading-8 text-slate-900 outline-none [&_.affiliate-block]:my-6 [&_.affiliate-block__disclosure]:block [&_.affiliate-block__disclosure]:text-xs [&_.affiliate-block__disclosure]:uppercase [&_a]:rounded [&_a]:bg-brand-100 [&_a]:px-0.5 [&_a]:font-medium [&_a]:text-brand-800 [&_a]:underline [&_a]:decoration-brand-500 [&_a]:decoration-2 [&_a]:underline-offset-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_figcaption]:mt-2 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-slate-500 [&_figure]:my-6 [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:text-xl [&_h3]:font-semibold [&_h4]:text-lg [&_h4]:font-semibold [&_img]:max-w-full [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-lg [&_pre]:bg-slate-100 [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6"
        onClick={event => {
          const button = (event.target as HTMLElement).closest<HTMLElement>('[data-affiliate-action]');
          const block = button?.closest<HTMLElement>('[data-affiliate-block]');
          if (!button || !block) {
            if ((event.target as HTMLElement).closest('[data-affiliate-block="link"] a')) event.preventDefault();
            return;
          }
          event.preventDefault();
          const action = button.dataset.affiliateAction;
          if (action === 'edit') {
            editAffiliateBlock(block);
            return;
          }
          if (action === 'delete') block.remove();
          if (action === 'up') {
            if (block.previousElementSibling) block.previousElementSibling.before(block);
            else if (block.parentElement && block.parentElement !== ref.current) block.parentElement.before(block);
          }
          if (action === 'down') {
            if (block.nextElementSibling) block.nextElementSibling.after(block);
            else if (block.parentElement && block.parentElement !== ref.current) block.parentElement.after(block);
          }
          emit();
        }}
        onDragStart={event => {
          const handle = (event.target as HTMLElement).closest('[data-affiliate-action="drag"]');
          if (!handle) return;
          draggedAffiliateBlock.current = handle.closest<HTMLElement>('[data-affiliate-block]');
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', 'Bannière d’affiliation');
        }}
        onDragOver={event => { if (draggedAffiliateBlock.current) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; } }}
        onDragEnd={() => { draggedAffiliateBlock.current = null; }}
        onDrop={event => {
          const block = draggedAffiliateBlock.current;
          if (!block || !ref.current?.contains(block)) return;
          event.preventDefault();
          const target = (event.target as HTMLElement).closest('p,h1,h2,h3,h4,section,aside,div,ul,ol,figure,blockquote');
          if (target && target !== ref.current && !block.contains(target) && !target.contains(block)) {
            const bounds = target.getBoundingClientRect();
            if (event.clientY < bounds.top + bounds.height / 2) target.before(block); else target.after(block);
          } else if (target === ref.current) ref.current.append(block);
          draggedAffiliateBlock.current = null;
          emit();
        }}
        onBlur={saveSelection}
        onInput={() => {
          emit();
          saveSelection();
          refreshActiveFormats();
        }}
        onKeyUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
        onMouseUp={() => {
          saveSelection();
          refreshActiveFormats();
        }}
      />
      {internalLinkError ? <p className="border-t border-amber-800 bg-amber-950/60 px-3 py-2 text-xs text-amber-100">{internalLinkError}</p> : null}
      {uploadError ? <p className="border-t border-red-900 bg-red-950/70 px-3 py-2 text-xs text-red-100">{uploadError}</p> : null}
      <div className="flex items-center justify-between gap-3 border-t border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
        <span>{uploading ? 'Upload image en cours…' : `${contentHtml.length} caractères HTML`}</span>
        <span>Format courant : {activeFormats.block.toUpperCase()}{activeFormats.link ? ' · lien' : ''}</span>
      </div>
      <div className="mt-4"><InternalLinksSummary groups={linkGroups} onGoToLink={goToLink} /></div>
      {internalLinkPickerOpen ? <InternalLinkPicker initialLocale={locale} onClose={() => setInternalLinkPickerOpen(false)} onSelect={applyInternalLink} /> : null}
    </div>
  );
}
