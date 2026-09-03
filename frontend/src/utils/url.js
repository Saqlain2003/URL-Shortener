/**
 * Constructs the absolute URL for a shortened link.
 * Prioritizes VITE_API_BASE (backend server handling 302 redirects) or falls back to window.location.origin.
 */
export const getShortUrl = (shortCode) => {
  const base = import.meta.env.VITE_API_BASE || window.location.origin;
  return `${base}/${shortCode}`;
};
