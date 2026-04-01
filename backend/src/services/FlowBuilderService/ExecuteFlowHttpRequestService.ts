import axios, { AxiosError } from "axios";
import Ticket from "../../models/Ticket";
import Contact from "../../models/Contact";
import formatBody from "../../helpers/Mustache";
import { parseTicketDataWebhook } from "../../helpers/GetTicketRemoteJid";
import { logger } from "../../utils/logger";

const LOG_PREFIX = "[FlowBuilder][httpRequest]";

const MAX_TIMEOUT_MS = 60000;
const DEFAULT_TIMEOUT_MS = 10000;

export interface HttpRequestNodeData {
  method?: string;
  url?: string;
  headers?: { key: string; value: string }[];
  queryParams?: { key: string; value: string }[];
  bodyType?: "json" | "raw";
  body?: string;
  timeoutMs?: number;
  saveResponseMode?: "none" | "full" | "extract";
  saveResponseKey?: string;
  extractRules?: { key: string; path: string }[];
}

export interface ExecuteFlowHttpResult {
  outcome: "success" | "error";
  method: string;
  httpStatus: number | null;
  nextHandle: "success" | "error";
  extractedKeys: string[];
  urlForLog: string;
}

function getFlowVariablesFromTicket(
  ticket: Ticket | null
): Record<string, unknown> {
  if (!ticket?.dataWebhook) return {};
  const dw = parseTicketDataWebhook(ticket.dataWebhook);
  const v = dw.variables;
  if (v && typeof v === "object" && !Array.isArray(v)) {
    return v as Record<string, unknown>;
  }
  return {};
}

function replaceMessagesVars(
  variables: Record<string, unknown>,
  message: string
): string {
  if (!message || typeof message !== "string") return "";
  return message.replace(/{{\s*([^{}\s]+)\s*}}/g, (_match, key: string) => {
    const v = variables[key];
    if (v === undefined || v === null) return "";
    return String(v);
  });
}

function interpolateFlowString(
  raw: string,
  ticket: Ticket | null,
  contact: Contact | undefined | null
): string {
  const vars = getFlowVariablesFromTicket(ticket);
  const afterFlow = replaceMessagesVars(vars, raw);
  return formatBody(afterFlow, contact as Contact);
}

function assertSafeHttpUrl(urlStr: string): URL {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error("URL inválida");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Somente http e https são permitidos");
  }
  return u;
}

