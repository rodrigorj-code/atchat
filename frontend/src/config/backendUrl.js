/**
 * URL base do Express (REST + /public + Socket.io).
 *
 * 1) REACT_APP_BACKEND_URL no .env (build) — URL completa, se definida.
 * 2) Se vazio: no navegador, usa o mesmo protocolo/host da página + REACT_APP_BACKEND_PORT (padrão 8080).
 *    Evita o erro em que o axios ia para o Nginx e recebia index.html ("You need to enable JavaScript...").
 */
export function getBackendBaseURL() {
  const fromEnv = (process.env.REACT_APP_BACKEND_URL || "").trim();
  if (fromEnv) return fromEnv;

  if (typeof window !== "undefined" && window.location && window.location.hostname) {
    const port = String(process.env.REACT_APP_BACKEND_PORT || "8080").trim();
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}:${port}`;
  }

  return "";
}
