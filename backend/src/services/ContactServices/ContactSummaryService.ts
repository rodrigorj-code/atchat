import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import Message from "../../models/Message";
import AppError from "../../errors/AppError";

interface Response {
  totalTickets: number;
  lastInteraction: string | null;
  lastMessage: string | null;
}

const ContactSummaryService = async (
  contactId: number,
  companyId: number
): Promise<Response> => {
  const contact = await Contact.findOne({
    where: { id: contactId, companyId },
    attributes: ["id"]
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const totalTickets = await Ticket.count({
    where: { contactId, companyId }
  });

  const lastMessageRow = await Message.findOne({
    where: { contactId, companyId },
    order: [["createdAt", "DESC"]],
    attributes: ["body", "createdAt"]
  });

  const lastTicketRow = await Ticket.findOne({
    where: { contactId, companyId },
    order: [["updatedAt", "DESC"]],
    attributes: ["updatedAt"]
  });

  const msgAt = lastMessageRow?.createdAt
    ? new Date(lastMessageRow.createdAt).getTime()
    : 0;
  const ticketAt = lastTicketRow?.updatedAt
    ? new Date(lastTicketRow.updatedAt).getTime()
    : 0;

  let lastInteraction: string | null = null;
  if (msgAt > 0 || ticketAt > 0) {
    lastInteraction = new Date(Math.max(msgAt, ticketAt)).toISOString();
  }

  let lastMessage: string | null = null;
  if (lastMessageRow?.body) {
    const t = String(lastMessageRow.body).trim();
    lastMessage = t.length > 200 ? `${t.slice(0, 200)}…` : t;
  }

  return {
    totalTickets,
    lastInteraction,
    lastMessage
  };
};

export default ContactSummaryService;
