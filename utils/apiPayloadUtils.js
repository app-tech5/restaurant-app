export function normalizeOrdersPayload(raw) {
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return { data: list };
}
