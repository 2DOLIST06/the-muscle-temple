export const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || process.env.API_BASE_URL || 'https://the-muscle-temple-api-1.onrender.com';

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};
