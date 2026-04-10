/**
 * URL base do Express (REST + /public + Socket.io).
 *
 * 1) REACT_APP_BACKEND_URL no .env (build) — URL completa, sem barra final.
 * 2) Se vazio: no navegador, mesmo protocolo/host da página + REACT_APP_BACKEND_PORT (padrão 8080).
 *
 * Importante: pedidos relativos na origem do SPA (ex.: só hostname:80) enviam POST para o Nginx
 * estático — rotas como /system-settings/branding devolvem 405. Sempre apontar para a porta do Node
 * ou configurar proxy Nginx para o backend.
 */
export function resolveBackendBaseURL() {
  const fromEnv = (process.env.REACT_APP_BACKEND_URL || "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined" && window.location?.hostname) {
    const port = String(process.env.REACT_APP_BACKEND_PORT || "8080").trim();
    const protocol = window.location.protocol || "http:";
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:${port}`;
  }

  return "";
}

export function getBackendBaseURL() {
  return resolveBackendBaseURL();
}

/**
 * Monta URL absoluta da API (ex.: http://host:8080/ticket/kanban).
 */
export function getApiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = resolveBackendBaseURL();
  if (!base) return p;
  return `${base.replace(/\/$/, "")}${p}`;
}
