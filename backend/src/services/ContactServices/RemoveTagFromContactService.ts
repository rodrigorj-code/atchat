import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import AppError from "../../errors/AppError";

interface Request {
  contactId: number;
  tagId: number;
  companyId: number;
}

/**
 * Remove a tag de todos os tickets do contato (mantém consistência com a agregação na listagem).
 */
const RemoveTagFromContactService = async ({
  contactId,
  tagId,
  companyId
}: Request): Promise<void> => {
  const tickets = await Ticket.findAll({
    where: { contactId, companyId },
    attributes: ["id"]
  });

  if (!tickets.length) {
    throw new AppError(
      "Não há atendimento (ticket) para este contato.",
      400
    );
  }

  const ticketIds = tickets.map(t => t.id);

  await TicketTag.destroy({
    where: {
      tagId,
      ticketId: { [Op.in]: ticketIds }
    }
  });
};

export default RemoveTagFromContactService;
