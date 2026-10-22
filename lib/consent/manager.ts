import type { ConsentCategory, Service } from './registry.ts';

export const CONSENT_KEY = 'btg_consent';
type Choice = { categories: ConsentCategory[]; chosenAt: string; version: string };
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;
export type ConsentEnvironment = {
  storage: () => StoragePort;
  now: () => Date;
  cleanup: (service: Service) => void;
  reload: () => void;
};

export function expiresAt(chosenAt: string) {
  const date = new Date(chosenAt);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.getTime();
}

// Registry changes also invalidate old choices even if a developer forgets to bump the version.
export function registryVersion(services: readonly Service[], policy: string) {
  return JSON.stringify([policy, services.map(({ id, category, purpose, resources, cleanup }) => ({ id, category, purpose, resources, cleanup }))]);
}

export function parseChoice(raw: string | null, version: string, categories: readonly ConsentCategory[], now: Date): Choice | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || value.version !== version || !Array.isArray(value.categories)
      || typeof value.chosenAt !== 'string' || !Number.isFinite(Date.parse(value.chosenAt))
      || new Date(value.chosenAt).toISOString() !== value.chosenAt
      || Date.parse(value.chosenAt) > now.getTime() || expiresAt(value.chosenAt) <= now.getTime()
      || value.categories.some((category: unknown) => !categories.includes(category as ConsentCategory))
      || new Set(value.categories).size !== value.categories.length) return null;
    return { categories: value.categories, chosenAt: value.chosenAt, version };
  } catch { return null; }
}

export class ConsentManager {
  readonly categories: ConsentCategory[];
  readonly version: string;
  choice: Choice | null = null;
  storageAvailable = true;
  private active = new Set<string>();
  private reloadPending = false;
  private persistenceFailed = false;
  readonly services: readonly Service[];
  private env: ConsentEnvironment;

  constructor(services: readonly Service[], policy: string, env: ConsentEnvironment) {
    this.services = services;
    this.env = env;
    this.categories = [...new Set(services.map(service => service.category))];
    this.version = registryVersion(services, policy);
    const ids = new Set<string>();
    const protectedKeys = ['user_jwt', 'admin_jwt', 'adminToken', 'mt_admin_posts', 'admin-header-hidden', CONSENT_KEY];
    for (const service of services) {
      if (!service.id || ids.has(service.id) || !['statistics', 'advertising', 'preferences'].includes(service.category)
        || [...service.cleanup.localStorage, ...service.cleanup.sessionStorage, ...service.cleanup.cookies.map(cookie => cookie.name)]
          .some(key => !key || protectedKeys.includes(key))) throw new Error('Invalid optional service declaration');
      ids.add(service.id);
    }
  }

  refresh() {
    if (this.persistenceFailed) { this.choice = null; this.reconcile(); return; }
    try {
      this.choice = parseChoice(this.env.storage().getItem(CONSENT_KEY), this.version, this.categories, this.env.now());
      this.storageAvailable = true;
    } catch { this.choice = null; this.storageAvailable = false; this.persistenceFailed = true; }
    this.reconcile();
  }

  save(categories: readonly ConsentCategory[]) {
    const choice: Choice = {
      categories: this.categories.filter(category => categories.includes(category)),
      chosenAt: this.env.now().toISOString(), version: this.version
    };
    try {
      const storage = this.env.storage();
      storage.setItem(CONSENT_KEY, JSON.stringify(choice));
      // Read back: a silently failing storage must never authorize activation.
      this.choice = parseChoice(storage.getItem(CONSENT_KEY), this.version, this.categories, this.env.now());
      this.storageAvailable = this.choice !== null && JSON.stringify(this.choice) === JSON.stringify(choice);
      if (!this.storageAvailable) this.choice = null;
    } catch { this.choice = null; this.storageAvailable = false; }
    this.persistenceFailed = !this.storageAvailable;
    this.reconcile();
    return this.storageAvailable;
  }

  private reconcile() {
    const allowed = new Set(this.choice?.categories ?? []);
    for (const service of this.services) {
      if (allowed.has(service.category)) continue;
      if (this.active.delete(service.id)) {
        try { if (service.stop() !== 'stopped') this.reloadPending = true; }
        catch { this.reloadPending = true; }
      }
      // Exact declared keys only, including stale storage left by a previous page load.
      try { this.env.cleanup(service); } catch { /* Third-party/blocked storage may be inaccessible. */ }
    }
    if (this.reloadPending) { this.env.reload(); return; }
    for (const service of this.services) {
      if (!allowed.has(service.category) || this.active.has(service.id)) continue;
      this.active.add(service.id);
      try { service.activate(); }
      catch {
        this.active.delete(service.id);
        try { if (service.stop() !== 'stopped') this.reloadPending = true; }
        catch { this.reloadPending = true; }
        try { this.env.cleanup(service); } catch { /* Best effort. */ }
      }
    }
    if (this.reloadPending) this.env.reload();
  }
}

export function cleanupBrowserService(service: Service) {
  for (const cookie of service.cleanup.cookies) {
    try {
      document.cookie = `${encodeURIComponent(cookie.name)}=; Max-Age=0; Path=${cookie.path}${cookie.domain ? `; Domain=${cookie.domain}` : ''}; SameSite=Lax`;
    } catch { /* Cannot delete HttpOnly or cookies on third-party domains. */ }
  }
  for (const [kind, keys] of [['localStorage', service.cleanup.localStorage], ['sessionStorage', service.cleanup.sessionStorage]] as const) {
    for (const key of keys) { try { window[kind].removeItem(key); } catch { /* Best effort per key. */ } }
  }
}
