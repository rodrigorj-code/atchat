import FlowExecutionLog from "../../models/FlowExecutionLog";
import { logger } from "../../utils/logger";

/** Eventos suportados na V1 (histórico de execução do FlowBuilder). */
export type FlowExecutionEventType =
  | "flow_started"
  | "node_executed"
  | "condition_evaluated"
  | "http_request_success"
  | "http_request_error"
  | "transferred_to_queue"
  | "transferred_to_attendant"
  | "ticket_closed"
  | "notification_sent"
  | "blacklist_changed"
  | "flowup_added"
  | "flow_stopped"
  | "flow_error";

export type FlowExecutionStatus = "ok" | "error" | "warning";

const MAX_DETAILS_CHARS = 4000;

function safeDetails(
  details?: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (details == null) return null;
  try {
    const s = JSON.stringify(details);
    if (s.length <= MAX_DETAILS_CHARS) return details;
    return {
      _truncated: true,
      preview: s.slice(0, MAX_DETAILS_CHARS - 80)
    };
  } catch {
    return { _error: "details_not_serializable" };
  }
}

export interface CreateFlowExecutionLogParams {
  ticketId: number;
  companyId: number;
  flowId: number;
  nodeId: string;
  nodeType: string;
  eventType: FlowExecutionEventType;
  status: FlowExecutionStatus;
  details?: Record<string, unknown> | null;
}

/**
 * Registra um evento de execução do fluxo (por ticket).
 * Falhas de persistência não devem interromper o fluxo — apenas logam warning.
 */
export async function createFlowExecutionLog(
  params: CreateFlowExecutionLogParams
): Promise<void> {
  try {
    await FlowExecutionLog.create({
      ticket_id: params.ticketId,
      company_id: params.companyId,
      flow_id: params.flowId,
      node_id: String(params.nodeId || "-").slice(0, 64),
      node_type: String(params.nodeType || "-").slice(0, 64),
      event_type: String(params.eventType).slice(0, 64),
      status: String(params.status).slice(0, 16),
      details: safeDetails(params.details)
    });
  } catch (err) {
    logger.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "[FlowExecutionLog] falha ao gravar evento"
    );
  }
}

/** Atalho: ignora se não houver ticketId (fluxo sem ticket). */
export async function createFlowExecutionLogIfTicket(
  ticketId: number | undefined,
  companyId: number,
  flowId: number,
  nodeId: string,
  nodeType: string,
  eventType: FlowExecutionEventType,
  status: FlowExecutionStatus,
  details?: Record<string, unknown> | null
): Promise<void> {
  if (!ticketId) return;
  await createFlowExecutionLog({
    ticketId,
    companyId,
    flowId,
    nodeId,
    nodeType,
    eventType,
    status,
    details
  });
}

export async function listFlowExecutionLogsByTicket(
  ticketId: number,
  companyId: number,
  limit = 500
): Promise<FlowExecutionLog[]> {
  return FlowExecutionLog.findAll({
    where: { ticket_id: ticketId, company_id: companyId },
    order: [["createdAt", "ASC"]],
    limit: Math.min(limit, 1000)
  });
}
