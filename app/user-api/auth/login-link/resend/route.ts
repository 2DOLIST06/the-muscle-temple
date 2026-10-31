import { authProxy } from '@/lib/user/auth-proxy';
export const POST = (request: Request) => authProxy(request, '/api/auth/login-link/resend', false, false, false);
