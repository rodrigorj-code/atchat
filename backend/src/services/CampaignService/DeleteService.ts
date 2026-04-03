import Campaign from "../../models/Campaign";
import AppError from "../../errors/AppError";

const DeleteService = async (
  id: string,
  companyId: number
): Promise<void> => {
  const record = await Campaign.findOne({
    where: { id, companyId }
  });

  if (!record) {
    throw new AppError("ERR_CAMPAIGN_NOT_FOUND", 404);
  }

  if (record.status === "EM_ANDAMENTO") {
    throw new AppError("ERR_CAMPAIGN_INVALID_STATUS", 400);
  }

  await record.destroy();
};

export default DeleteService;
