import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";
import ContactListItem from "../../models/ContactListItem";

const CampaignContactsCountService = async (
  id: string | number,
  companyId: number
): Promise<{ total: number; valid: number; invalid: number }> => {
  const campaign = await Campaign.findOne({
    where: { id, companyId },
    attributes: ["id", "contactListId"]
  });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  if (!campaign.contactListId) {
    throw new AppError("ERR_CAMPAIGN_EMPTY_LIST", 400);
  }

  const total = await ContactListItem.count({
    where: { contactListId: campaign.contactListId }
  });

  const valid = await ContactListItem.count({
    where: {
      contactListId: campaign.contactListId,
      isWhatsappValid: true
    }
  });

  return { total, valid, invalid: total - valid };
};

export default CampaignContactsCountService;
