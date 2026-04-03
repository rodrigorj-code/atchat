import User from "../../models/User";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";

const DeleteUserService = async (
  id: string | number,
  companyId: number
): Promise<void> => {
  const user = await User.findOne({
    where: { id, companyId }
  });

  if (!user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const ticketsAssigned = await Ticket.count({
    where: {
      userId: user.id,
      companyId
    }
  });

  if (ticketsAssigned > 0) {
    throw new AppError(
      `Não é possível excluir: existem ${ticketsAssigned} atendimento(s) vinculados a este usuário. Transfira ou finalize os tickets antes.`,
      400
    );
  }

  await user.destroy();
};

export default DeleteUserService;
