import { authProxy } from '@/lib/user/auth-proxy';
export const POST = (request: Request) => authProxy(request, '/api/auth/newsletter/account-link', false, false, false);
