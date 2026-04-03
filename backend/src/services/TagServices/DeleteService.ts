import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";
import Campaign from "../../models/Campaign";
import AppError from "../../errors/AppError";

const DeleteService = async (
  id: string | number,
  companyId: number
): Promise<void> => {
  const tag = await Tag.findOne({
    where: { id, companyId }
  });

  if (!tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  const ticketLinks = await TicketTag.count({
    where: { tagId: id }
  });

  const campaignLinks = await Campaign.count({
    where: { tagId: id }
  });

  if (ticketLinks > 0 || campaignLinks > 0) {
    throw new AppError(
      `Não é possível excluir: a tag está em uso (${ticketLinks} vínculo(s) em atendimentos, ${campaignLinks} em campanhas). Remova as etiquetas dos tickets/campanhas antes.`,
      400
    );
  }

  await tag.destroy();
};

export default DeleteService;
