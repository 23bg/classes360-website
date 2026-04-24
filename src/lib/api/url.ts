const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:3000';

export const getApiBaseUrl = () => DEFAULT_API_BASE_URL.replace(/\/+$/, '');

export const getApiUrl = (path: string) => {
  if (!path) {
    return getApiBaseUrl();
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
};