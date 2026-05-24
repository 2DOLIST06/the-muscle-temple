export class AdminApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.details = details;
  }
}

const mapStatusMessage = (status: number, fallback: string) => {
  if (status === 400) return 'Requête invalide. Vérifiez les champs saisis.';
  if (status === 401) return 'Session admin expirée. Reconnectez-vous.';
  if (status === 403) return 'Action refusée pour ce compte admin.';
  if (status === 503) return 'Backend admin indisponible. Vérifiez NEXT_PUBLIC_API_URL/API_BASE_URL.';
  if (status >= 500) return 'Erreur serveur. Réessayez dans quelques instants.';
  return fallback;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    cache: 'no-store'
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallback = (payload as { message?: string; error?: string }).message ?? (payload as { error?: string }).error ?? 'Erreur API.';
    throw new AdminApiError(mapStatusMessage(response.status, fallback), response.status, payload);
  }

  return payload as T;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
