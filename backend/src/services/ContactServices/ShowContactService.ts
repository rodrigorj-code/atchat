import Contact from "../../models/Contact";
import AppError from "../../errors/AppError";
import getTagsForContactIds, { ContactTagDto } from "./getTagsForContactIds";

const ShowContactService = async (
  id: string | number,
  companyId: number
): Promise<Record<string, unknown> & { tags: ContactTagDto[] }> => {
  const contact = await Contact.findByPk(id, { include: ["extraInfo", "whatsapp"] });

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (contact.companyId !== companyId) {
    throw new AppError("Não é possível excluir registro de outra empresa");
  }

  const tagsMap = await getTagsForContactIds([Number(id)], companyId);
  const tags = tagsMap.get(Number(id)) ?? [];

  return { ...contact.toJSON(), tags };
};

export default ShowContactService;
