export type ConsentCategory = 'statistics' | 'advertising' | 'preferences';
export type LocalizedText = { en: string; fr: string };
export type Service = {
  id: string;
  name: string;
  purpose: LocalizedText;
  category: ConsentCategory;
  disclosure: {
    provider: string;
    // State the actual duration for each key if the service uses different durations.
    retention: LocalizedText;
    privacyPolicyUrl?: string;
    // Third-party cookies are disclosed here, never passed to first-party cleanup.
    thirdPartyCookies?: readonly { name: string; domain: string; retention: LocalizedText }[];
  };
  resources: readonly string[];
  // Called only by ConsentManager after a persisted, valid choice. No module-level effects.
  activate: () => void;
  // Must cancel pending work and prevent further reads/writes/requests; otherwise return reload.
  stop: () => 'stopped' | 'reload';
  cleanup: {
    cookies: readonly { name: string; path: string; domain?: string }[];
    localStorage: readonly string[];
    sessionStorage: readonly string[];
  };
};

// Audited production inventory: no optional service outside affiliation is installed.
export const services: readonly Service[] = [];
// Bump whenever a purpose, resource, storage scope or implementation changes.
export const policyVersion = '2026-10-22.1';
export const categoryText: Record<ConsentCategory, LocalizedText> = {
  statistics: { fr: 'Statistiques : mesurer l’utilisation du site.', en: 'Statistics: measure website usage.' },
  advertising: { fr: 'Publicité : personnaliser ou mesurer les annonces.', en: 'Advertising: personalize or measure ads.' },
  preferences: { fr: 'Préférences facultatives : mémoriser des réglages de confort.', en: 'Optional preferences: remember convenience settings.' }
};
