import Whatsapp from "../models/Whatsapp";

export type ResolveWhatsappResult = {
  whatsapp: Whatsapp | null;
  reason: "preferred" | "default" | "fallback" | "no_connection";
};

/**
 * Escolhe conexão para envio de agendamento: preferencial (se CONNECTED),
 * senão default da empresa, senão qualquer CONNECTED da empresa.
 * Não lança exceção — retorna null com reason no_connection.
 */
const ResolveWhatsappForSchedule = async (
  companyId: number,
  preferredWhatsappId?: number | null
): Promise<ResolveWhatsappResult> => {
  if (preferredWhatsappId) {
    const preferred = await Whatsapp.findOne({
      where: {
        id: preferredWhatsappId,
        companyId,
        status: "CONNECTED"
      }
    });
    if (preferred) {
      return { whatsapp: preferred, reason: "preferred" };
    }
  }

  const defaultWhatsapp = await Whatsapp.findOne({
    where: { isDefault: true, companyId }
  });

  if (defaultWhatsapp?.status === "CONNECTED") {
    return { whatsapp: defaultWhatsapp, reason: "default" };
  }

  const anyConnected = await Whatsapp.findOne({
    where: { status: "CONNECTED", companyId }
  });

  if (anyConnected) {
    return { whatsapp: anyConnected, reason: "fallback" };
  }

  return { whatsapp: null, reason: "no_connection" };
};

export default ResolveWhatsappForSchedule;
