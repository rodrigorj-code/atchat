import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import Tag from "../../models/Tag";
import AppError from "../../errors/AppError";

interface Request {
  contactId: number;
  tagId: number;
  companyId: number;
}

/**
 * Associa a tag ao ticket mais recente do contato (TicketTags existentes).
 */
const AddTagToContactService = async ({
  contactId,
  tagId,
  companyId
}: Request): Promise<TicketTag> => {
  const tag = await Tag.findOne({
    where: { id: tagId, companyId }
  });

  if (!tag) {
    throw new AppError("ERR_TAG_NOT_FOUND", 404);
  }

  const ticket = await Ticket.findOne({
    where: { contactId, companyId },
    order: [["updatedAt", "DESC"]],
    attributes: ["id"]
  });

  if (!ticket) {
    throw new AppError(
      "Não há atendimento (ticket) para este contato. Inicie uma conversa para poder usar tags.",
      400
    );
  }

  const [ticketTag] = await TicketTag.findOrCreate({
    where: { ticketId: ticket.id, tagId }
  });

  return ticketTag;
};

export default AddTagToContactService;
