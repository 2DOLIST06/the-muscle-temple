const API_DEFAULT_BASE_URL = 'https://the-muscle-temple-api-1.onrender.com';

export const getApiBaseUrl = () =>
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || API_DEFAULT_BASE_URL;

export const getPublicApiBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || API_DEFAULT_BASE_URL;

export const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};

export const buildPublicApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getPublicApiBaseUrl()}${normalizedPath}`;
};
