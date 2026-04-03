import { Op } from "sequelize";
import Campaign from "../../models/Campaign";
import CampaignProgressService from "./CampaignProgressService";

const MAX_BATCH = 50;

export type ProgressEntry = {
  total: number;
  sent: number;
  pending: number;
  failed: number;
};

const CampaignProgressBatchService = async (
  ids: number[],
  companyId: number
): Promise<{ progress: Record<string, ProgressEntry> }> => {
  if (!Array.isArray(ids) || ids.length === 0) {
    return { progress: {} };
  }

  const unique = [
    ...new Set(
      ids
        .map((n) => Number(n))
        .filter((n) => Number.isFinite(n) && n > 0)
    )
  ].slice(0, MAX_BATCH);

  if (unique.length === 0) {
    return { progress: {} };
  }

  const campaigns = await Campaign.findAll({
    where: { companyId, id: { [Op.in]: unique } },
    attributes: ["id"]
  });

  const allowed = new Set(campaigns.map((c) => c.id));

  const progress: Record<string, ProgressEntry> = {};

  for (const cid of allowed) {
    try {
      const p = await CampaignProgressService(cid, companyId);
      progress[String(cid)] = p;
    } catch {
      // campanha removida ou inconsistente — ignora entrada
    }
  }

  return { progress };
};

export default CampaignProgressBatchService;
