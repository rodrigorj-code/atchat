/**
 * Importação / exportação de fluxo (V1) — JSON compatível com nodes + connections atuais.
 */

export const FLOW_EXPORT_FORMAT = "flowbuilder-export";
export const FLOW_EXPORT_VERSION = 1;

/**
 * Remove funções e referências não serializáveis (ex.: data.onRemove nas edges).
 */
function sanitizeNodes(nodes) {
  if (!Array.isArray(nodes)) return [];
  return JSON.parse(JSON.stringify(nodes));
}

function sanitizeConnections(connections) {
  if (!Array.isArray(connections)) return [];
  const raw = connections.map((c) => {
    const next = {
      id: c.id,
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle ?? undefined,
      targetHandle: c.targetHandle ?? undefined,
      type: c.type || "buttonedge",
    };
    if (c.data && typeof c.data === "object") {
      const { onRemove, ...rest } = c.data;
      if (Object.keys(rest).length > 0) next.data = rest;
    }
    if (c.style) next.style = c.style;
    if (c.animated !== undefined) next.animated = c.animated;
    return next;
  });
  return JSON.parse(JSON.stringify(raw));
}

/**
 * Monta o objeto exportado (download .json).
 */
export function buildFlowExportFile(flowName, nodes, connections) {
  const name = (flowName || "").trim() || "Fluxo sem nome";
  return {
    format: FLOW_EXPORT_FORMAT,
    version: FLOW_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    name,
    nodes: sanitizeNodes(nodes),
    connections: sanitizeConnections(connections),
  };
}

/**
 * Valida e normaliza payload importado.
 * Aceita formato completo (export) ou legado com apenas nodes + connections.
 * @returns {{ ok: true, name: string, nodes: array, connections: array } | { ok: false, error: string }}
 */
export function parseAndValidateFlowImport(raw) {
  if (raw == null || typeof raw !== "object") {
    return { ok: false, error: "O arquivo não contém um objeto JSON válido." };
  }

  let nodes = raw.nodes;
  let connections = raw.connections;
  let name = raw.name;

  if (nodes == null && raw.flow != null && typeof raw.flow === "object") {
    nodes = raw.flow.nodes;
    connections = raw.flow.connections ?? raw.connections;
  }

  if (!Array.isArray(nodes)) {
    return { ok: false, error: 'O JSON precisa conter "nodes" como array.' };
  }
  if (!Array.isArray(connections)) {
    return { ok: false, error: 'O JSON precisa conter "connections" como array.' };
  }
  if (nodes.length < 1) {
    return { ok: false, error: "É necessário ao menos um nó no fluxo." };
  }

  const safeName =
    typeof name === "string" && name.trim().length >= 2
      ? name.trim()
      : "Fluxo importado";

  return {
    ok: true,
    name: safeName,
    nodes: sanitizeNodes(nodes),
    connections: sanitizeConnections(connections),
  };
}

/**
 * Lê arquivo .json e retorna resultado da validação ou erro de parse.
 */
export function readFlowImportFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve({ ok: false, error: "Nenhum arquivo selecionado." });
      return;
    }
    const lower = (file.name || "").toLowerCase();
    if (!lower.endsWith(".json") && file.type && file.type !== "application/json") {
      resolve({ ok: false, error: "Use apenas arquivos .json." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || "");
        const parsed = JSON.parse(text);
        const result = parseAndValidateFlowImport(parsed);
        resolve(result);
      } catch (e) {
        resolve({
          ok: false,
          error:
            "Não foi possível ler o JSON. Verifique se o arquivo está correto.",
        });
      }
    };
    reader.onerror = () =>
      resolve({ ok: false, error: "Erro ao ler o arquivo." });
    reader.readAsText(file, "UTF-8");
  });
}

export function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name) {
  return String(name || "fluxo")
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80);
}
