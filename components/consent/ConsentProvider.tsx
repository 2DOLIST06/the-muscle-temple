'use client';

import { createContext, useContext, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { categoryText, policyVersion, services, type ConsentCategory } from '@/lib/consent/registry';
import { cleanupBrowserService, ConsentManager, expiresAt } from '@/lib/consent/manager';

const ConsentContext = createContext<() => void>(() => {});
export const useCookieSettings = () => useContext(ConsentContext);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fr = pathname === '/fr' || pathname?.startsWith('/fr/');
  const manager = useRef<ConsentManager | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [hasChoice, setHasChoice] = useState(false);
  const [available, setAvailable] = useState(true);
  const [selected, setSelected] = useState<ConsentCategory[]>([]);

  useEffect(() => {
    manager.current ??= new ConsentManager(services, policyVersion, {
      storage: () => window.localStorage,
      now: () => new Date(),
      cleanup: cleanupBrowserService,
      reload: () => window.location.reload()
    });
    let timer: number | undefined;
    const refresh = () => {
      window.clearTimeout(timer);
      manager.current!.refresh();
      setHasChoice(manager.current!.choice !== null);
      setAvailable(manager.current!.storageAvailable);
      setReady(true);
      if (manager.current!.choice) {
        timer = window.setTimeout(refresh, Math.min(2_147_483_647, Math.max(1, expiresAt(manager.current!.choice.chosenAt) - Date.now())));
      }
    };
    refresh();
    // Revalidate on other-tab writes, restored tabs, and expiry without renewing the date.
    window.addEventListener('storage', refresh);
    window.addEventListener('pageshow', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('pageshow', refresh);
      window.removeEventListener('focus', refresh);
      window.clearTimeout(timer);
    };
  }, [hasChoice]);

  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);

  const show = () => {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected(manager.current?.choice?.categories ?? []);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    returnFocus.current?.focus();
  };
  const keepDialogFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !event.currentTarget.contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !event.currentTarget.contains(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  };
  const save = (categories: ConsentCategory[]) => {
    if (!manager.current) return;
    const saved = manager.current.save(categories);
    setAvailable(saved);
    setHasChoice(manager.current.choice !== null);
    if (saved) close();
    else if (!open) show();
  };
  const categories = [...new Set(services.map(service => service.category))];
  const buttonClass = 'rounded border border-slate-500 bg-white px-4 py-2 font-semibold text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';
  const buttons = <>
    <button type="button" className={buttonClass} onClick={() => save(categories)}>{fr ? 'Tout accepter' : 'Accept all'}</button>
    <button type="button" className={buttonClass} onClick={() => save([])}>{fr ? 'Tout refuser' : 'Reject all'}</button>
  </>;

  return <ConsentContext.Provider value={show}>
    {children}
    {ready && !hasChoice && !open && <section aria-label={fr ? 'Choix des cookies' : 'Cookie choices'} className="fixed inset-x-0 bottom-0 z-[80] border-t border-slate-400 bg-white p-5 text-slate-950 shadow-lg">
      <p>{fr ? 'Vous pouvez accepter, refuser ou personnaliser vos choix de cookies et continuer à naviguer à tout moment.' : 'You can accept, reject or customize your cookie choices and continue browsing at any time.'}</p>
      <div className="mt-3 flex flex-wrap gap-3">{buttons}<button type="button" className={buttonClass} onClick={show}>{fr ? 'Personnaliser' : 'Customize'}</button></div>
    </section>}
    <dialog ref={dialog} aria-labelledby="cookie-settings-title" aria-describedby="cookie-settings-description" onCancel={close} onClose={close} onKeyDown={keepDialogFocus} className="fixed max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-xl bg-white p-6 text-slate-950 shadow-xl backdrop:bg-black/50">
      <h2 id="cookie-settings-title" className="text-xl font-bold">{fr ? 'Gérer mes cookies' : 'Manage my cookies'}</h2>
      <p id="cookie-settings-description" className="mt-3">{fr ? 'Les mécanismes nécessaires à la connexion, à la sécurité et aux fonctionnalités demandées restent actifs. Les éléments d’affiliation sont exclus de ce gestionnaire.' : 'Mechanisms needed for sign-in, security and requested features remain active. Affiliate elements are outside this manager’s scope.'}</p>
      {services.length === 0 ? <p className="mt-4">{fr ? 'Aucun cookie facultatif n’est actuellement géré sur le site.' : 'No optional cookie is currently managed on this website.'}</p> : <>
        <p className="mt-3">{fr ? 'Acceptation et refus sont conservés six mois à compter du choix. Vous pouvez les modifier ou les retirer ici à tout moment.' : 'Acceptance and refusal are kept for six months from your choice. Change or withdraw them here at any time.'}</p>
        {categories.map(category => <fieldset key={category} className="mt-4 rounded border p-3">
          <legend className="px-1"><label className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(category)} onChange={event => setSelected(current => event.target.checked ? [...current, category] : current.filter(item => item !== category))} />{categoryText[category][fr ? 'fr' : 'en']}</label></legend>
          <ul>{services.filter(service => service.category === category).map(service => <li key={service.id}><strong>{service.name}</strong> — {service.purpose[fr ? 'fr' : 'en']}</li>)}</ul>
        </fieldset>)}
        <div className="mt-4 flex flex-wrap gap-3">{buttons}<button type="button" className={buttonClass} onClick={() => save(selected)}>{fr ? 'Enregistrer mes choix' : 'Save my choices'}</button></div>
      </>}
      {services.length === 0 && <div className="mt-4 flex flex-wrap gap-3">{buttons}</div>}
      {!available && <p role="status" className="mt-3">{fr ? 'Le choix ne peut pas être conservé dans ce navigateur. Les services facultatifs restent bloqués.' : 'Your choice cannot be stored in this browser. Optional services remain blocked.'}</p>}
      <button autoFocus type="button" className={`${buttonClass} mt-5`} onClick={close}>{fr ? 'Fermer' : 'Close'}</button>
    </dialog>
  </ConsentContext.Provider>;
}
