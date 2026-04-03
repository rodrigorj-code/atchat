import { Sequelize, Op } from "sequelize";
import QuickMessage from "../../models/QuickMessage";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number | string;
  userId: number | string;
}

interface Response {
  records: QuickMessage[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId,
  userId
}: Request): Promise<Response> => {
  const term = (searchParam ?? "").toLowerCase().trim();

  const whereCondition: any = {
    companyId,
    userId
  };

  if (term.length > 0) {
    whereCondition[Op.or] = [
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("shortcode")),
        "LIKE",
        `%${term}%`
      ),
      Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("message")),
        "LIKE",
        `%${term}%`
      )
    ];
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: records } = await QuickMessage.findAndCountAll({
    where: whereCondition,
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
    limit,
    offset,
    order: [["shortcode", "ASC"]]
  });

  const hasMore = count > offset + records.length;

  return {
    records,
    count,
    hasMore
  };
};

export default ListService;
