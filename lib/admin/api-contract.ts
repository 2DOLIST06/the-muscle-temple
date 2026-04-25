export const extractToken = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const objectPayload = payload as { data?: { token?: unknown }; token?: unknown };
  const nested = objectPayload.data?.token;
  const direct = objectPayload.token;
  const token = typeof nested === 'string' ? nested : typeof direct === 'string' ? direct : null;
  return token && token.trim() ? token : null;
};

export const extractApiMessage = (payload: unknown, fallback: string): string => {
  if (!payload || typeof payload !== 'object') return fallback;
  const maybeMessage = (payload as { message?: unknown; error?: unknown }).message;
  if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
  const maybeError = (payload as { message?: unknown; error?: unknown }).error;
  if (typeof maybeError === 'string' && maybeError.trim()) return maybeError;
  return fallback;
};
