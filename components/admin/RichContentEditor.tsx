'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface RichContentValue {
  type: 'doc';
  html: string;
}

const toolbarButton =
  'rounded-md border border-slate-600 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition hover:border-slate-400 hover:bg-slate-800';

export function RichContentEditor({
  value,
  onChange,
  onUploadImage
}: {
  value: RichContentValue;
  onChange: (value: RichContentValue) => void;
  onUploadImage?: (file: File) => Promise<{ url: string; alt?: string }>;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value.html) ref.current.innerHTML = value.html;
  }, [value.html]);

  const emit = () => onChange({ type: 'doc', html: ref.current?.innerHTML ?? '' });

  const exec = (cmd: string, valueArg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, valueArg);
    emit();
  };

  const addLink = () => {
    const current = document.getSelection()?.toString().trim();
    const url = window.prompt('URL du lien (https://...)');
    if (!url) return;
    exec('createLink', url);
    if (!current) exec('insertText', url);
  };

  const contentHtml = useMemo(() => value.html, [value.html]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700 bg-slate-900/80 p-3">
        <button type="button" className={toolbarButton} onClick={() => exec('formatBlock', 'P')}>Paragraphe</button>
        <button type="button" className={toolbarButton} onClick={() => exec('formatBlock', 'H1')}>H1</button>
        <button type="button" className={toolbarButton} onClick={() => exec('formatBlock', 'H2')}>H2</button>
        <button type="button" className={toolbarButton} onClick={() => exec('formatBlock', 'H3')}>H3</button>
        <button type="button" className={toolbarButton} onClick={() => exec('formatBlock', 'H4')}>H4</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={toolbarButton} onClick={() => exec('bold')}>Gras</button>
        <button type="button" className={toolbarButton} onClick={() => exec('italic')}>Italique</button>
        <button type="button" className={toolbarButton} onClick={() => exec('underline')}>Souligné</button>
        <button type="button" className={toolbarButton} onClick={() => exec('strikeThrough')}>Barré</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={toolbarButton} onClick={() => exec('insertUnorderedList')}>Puces</button>
        <button type="button" className={toolbarButton} onClick={() => exec('insertOrderedList')}>Numérotée</button>
        <button type="button" className={toolbarButton} onClick={() => exec('formatBlock', 'BLOCKQUOTE')}>Citation</button>
        <button type="button" className={toolbarButton} onClick={() => exec('formatBlock', 'PRE')}>Code</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={toolbarButton} onClick={() => exec('justifyLeft')}>Gauche</button>
        <button type="button" className={toolbarButton} onClick={() => exec('justifyCenter')}>Centrer</button>
        <button type="button" className={toolbarButton} onClick={() => exec('justifyRight')}>Droite</button>
        <button type="button" className={toolbarButton} onClick={() => exec('outdent')}>- Retrait</button>
        <button type="button" className={toolbarButton} onClick={() => exec('indent')}>+ Retrait</button>

        <span className="mx-1 h-6 w-px bg-slate-700" />

        <button type="button" className={toolbarButton} onClick={() => exec('insertHorizontalRule')}>Ligne</button>
        <button type="button" className={toolbarButton} onClick={addLink}>Lien</button>
        <button type="button" className={toolbarButton} onClick={() => exec('unlink')}>Retirer lien</button>
        <label className={`${toolbarButton} cursor-pointer`}>
          Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !onUploadImage) return;
              setUploading(true);
              try {
                const uploaded = await onUploadImage(file);
                exec('insertImage', uploaded.url);
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        <button type="button" className={toolbarButton} onClick={() => exec('insertParagraph')}>Saut ligne</button>
        <button type="button" className={toolbarButton} onClick={() => exec('removeFormat')}>Nettoyer</button>
        <button type="button" className={toolbarButton} onClick={() => exec('undo')}>Undo</button>
        <button type="button" className={toolbarButton} onClick={() => exec('redo')}>Redo</button>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[520px] w-full bg-white p-8 text-base leading-8 text-slate-900 outline-none"
        onInput={emit}
      />
      <div className="border-t border-slate-700 bg-slate-900/70 p-2 text-xs text-slate-300">
        {uploading ? 'Upload image…' : `${contentHtml.length} caractères HTML`}
      </div>
    </div>
  );
}
