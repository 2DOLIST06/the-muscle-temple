'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface RichContentValue {
  type: 'doc';
  html: string;
}

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

  const contentHtml = useMemo(() => value.html, [value.html]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950">
      <div className="flex flex-wrap gap-2 border-b border-slate-700 p-2 text-xs">
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('formatBlock', 'H2')}>H2</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('formatBlock', 'H3')}>H3</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('bold')}>Gras</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('italic')}>Italique</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('insertUnorderedList')}>Puces</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('insertOrderedList')}>Numérotée</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('undo')}>Undo</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => exec('redo')}>Redo</button>
        <button type="button" className="rounded border px-2 py-1" onClick={() => { const u = window.prompt('URL'); if (u) exec('createLink', u); }}>Lien</button>
        <label className="rounded border px-2 py-1 cursor-pointer">Image<input type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file || !onUploadImage) return;
          setUploading(true);
          try { const uploaded = await onUploadImage(file); exec('insertImage', uploaded.url); } finally { setUploading(false); }
        }} /></label>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning className="min-h-72 p-4 outline-none" onInput={emit} />
      <div className="border-t border-slate-700 p-2 text-xs text-slate-400">{uploading ? 'Upload image…' : `${contentHtml.length} caractères HTML`}</div>
    </div>
  );
}
