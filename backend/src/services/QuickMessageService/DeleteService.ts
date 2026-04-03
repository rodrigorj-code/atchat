import QuickMessage from "../../models/QuickMessage";
import AppError from "../../errors/AppError";

interface Scope {
  companyId: number | string;
  userId: number | string;
}

const DeleteService = async (
  id: string,
  { companyId, userId }: Scope
): Promise<void> => {
  const record = await QuickMessage.findOne({
    where: {
      id,
      companyId,
      userId
    }
  });

  if (!record) {
    throw new AppError("ERR_NO_QUICKMESSAGE_FOUND", 404);
  }

  await record.destroy();
};

export default DeleteService;
