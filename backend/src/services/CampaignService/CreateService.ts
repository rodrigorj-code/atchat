import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Campaign from "../../models/Campaign";
import ContactList from "../../models/ContactList";
import ContactListItem from "../../models/ContactListItem";
import Whatsapp from "../../models/Whatsapp";

function hasValidContactListId(
  value: number | string | null | undefined
): boolean {
  if (value === null || value === undefined || value === "") return false;
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function hasTag(tagId: number | null | undefined): boolean {
  return tagId != null && Number(tagId) > 0;
}

interface Data {
  name: string;
  status: string;
  scheduledAt: string;
  companyId: number;
  contactListId: number;
  tagId: number | null;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  fileListId: number;
}

const CreateService = async (data: Data): Promise<Campaign> => {
  const { name } = data;

  const ticketnoteSchema = Yup.object().shape({
    name: Yup.string()
      .min(3, "ERR_CAMPAIGN_INVALID_NAME")
      .required("ERR_CAMPAIGN_REQUIRED")
  });

  try {
    await ticketnoteSchema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  if (!hasTag(data.tagId) && !hasValidContactListId(data.contactListId)) {
    throw new AppError("ERR_CAMPAIGN_EMPTY_LIST", 400);
  }

  if (hasValidContactListId(data.contactListId)) {
    const valid = await ContactListItem.count({
      where: {
        contactListId: data.contactListId,
        isWhatsappValid: true
      }
    });
    if (valid === 0) {
      throw new AppError("ERR_CAMPAIGN_NO_VALID_CONTACTS", 400);
    }
  }

  if (data.scheduledAt != null && data.scheduledAt != "") {
    data.status = "PROGRAMADA";
  }

  const record = await Campaign.create(data);

  await record.reload({
    include: [
      { model: ContactList },
      { model: Whatsapp, attributes: ["id", "name"] }
    ]
  });

  return record;
};

export default CreateService;
