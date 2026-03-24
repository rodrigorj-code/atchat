import Message from "../models/Message";
import Ticket from "../models/Ticket";

/** Sequelize / MySQL podem devolver JSON como string. */
export const parseTicketDataWebhook = (data: unknown): Record<string, unknown> => {
  if (!data) return {};
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof data === "object" && !Array.isArray(data)) {
    return { ...(data as Record<string, unknown>) };
  }
  return {};
};

/**
 * Obtém o JID correto para enviar mensagens ao cliente.
 * Prioridade: dataWebhook.remoteJid → última mensagem do cliente → última mensagem qualquer.
 * Importante: em LID o número do contato pode estar errado; o remoteJid das mensagens é a fonte confiável.
 */
export const getTicketRemoteJid = async (ticket: Ticket): Promise<string | null> => {
  if (ticket.isGroup) {
    return null;
  }

  const dw = parseTicketDataWebhook(ticket.dataWebhook);
  const fromWebhook = dw.remoteJid;
  if (typeof fromWebhook === "string" && fromWebhook.includes("@")) {
    return fromWebhook;
  }

  const baseWhere = { ticketId: ticket.id, companyId: ticket.companyId };

  const fromClient = await Message.findOne({
    where: { ...baseWhere, fromMe: false },
    order: [["createdAt", "DESC"]],
    attributes: ["remoteJid"]
  });
  if (fromClient?.remoteJid && fromClient.remoteJid.includes("@")) {
    return fromClient.remoteJid;
  }

  const lastAny = await Message.findOne({
    where: baseWhere,
    order: [["createdAt", "DESC"]],
    attributes: ["remoteJid"]
  });
  if (lastAny?.remoteJid && lastAny.remoteJid.includes("@")) {
    return lastAny.remoteJid;
  }

  return null;
};
