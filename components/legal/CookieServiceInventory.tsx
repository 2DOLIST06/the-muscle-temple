import { categoryText, services, type Service } from '@/lib/consent/registry';
import type { Locale } from '@/lib/i18n/routing';

// Reads declarations only; never invokes activate, stop, cleanup or browser storage.
export function CookieServiceInventory({ locale, registry = services }: { locale: Locale; registry?: readonly Service[] }) {
  const fr = locale === 'fr';
  return <>
    {registry.length === 0 ? <p>{fr
      ? 'Aucun service facultatif de statistiques, publicité ou préférences n’est actuellement déclaré dans ce registre.'
      : 'No optional statistics, advertising or preference service is currently declared in this registry.'}</p>
      : registry.map(service => <section key={service.id} className="mt-4 rounded border border-slate-200 p-4">
        <h4 className="font-semibold">{service.name}</h4>
        <dl className="mt-2 space-y-2 break-words">
          <div><dt className="font-semibold">{fr ? 'Fournisseur' : 'Provider'}</dt><dd>{service.disclosure.provider}</dd></div>
          <div><dt className="font-semibold">{fr ? 'Catégorie et finalité' : 'Category and purpose'}</dt><dd>{categoryText[service.category][locale]} {service.purpose[locale]}</dd></div>
          <div><dt className="font-semibold">{fr ? 'Conservation' : 'Retention'}</dt><dd>{service.disclosure.retention[locale]}</dd></div>
          <div><dt className="font-semibold">{fr ? 'Cookies propriétaires déclarés' : 'Declared first-party cookies'}</dt><dd>{service.cleanup.cookies.length ? <ul>{service.cleanup.cookies.map(cookie => <li key={`${cookie.name}:${cookie.path}:${cookie.domain}`}><code>{cookie.name}</code> — {fr ? 'chemin' : 'path'} : {cookie.path}, {fr ? 'domaine' : 'domain'} : {cookie.domain ?? (fr ? 'hôte courant' : 'current host')}</li>)}</ul> : (fr ? 'Aucun déclaré.' : 'None declared.')}</dd></div>
          <div><dt className="font-semibold">{fr ? 'Stockage local et de session déclaré' : 'Declared local and session storage'}</dt><dd>{[...service.cleanup.localStorage.map(name => `localStorage: ${name}`), ...service.cleanup.sessionStorage.map(name => `sessionStorage: ${name}`)].join('; ') || (fr ? 'Aucun déclaré.' : 'None declared.')}</dd></div>
          {!!service.disclosure.thirdPartyCookies?.length && <div><dt className="font-semibold">{fr ? 'Cookies de domaines tiers (non supprimables ici)' : 'Third-party domain cookies (cannot be deleted here)'}</dt><dd><ul>{service.disclosure.thirdPartyCookies.map(cookie => <li key={`${cookie.domain}:${cookie.name}`}><code>{cookie.name}</code> — {cookie.domain} — {cookie.retention[locale]}</li>)}</ul></dd></div>}
          <div><dt className="font-semibold">{fr ? 'Ressources déclarées' : 'Declared resources'}</dt><dd>{service.resources.join('; ') || (fr ? 'Aucune ressource externe déclarée.' : 'No external resource declared.')}</dd></div>
          {service.disclosure.privacyPolicyUrl && <div><dt className="font-semibold">{fr ? 'Informations du fournisseur' : 'Provider information'}</dt><dd><a className="underline" href={service.disclosure.privacyPolicyUrl} target="_blank" rel="noopener noreferrer">{fr ? 'Politique de confidentialité du fournisseur' : 'Provider privacy policy'}</a></dd></div>}
        </dl>
        <p className="mt-3">{fr ? 'Ce service nécessite votre accord préalable. Vous pouvez le refuser ou retirer votre accord via « Gérer mes cookies » dans le pied de page.' : 'This service requires your prior consent. Reject or withdraw consent through “Manage my cookies” in the footer.'}</p>
      </section>)}
    <p>{fr ? 'Cette liste est mise à jour lorsque de nouveaux services sont ajoutés au gestionnaire.' : 'This list is updated when new services are added to the cookie manager.'}</p>
  </>;
}
