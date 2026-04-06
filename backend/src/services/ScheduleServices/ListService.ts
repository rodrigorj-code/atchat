import { Op, Sequelize } from "sequelize";
import Contact from "../../models/Contact";
import Schedule from "../../models/Schedule";
import User from "../../models/User";
import Whatsapp from "../../models/Whatsapp";
import ScheduleContact from "../../models/ScheduleContact";
import sequelize from "../../database";

interface Request {
  searchParam?: string;
  contactId?: number | string;
  userId?: number | string;
  companyId?: number;
  pageNumber?: string | number;
}

interface Response {
  schedules: Schedule[];
  count: number;
  hasMore: boolean;
}

const ListService = async ({
  searchParam,
  contactId = "",
  userId = "",
  pageNumber = "1",
  companyId
}: Request): Promise<Response> => {
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  const clauses: any[] = [
    {
      companyId: {
        [Op.eq]: companyId
      }
    }
  ];

  if (contactId !== "") {
    clauses.push({ contactId });
  }

  if (userId !== "") {
    clauses.push({ userId });
  }

  if (searchParam) {
    const term = `%${searchParam.toLowerCase()}%`;
    const escaped = sequelize.escape(term);
    clauses.push({
      [Op.or]: [
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("Schedule.body")),
          "LIKE",
          term
        ),
        Sequelize.where(
          Sequelize.fn("LOWER", Sequelize.col("contact.name")),
          "LIKE",
          term
        ),
        Sequelize.literal(`EXISTS (
          SELECT 1 FROM "ScheduleContacts" sc
          INNER JOIN "Contacts" c ON c.id = sc."contactId"
          WHERE sc."scheduleId" = "Schedule"."id"
          AND LOWER(c."name") LIKE ${escaped}
        )`)
      ]
    });
  }

  const whereCondition = { [Op.and]: clauses };

  const { count, rows: schedules } = await Schedule.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    distinct: true,
    col: "Schedule.id",
    subQuery: false,
    order: [["createdAt", "DESC"]],
    include: [
      { model: Contact, as: "contact", attributes: ["id", "name"] },
      { model: User, as: "user", attributes: ["id", "name"] },
      {
        model: Whatsapp,
        as: "preferredWhatsapp",
        attributes: ["id", "name", "status"],
        required: false
      },
      {
        model: ScheduleContact,
        as: "scheduleContacts",
        attributes: ["id", "contactId"],
        required: false,
        include: [
          { model: Contact, as: "contact", attributes: ["id", "name"] }
        ]
      }
    ]
  });

  const hasMore = count > offset + schedules.length;

  return {
    schedules,
    count,
    hasMore
  };
};

export default ListService;
