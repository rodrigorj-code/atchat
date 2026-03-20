import { Op } from "sequelize";
import UserRating from "../../models/UserRating";

interface Request {
  companyId: number;
  dateFrom?: string;
  dateTo?: string;
  userId?: number;
  pageNumber?: number;
  limit?: number;
}

interface RatingItem {
  id: number;
  rate: number;
  createdAt: string;
  userId: number;
  userName: string;
  ticketId: number;
  ticketUuid: string;
  contactName: string;
  contactNumber: string;
  queueName?: string;
}

export default async function ListUserRatingsService({
  companyId,
  dateFrom,
  dateTo,
  userId,
  pageNumber = 1,
  limit = 50,
}: Request): Promise<{ ratings: RatingItem[]; count: number; hasMore: boolean }> {
  const offset = (pageNumber - 1) * limit;

  const whereCondition: any = { companyId };

  if (userId) {
    whereCondition.userId = userId;
  }

  if (dateFrom || dateTo) {
    whereCondition.createdAt = {};
    if (dateFrom) {
      whereCondition.createdAt[Op.gte] = `${dateFrom} 00:00:00`;
    }
    if (dateTo) {
      whereCondition.createdAt[Op.lte] = `${dateTo} 23:59:59`;
    }
  }

  const { count, rows } = await UserRating.findAndCountAll({
    where: whereCondition,
    include: [
      {
        association: "user",
        attributes: ["id", "name"],
        required: false,
      },
      {
        association: "ticket",
        attributes: ["id", "uuid"],
        required: true,
        include: [
          {
            association: "contact",
            attributes: ["id", "name", "number"],
            required: false,
          },
          {
            association: "queue",
            attributes: ["id", "name"],
            required: false,
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
  });

  const ratings: RatingItem[] = rows.map((r: any) => ({
    id: r.id,
    rate: r.rate,
    createdAt: r.createdAt,
    userId: r.userId,
    userName: r.user?.name || "-",
    ticketId: r.ticketId,
    ticketUuid: r.ticket?.uuid || "",
    contactName: r.ticket?.contact?.name || "-",
    contactNumber: r.ticket?.contact?.number || "-",
    queueName: r.ticket?.queue?.name || "-",
  }));

  const hasMore = offset + rows.length < count;

  return {
    ratings,
    count,
    hasMore,
  };
}
