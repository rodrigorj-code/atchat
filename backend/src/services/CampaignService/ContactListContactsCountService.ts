import AppError from "../../errors/AppError";
import ContactList from "../../models/ContactList";
import ContactListItem from "../../models/ContactListItem";

const ContactListContactsCountService = async (
  contactListId: string | number | undefined,
  companyId: number
): Promise<{ total: number; valid: number; invalid: number }> => {
  if (
    contactListId === undefined ||
    contactListId === null ||
    contactListId === ""
  ) {
    throw new AppError("ERR_CAMPAIGN_EMPTY_LIST", 400);
  }

  const list = await ContactList.findOne({
    where: { id: contactListId, companyId }
  });

  if (!list) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  const total = await ContactListItem.count({
    where: { contactListId }
  });

  const valid = await ContactListItem.count({
    where: { contactListId, isWhatsappValid: true }
  });

  return { total, valid, invalid: total - valid };
};

export default ContactListContactsCountService;