/** Path com pontos, ex.: customer.name */
export function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean);
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/** Log seguro: origem + path, sem query string completa. */
function safeUrlForLog(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

export function pickHttpRequestEdgeTarget(
  connects: Array<{
    source?: string;
    sourceHandle?: string | null;
    target?: string;
  }>,
  nodeId: string,
  outcome: "success" | "error"
): string | undefined {
  const handle = outcome === "success" ? "success" : "error";
  const fromNode = connects.filter(c => c.source === nodeId);
  let edge = fromNode.find(c => c.sourceHandle === handle);
  if (!edge) {
    edge = fromNode.find(c =>
      outcome === "success" ? c.sourceHandle === "a" : c.sourceHandle === "b"
    );
  }
  return edge?.target;
}

export async function executeFlowHttpRequestAndPersist({
  nodeData,
  ticketId,
  ticket,
  contact
}: {
  nodeData: HttpRequestNodeData;
  ticketId: number;
  ticket: Ticket;
  contact: Contact | null | undefined;
}): Promise<ExecuteFlowHttpResult> {
  const extractedKeys: string[] = [];
  let method = String(nodeData.method || "GET").toUpperCase();
  const allowed = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  if (!allowed.includes(method)) method = "GET";

  const rawUrl = (nodeData.url || "").trim();
  if (!rawUrl) {
    logger.warn(
      { flowHttpRequest: true, ticketId, err: "empty_url" },
      `${LOG_PREFIX} validação`
    );
    return {
      outcome: "error",
      method,
      httpStatus: null,
      nextHandle: "error",
      extractedKeys,
      urlForLog: ""
    };
  }

  let interpolatedUrl: string;
  try {
    interpolatedUrl = interpolateFlowString(rawUrl, ticket, contact);
  } catch (e) {
    logger.warn(
      { flowHttpRequest: true, ticketId, err: String(e) },
      `${LOG_PREFIX} interpolação URL`
    );
    return {
      outcome: "error",
      method,
      httpStatus: null,
      nextHandle: "error",
      extractedKeys,
      urlForLog: ""
    };
  }

  let urlObj: URL;
  try {
    urlObj = assertSafeHttpUrl(interpolatedUrl);
  } catch (e) {
    logger.warn(
      { flowHttpRequest: true, ticketId, err: String(e) },
      `${LOG_PREFIX} URL bloqueada ou inválida`
    );
    return {
      outcome: "error",
      method,
      httpStatus: null,
      nextHandle: "error",
      extractedKeys,
      urlForLog: interpolatedUrl.slice(0, 120)
    };
  }

  const headersList = Array.isArray(nodeData.headers) ? nodeData.headers : [];
  const headers: Record<string, string> = {};
  for (const h of headersList) {
    if (!h || typeof h.key !== "string") continue;
    const k = interpolateFlowString(h.key.trim(), ticket, contact);
    const v = interpolateFlowString(String(h.value ?? ""), ticket, contact);
    if (k) headers[k] = v;
  }

  const qp = Array.isArray(nodeData.queryParams) ? nodeData.queryParams : [];
  for (const q of qp) {
    if (!q || typeof q.key !== "string") continue;
    const k = interpolateFlowString(q.key.trim(), ticket, contact);
    const v = interpolateFlowString(String(q.value ?? ""), ticket, contact);
    if (k) urlObj.searchParams.set(k, v);
  }

  const timeoutMs = Math.min(
    MAX_TIMEOUT_MS,
    Math.max(1000, Number(nodeData.timeoutMs) || DEFAULT_TIMEOUT_MS)
  );

  const bodyType = nodeData.bodyType === "raw" ? "raw" : "json";
  let data: unknown = undefined;

  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const rawBody = nodeData.body != null ? String(nodeData.body) : "";
    const interpolatedBody = interpolateFlowString(rawBody, ticket, contact);
    if (bodyType === "json" && interpolatedBody.trim()) {
      try {
        data = JSON.parse(interpolatedBody);
      } catch {
        logger.warn(
          { flowHttpRequest: true, ticketId, err: "json_body_parse" },
          `${LOG_PREFIX} body JSON inválido após interpolação`
        );
        return {
          outcome: "error",
          method,
          httpStatus: null,
          nextHandle: "error",
          extractedKeys,
          urlForLog: safeUrlForLog(urlObj)
        };
      }
    } else if (interpolatedBody.length > 0) {
      data = interpolatedBody;
    }
  }

  const finalUrl = urlObj.toString();

  try {
    const axiosConfig: Record<string, unknown> = {
      method,
      url: finalUrl,
      headers,
      timeout: timeoutMs,
      maxRedirects: 5,
      validateStatus: () => true
    };
    if (method !== "GET" && method !== "HEAD") {
      axiosConfig.data = data;
    }

    const response = await axios(axiosConfig as any);

    const httpStatus = response.status;
    const ok = httpStatus >= 200 && httpStatus < 300;
    const outcome: "success" | "error" = ok ? "success" : "error";

    const responseBody = response.data;
    const mode = nodeData.saveResponseMode || "none";

    const prevDw = parseTicketDataWebhook(ticket.dataWebhook);
    const prevVars =
      prevDw.variables &&
      typeof prevDw.variables === "object" &&
      !Array.isArray(prevDw.variables)
        ? { ...(prevDw.variables as Record<string, unknown>) }
        : {};

    let shouldPersist = false;
    if (ok && mode === "full") {
      const key = (nodeData.saveResponseKey || "").trim();
      if (!key) {
        logger.warn(
          { flowHttpRequest: true, ticketId, err: "missing_saveResponseKey" },
          `${LOG_PREFIX} modo full sem chave`
        );
      } else {
        prevVars[key] = responseBody;
        shouldPersist = true;
      }
    } else if (ok && mode === "extract") {
      const rules = Array.isArray(nodeData.extractRules)
        ? nodeData.extractRules
        : [];
      const bodyForPath =
        typeof responseBody === "object" && responseBody !== null
          ? responseBody
          : {};
      for (const rule of rules) {
        if (!rule?.key?.trim() || !rule?.path?.trim()) continue;
        const val = getNestedValue(bodyForPath, rule.path.trim());
        prevVars[rule.key.trim()] = val;
        extractedKeys.push(rule.key.trim());
      }
      shouldPersist = extractedKeys.length > 0;
    }

    if (shouldPersist) {
      await ticket.update({
        dataWebhook: {
          ...prevDw,
          variables: prevVars
        } as any
      });
    }

    logger.info(
      {
        flowHttpRequest: true,
        ticketId,
        method,
        url: safeUrlForLog(urlObj),
        httpStatus,
        outcome,
        extractedKeys,
        nextHandle: outcome
      },
      `${LOG_PREFIX} resposta HTTP`
    );

    return {
      outcome,
      method,
      httpStatus,
      nextHandle: outcome,
      extractedKeys,
      urlForLog: safeUrlForLog(urlObj)
    };
  } catch (err: unknown) {
    const ax = err as AxiosError;
    const httpStatus =
      ax.response?.status != null ? ax.response.status : null;
    logger.warn(
      {
        flowHttpRequest: true,
        ticketId,
        method,
        url: safeUrlForLog(urlObj),
        httpStatus,
        outcome: "error",
        errMessage: (ax.message || String(err)).slice(0, 200)
      },
      `${LOG_PREFIX} falha de rede ou timeout`
    );
    return {
      outcome: "error",
      method,
      httpStatus,
      nextHandle: "error",
      extractedKeys,
      urlForLog: safeUrlForLog(urlObj)
    };
  }
}
