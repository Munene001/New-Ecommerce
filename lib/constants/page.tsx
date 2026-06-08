// lib/constants.ts
export const getBaseDomain = () => {
  if (typeof window === 'undefined') return '';
  // Use NEXT_PUBLIC_APP_URL in production, otherwise fallback to localhost
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return appUrl.replace(/^https?:\/\//, '');
};