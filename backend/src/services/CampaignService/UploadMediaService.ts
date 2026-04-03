import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";

interface Request {
  id: number | string;
  companyId: number;
  mediaPath: string;
  mediaName: string;
}

const UploadMediaService = async ({
  id,
  companyId,
  mediaPath,
  mediaName
}: Request): Promise<Campaign> => {
  const campaign = await Campaign.findOne({
    where: { id, companyId }
  });

  if (!campaign) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  campaign.mediaPath = mediaPath;
  campaign.mediaName = mediaName;
  await campaign.save();

  return campaign;
};

export default UploadMediaService;
