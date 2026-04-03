import { QueryTypes } from "sequelize";
import AppError from "../../errors/AppError";
import sequelize from "../../database";
import Contact from "../../models/Contact";
import ContactList from "../../models/ContactList";
import ContactListItem from "../../models/ContactListItem";
import Tag from "../../models/Tag";
import Ticket from "../../models/Ticket";
import TicketTag from "../../models/TicketTag";

const TagEstimateService = async (
  tagId: number,
  companyId: number,
  contactListId?: number | null
): Promise<{ total: number; valid: number; invalid: number }> => {
  const tag = await Tag.findOne({
    where: { id: tagId, companyId }
  });

  if (!tag) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  const tagCountRows = (await sequelize.query(
    `SELECT COUNT(DISTINCT t."contactId")::int AS c
     FROM "TicketTags" tt
     INNER JOIN "Tickets" t ON t.id = tt."ticketId"
     WHERE tt."tagId" = :tagId AND t."companyId" = :companyId`,
    {
      replacements: { tagId, companyId },
      type: QueryTypes.SELECT
    }
  )) as { c: number }[];

  const tagOnlyTotal = Number(tagCountRows[0]?.c ?? 0);

  if (!contactListId) {
    return {
      total: tagOnlyTotal,
      valid: tagOnlyTotal,
      invalid: 0
    };
  }

  const list = await ContactList.findOne({
    where: { id: contactListId, companyId }
  });

  if (!list) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  const listItems = await ContactListItem.findAll({
    where: { contactListId },
    attributes: ["number", "isWhatsappValid"]
  });

  const ticketTags = await TicketTag.findAll({ where: { tagId } });
  const ticketIds = ticketTags.map((tt) => tt.ticketId);

  const tickets = await Ticket.findAll({
    where: {
      id: ticketIds,
      companyId
    },
    attributes: ["contactId"]
  });

  const contactIds = [...new Set(tickets.map((t) => t.contactId))];

  const tagContacts =
    contactIds.length > 0
      ? await Contact.findAll({
          where: { id: contactIds },
          attributes: ["number"]
        })
      : [];

  const map = new Map<
    string,
    { valid: boolean }
  >();

  for (const li of listItems) {
    map.set(li.number, { valid: Boolean(li.isWhatsappValid) });
  }

  for (const c of tagContacts) {
    if (!map.has(c.number)) {
      map.set(c.number, { valid: true });
    }
  }

  let total = 0;
  let valid = 0;
  let invalid = 0;

  for (const [, v] of map) {
    total += 1;
    if (v.valid) {
      valid += 1;
    } else {
      invalid += 1;
    }
  }

  return { total, valid, invalid };
};

export default TagEstimateService;
