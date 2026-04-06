import { Op } from "sequelize";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import ScheduleContact from "../../models/ScheduleContact";

const syncScheduleContacts = async (
  scheduleId: number,
  companyId: number,
  contactIds: number[]
): Promise<void> => {
  const unique = [...new Set(contactIds.map(Number).filter(Boolean))];
  if (!unique.length) {
    throw new AppError("Selecione ao menos um contato", 400);
  }

  const found = await Contact.findAll({
    where: { id: { [Op.in]: unique }, companyId }
  });
  if (found.length !== unique.length) {
    throw new AppError("Um ou mais contatos são inválidos para esta empresa", 400);
  }

  await ScheduleContact.destroy({ where: { scheduleId } });
  await ScheduleContact.bulkCreate(
    unique.map(contactId => ({
      scheduleId,
      contactId
    }))
  );
};

export default syncScheduleContacts;
