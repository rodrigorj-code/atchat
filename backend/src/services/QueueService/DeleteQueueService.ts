import ShowQueueService from "./ShowQueueService";
import Ticket from "../../models/Ticket";
import UserQueue from "../../models/UserQueue";
import WhatsappQueue from "../../models/WhatsappQueue";
import QueueOption from "../../models/QueueOption";
import AppError from "../../errors/AppError";

const DeleteQueueService = async (
  queueId: number | string,
  companyId: number
): Promise<void> => {
  const queue = await ShowQueueService(queueId, companyId);

  const qid = Number(queueId);

  const ticketsCount = await Ticket.count({
    where: { queueId: qid, companyId }
  });

  const usersCount = await UserQueue.count({
    where: { queueId: qid }
  });

  const whatsappLinks = await WhatsappQueue.count({
    where: { queueId: qid }
  });

  const optionsCount = await QueueOption.count({
    where: { queueId: qid }
  });

  if (
    ticketsCount > 0 ||
    usersCount > 0 ||
    whatsappLinks > 0 ||
    optionsCount > 0
  ) {
    throw new AppError(
      `Não é possível excluir: o setor está em uso (${ticketsCount} ticket(s), ${usersCount} usuário(s) vinculado(s), ${whatsappLinks} conexão(ões), ${optionsCount} opção(ões) de menu). Remova os vínculos antes.`,
      400
    );
  }

  await queue.destroy();
};

export default DeleteQueueService;
