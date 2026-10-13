// # Runtime assets follow the same base path as Vite, including GitHub project sites.
export function assetUrl(path: string, base = import.meta.env?.BASE_URL ?? '/') {
  return `${base.endsWith('/') ? base : `${base}/`}${path.replace(/^\/+/, '')}`;
}
