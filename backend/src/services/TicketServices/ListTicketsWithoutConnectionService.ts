import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";

interface Request {
  companyId: number;
}

interface Response {
  ticketIds: number[];
  count: number;
}

const CONNECTED_STATUS = "CONNECTED";

const ListTicketsWithoutConnectionService = async ({
  companyId
}: Request): Promise<Response> => {
  const connectedWhatsappIds = await Whatsapp.findAll({
    where: { companyId, status: CONNECTED_STATUS },
    attributes: ["id"]
  }).then((list) => list.map((w) => w.id));

  const whereCondition: any = {
    companyId,
    status: { [Op.in]: ["open", "pending"] }
  };
  if (connectedWhatsappIds.length > 0) {
    whereCondition.whatsappId = { [Op.notIn]: connectedWhatsappIds };
  }

  const tickets = await Ticket.findAll({
    where: whereCondition,
    attributes: ["id"]
  });

  const ticketIds = tickets.map((t) => t.id);
  return { ticketIds, count: ticketIds.length };
};

export default ListTicketsWithoutConnectionService;
