import { Sequelize, Op, fn, col } from "sequelize";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import User from "../../models/User";
import Ticket from "../../models/Ticket";

interface Request {
  searchParam?: string;
  pageNumber?: string | number;
  companyId?: number;
}

interface Response {
  users: User[];
  count: number;
  hasMore: boolean;
}

const ListUsersService = async ({
  searchParam = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const term = (searchParam ?? "").trim().toLowerCase();

  const whereCondition: any = {
    companyId: {
      [Op.eq]: companyId
    }
  };

  if (term.length > 0) {
    whereCondition[Op.or] = [
      {
        "$User.name$": Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("User.name")),
          "LIKE",
          `%${term}%`
        )
      },
      { email: { [Op.like]: `%${term}%` } }
    ];
  }

  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const { count, rows: users } = await User.findAndCountAll({
    where: whereCondition,
    attributes: [
      "name",
      "id",
      "email",
      "companyId",
      "profile",
      "createdAt",
      "online"
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    distinct: true,
    include: [
      { model: Queue, as: "queues", attributes: ["id", "name", "color"] },
      { model: Company, as: "company", attributes: ["id", "name"] }
    ]
  });

  if (users.length > 0 && companyId !== undefined) {
    const ids = users.map(u => u.id);
    const ticketAgg = await Ticket.findAll({
      attributes: [
        "userId",
        [fn("COUNT", col("Ticket.id")), "ticketsAssignedCount"]
      ],
      where: {
        companyId,
        userId: { [Op.in]: ids }
      },
      group: ["userId"],
      raw: true
    });

    const countMap = new Map<number, number>();
    for (const row of ticketAgg as unknown as Array<{
      userId: number;
      ticketsAssignedCount: string;
    }>) {
      countMap.set(
        row.userId,
        Number(row.ticketsAssignedCount) || 0
      );
    }

    users.forEach(u => {
      (u as User & { setDataValue: (k: string, v: number) => void }).setDataValue(
        "ticketsAssignedCount",
        countMap.get(u.id) ?? 0
      );
    });
  }

  const hasMore = count > offset + users.length;

  return {
    users,
    count,
    hasMore
  };
};

export default ListUsersService;
