export const ADMIN_COOKIE_NAME = 'mt_admin_session';
export const ADMIN_LOGIN_DISABLED = process.env.ADMIN_LOGIN_DISABLED !== 'false';

export async function isAdminAuthenticated() {
  return true;
}
