import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ContactList from "../../models/ContactList";
import ContactListItem from "../../models/ContactListItem";
import Ticket from "../../models/Ticket";
import CreateService from "../ContactListItemService/CreateService";

export interface FlowUpAddResult {
  success: boolean;
  alreadyInList: boolean;
  contactListItemId?: number;
  contactId: number;
  contactNumber: string;
  contactListId: number;
  contactListName: string;
}

/**
 * Adiciona o contato do ticket à lista de contatos (remarketing / campanhas).
 * Usa o mesmo CreateService das telas (findOrCreate + validação de número).
 */
const AddContactToContactListFromTicketService = async ({
  ticketId,
  companyId,
  contactListId
}: {
  ticketId: number;
  companyId: number;
  contactListId: number;
}): Promise<FlowUpAddResult> => {
  const list = await ContactList.findOne({
    where: { id: contactListId, companyId }
  });
  if (!list) {
    throw new AppError("Lista de contatos não encontrada", 404);
  }

  const ticket = await Ticket.findOne({
    where: { id: ticketId, companyId },
    attributes: ["id", "contactId"]
  });
  if (!ticket?.contactId) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const contact = await Contact.findOne({
    where: { id: ticket.contactId, companyId }
  });
  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  const existing = await ContactListItem.findOne({
    where: {
      number: contact.number,
      companyId,
      contactListId
    }
  });
  const alreadyInList = !!existing;

  const nameForList =
    contact.name && contact.name.trim().length >= 3
      ? contact.name.trim()
      : contact.number;

  const record = await CreateService({
    name: nameForList,
    number: contact.number,
    email: contact.email || "",
    contactListId,
    companyId
  });

  return {
    success: true,
    alreadyInList,
    contactListItemId: record.id,
    contactId: contact.id,
    contactNumber: contact.number,
    contactListId: list.id,
    contactListName: list.name
  };
};

export default AddContactToContactListFromTicketService;
