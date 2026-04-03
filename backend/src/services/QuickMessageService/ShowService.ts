import QuickMessage from "../../models/QuickMessage";
import AppError from "../../errors/AppError";

interface Scope {
  companyId: number | string;
  userId: number | string;
}

const ShowService = async (
  id: string | number,
  { companyId, userId }: Scope
): Promise<QuickMessage> => {
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

  return record;
};

export default ShowService;
