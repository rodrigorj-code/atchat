import { Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";
import Company from "../../models/Company";

type Params = {
  companyId: string;
  userId: string;
};

const FindService = async ({ companyId, userId }: Params): Promise<QuickMessage[]> => {
  const notes: QuickMessage[] = await QuickMessage.findAll({
    where: {
      companyId,
      userId
    },
    attributes: [
      "id",
      "shortcode",
      "message",
      "category",
      "companyId",
      "userId",
      "createdAt",
      "updatedAt",
      "mediaPath",
      "mediaName"
    ],
    include: [{ model: Company, as: "company", attributes: ["id", "name"] }],
    order: [["shortcode", "ASC"]]
  });

  return notes;
};

export default FindService;
