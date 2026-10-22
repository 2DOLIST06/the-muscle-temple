'use client';

import { createContext, useContext, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
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
  const buttonClass = 'inline-flex min-h-11 items-center justify-center rounded-full border border-brand-700 bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-500 hover:shadow-md motion-reduce:transform-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500';
  const secondaryButtonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';
  const buttons = <>
    <button type="button" className={buttonClass} onClick={() => save(categories)}>{fr ? 'Tout accepter' : 'Accept all'}</button>
    <button type="button" className={buttonClass} onClick={() => save([])}>{fr ? 'Tout refuser' : 'Reject all'}</button>
  </>;

  return <ConsentContext.Provider value={show}>
    {children}
    {ready && !hasChoice && !open && <section aria-label={fr ? 'Choix des cookies' : 'Cookie choices'} className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-[960px] rounded-[28px] border border-slate-200/80 bg-white p-5 text-slate-950 shadow-[0_12px_64px_-12px_rgba(22,42,99,0.28)] sm:inset-x-6 sm:bottom-6 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-center lg:gap-8">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand-50 ring-1 ring-slate-200 sm:h-14 sm:w-14">
            <Image src="/logo-BTG.svg" alt="Body Training Guide" fill sizes="56px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">{fr ? 'Votre confidentialité' : 'Your privacy'}</p>
            <h2 className="mt-1 text-lg font-bold tracking-tight sm:text-xl">{fr ? 'Vos cookies, votre choix.' : 'Your cookies, your choice.'}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{fr ? 'Choisissez vos préférences et poursuivez votre visite. Vous pourrez changer d’avis à tout moment.' : 'Choose your preferences and keep exploring. You can change your mind at any time.'}</p>
            <Link href={fr ? '/fr/cookies' : '/cookies'} className="mt-1 inline-flex min-h-6 items-center text-xs font-medium text-brand-700 underline decoration-slate-300 underline-offset-4 transition hover:decoration-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">{fr ? 'Politique cookies' : 'Cookie policy'}</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {buttons}
          <button type="button" className={`${secondaryButtonClass} col-span-2`} onClick={show}>
            <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4"><path d="M3 5h14M3 10h14M3 15h14" /><path d="M7 3v4M13 8v4M8 13v4" strokeWidth="3" /></svg>
            {fr ? 'Personnaliser' : 'Customize'}
          </button>
        </div>
      </div>
    </section>}
    <dialog ref={dialog} aria-labelledby="cookie-settings-title" aria-describedby="cookie-settings-description" onCancel={close} onClose={close} onKeyDown={keepDialogFocus} className="fixed max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-auto rounded-[28px] border border-slate-200 bg-white p-6 text-slate-950 shadow-2xl backdrop:bg-slate-950/40 backdrop:backdrop-blur-sm sm:p-8">
      <div className="flex items-center gap-3">
        <Image src="/logo-BTG.svg" alt="" width={48} height={48} className="rounded-full ring-1 ring-slate-200" />
        <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-700">Body Training Guide</p><h2 id="cookie-settings-title" className="mt-1 text-xl font-bold tracking-tight">{fr ? 'Gérer mes cookies' : 'Manage my cookies'}</h2></div>
      </div>
      <p id="cookie-settings-description" className="mt-5 text-sm leading-6 text-slate-600">{fr ? 'Les cookies nécessaires à la connexion, à la sécurité et aux fonctionnalités demandées restent actifs.' : 'Cookies needed for sign-in, security and requested features remain active.'}</p>
      {services.length === 0 ? <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6">{fr ? 'Aucun cookie facultatif n’est actuellement géré sur le site.' : 'No optional cookie is currently managed on this website.'}</p> : <>
        <p className="mt-3 text-sm leading-6 text-slate-600">{fr ? 'Acceptation et refus sont conservés six mois à compter du choix. Vous pouvez les modifier ou les retirer ici à tout moment.' : 'Acceptance and refusal are kept for six months from your choice. Change or withdraw them here at any time.'}</p>
        {categories.map(category => <fieldset key={category} className="mt-4 rounded-2xl border border-slate-200 p-4">
          <legend className="px-1"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-brand-700" checked={selected.includes(category)} onChange={event => setSelected(current => event.target.checked ? [...current, category] : current.filter(item => item !== category))} />{categoryText[category][fr ? 'fr' : 'en']}</label></legend>
          <ul>{services.filter(service => service.category === category).map(service => <li key={service.id}><strong>{service.name}</strong> — {service.purpose[fr ? 'fr' : 'en']}</li>)}</ul>
        </fieldset>)}
        <div className="mt-6 grid grid-cols-2 gap-3">{buttons}<button type="button" className={`${secondaryButtonClass} col-span-2`} onClick={() => save(selected)}>{fr ? 'Enregistrer mes choix' : 'Save my choices'}</button></div>
      </>}
      {services.length === 0 && <div className="mt-6 grid grid-cols-2 gap-3">{buttons}</div>}
      {!available && <p role="status" className="mt-3">{fr ? 'Le choix ne peut pas être conservé dans ce navigateur. Les services facultatifs restent bloqués.' : 'Your choice cannot be stored in this browser. Optional services remain blocked.'}</p>}
      <button autoFocus type="button" className={`${secondaryButtonClass} mt-3 w-full`} onClick={close}>{fr ? 'Fermer' : 'Close'}</button>
    </dialog>
  </ConsentContext.Provider>;
}
