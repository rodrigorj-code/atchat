import { Op, fn, col } from "sequelize";
import Tag from "../../models/Tag";
import TicketTag from "../../models/TicketTag";

interface Request {
  companyId: number;
  searchParam?: string;
  pageNumber?: string | number;
}

interface Response {
  tags: any[];
  count: number;
  hasMore: boolean;
}

const LIMIT = 30;

const ListService = async ({
  companyId,
  searchParam,
  pageNumber = "1"
}: Request): Promise<Response> => {
  let whereCondition: any = {};

  if (searchParam) {
    const sp = searchParam.trim();
    whereCondition = {
      [Op.or]: [
        { name: { [Op.like]: `%${sp}%` } },
        { color: { [Op.like]: `%${sp}%` } }
      ]
    };
  }

  const limit = LIMIT;
  const offset = limit * (+pageNumber - 1);

  const count = await Tag.count({
    where: { ...whereCondition, companyId }
  });

  const rows = await Tag.findAll({
    where: { ...whereCondition, companyId },
    attributes: [
      "id",
      "name",
      "color",
      "createdAt",
      "updatedAt",
      "kanban",
      "companyId"
    ],
    order: [["name", "ASC"]],
    limit,
    offset
  });

  const ids = rows.map(r => r.id);
  const usageMap = new Map<number, number>();

  if (ids.length) {
    const usageAgg = await TicketTag.findAll({
      attributes: [
        "tagId",
        [fn("COUNT", col("ticketId")), "usageCount"]
      ],
      where: { tagId: { [Op.in]: ids } },
      group: ["tagId"],
      raw: true
    });

    for (const row of usageAgg as any[]) {
      const tid = row.tagId;
      const c = row.usageCount ?? 0;
      usageMap.set(tid, Number(c));
    }
  }

  const tags = rows.map(r => {
    const u = usageMap.get(r.id) || 0;
    const plain = r.toJSON();
    return {
      ...plain,
      usageCount: u,
      ticketsCount: u
    };
  });

  const hasMore = count > offset + rows.length;

  return {
    tags,
    count,
    hasMore
  };
};

export default ListService;
