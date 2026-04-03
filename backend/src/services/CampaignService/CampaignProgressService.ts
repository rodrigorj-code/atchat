import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";
import CampaignShipping from "../../models/CampaignShipping";
import ContactListItem from "../../models/ContactListItem";

const CampaignProgressService = async (
  id: string | number,
  companyId: number
): Promise<{
  total: number;
  sent: number;
  pending: number;
  failed: number;
}> => {
  const campaign = await Campaign.findOne({
    where: { id, companyId },
    attributes: ["id", "contactListId"]
  });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  if (!campaign.contactListId) {
    return { total: 0, sent: 0, pending: 0, failed: 0 };
  }

  const total = await ContactListItem.count({
    where: {
      contactListId: campaign.contactListId,
      isWhatsappValid: true
    }
  });

  const sent = await CampaignShipping.count({
    where: {
      campaignId: campaign.id,
      deliveredAt: { [Op.not]: null }
    }
  });

  const failed = await CampaignShipping.count({
    where: {
      campaignId: campaign.id,
      failedAt: { [Op.not]: null }
    }
  });

  const pending = Math.max(0, total - sent - failed);

  return { total, sent, pending, failed };
};

export default CampaignProgressService;
