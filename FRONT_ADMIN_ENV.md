# Configuration front admin (.env)

Copiez en local / Vercel:

```env
NEXT_PUBLIC_API_URL=https://the-muscle-temple-api-1.onrender.com
API_BASE_URL=https://the-muscle-temple-api-1.onrender.com
ADMIN_AUTH_MODE=jwt
```

## Modes

- `jwt` (recommandé): login réel via `POST /admin-api/auth/login`, JWT stocké en cookie HttpOnly.
- `fallback-token`: mode transitoire; utilise d'abord le JWT session, sinon `ADMIN_ACCESS_TOKEN` + `ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- `dev-bypass`: uniquement dev/staging; bypass auth (jamais production).
