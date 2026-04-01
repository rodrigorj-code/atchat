import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";

interface Request {
  contactId: number;
  companyId: number;
  disableBot: boolean;
}

/**
 * Define explicitamente `disableBot` no contato (blacklist do bot / automações).
 * Diferente de ToggleDisableBotContactService, que apenas alterna o valor.
 */
const SetContactDisableBotService = async ({
  contactId,
  companyId,
  disableBot
}: Request): Promise<Contact> => {
  const contact = await Contact.findOne({
    where: { id: contactId, companyId }
  });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  await contact.update({ disableBot });

  await contact.reload({
    attributes: [
      "id",
      "name",
      "number",
      "email",
      "companyId",
      "disableBot"
    ]
  });

  return contact;
};

export default SetContactDisableBotService;
