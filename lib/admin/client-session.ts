const ADMIN_COOKIE_NAME = 'mt_admin_session';
const ADMIN_STORAGE_KEY = 'mt_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export const setAdminClientSession = (token: string) => {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ADMIN_STORAGE_KEY, token);
  document.cookie = `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
};

export const clearAdminClientSession = () => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ADMIN_STORAGE_KEY);
  document.cookie = `${ADMIN_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
};
