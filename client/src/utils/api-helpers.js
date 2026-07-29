export function extractArray(response, key) {
  if (!response) return [];
  const data = response.data || response;
  if (Array.isArray(data)) return data;
  if (key && Array.isArray(data[key])) return data[key];
  const values = Object.values(data).find(v => Array.isArray(v));
  return values || [];
}

export function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}
