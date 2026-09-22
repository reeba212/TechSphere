export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

export const categoryLabel = (slug) =>
  !slug || slug === 'uncategorized'
    ? 'Uncategorized'
    : slug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

// Fetches JSON from the API and throws an Error(message) on a non-2xx response.
export const apiFetch = async (url, options) => {
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || 'Something went wrong');
  return data;
};
