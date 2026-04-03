import { Op } from "sequelize";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";
import Tag from "../../models/Tag";

export type ContactTagDto = { id: number; name: string; color: string };

/**
 * Agrega tags distintas de todos os tickets do contato (mesmo modelo usado em campanhas/tickets).
 */
const getTagsForContactIds = async (
  contactIds: number[],
  companyId: number
): Promise<Map<number, ContactTagDto[]>> => {
  const out = new Map<number, ContactTagDto[]>();
  if (!contactIds.length) return out;

  const tickets = await Ticket.findAll({
    where: { contactId: { [Op.in]: contactIds }, companyId },
    attributes: ["id", "contactId"]
  });

  const ticketIds = tickets.map(t => t.id);
  const ticketToContact = new Map(tickets.map(t => [t.id, t.contactId]));

  if (!ticketIds.length) {
    contactIds.forEach(id => out.set(id, []));
    return out;
  }

  const ticketTags = await TicketTag.findAll({
    where: { ticketId: { [Op.in]: ticketIds } },
    include: [
      {
        model: Tag,
        where: { companyId },
        attributes: ["id", "name", "color"],
        required: true
      }
    ]
  });

  const byContact = new Map<number, Map<number, ContactTagDto>>();
  for (const tt of ticketTags) {
    const cid = ticketToContact.get(tt.ticketId);
    if (!cid || !tt.tag) continue;
    if (!byContact.has(cid)) byContact.set(cid, new Map());
    byContact.get(cid)!.set(tt.tag.id, {
      id: tt.tag.id,
      name: tt.tag.name,
      color: tt.tag.color
    });
  }

  for (const cid of contactIds) {
    const map = byContact.get(cid);
    const arr = map ? [...map.values()].sort((a, b) => a.name.localeCompare(b.name)) : [];
    out.set(cid, arr);
  }

  return out;
};

export default getTagsForContactIds;
