import { WAMessage, jidNormalizedUser } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";

import formatBody from "../../helpers/Mustache";

interface Request {
  body: string;
  ticket: Ticket;
  quotedMsg?: Message;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg
}: Request): Promise<WAMessage> => {
  let options = {};
  const wbot = await GetTicketWbot(ticket);
  // Evitar enviar para o próprio número da conexão (resposta indo para "si mesmo")
  if (!ticket.isGroup && ticket.contact?.number && wbot.user?.id) {
    const destNumber = String(ticket.contact.number).replace(/\D/g, "");
    const myNumber = jidNormalizedUser(wbot.user.id).replace(/\D/g, "");
    if (destNumber && myNumber && destNumber === myNumber) {
      throw new AppError("Não é possível enviar mensagem para o próprio número da conexão. Verifique o contato do ticket.");
    }
  }
  // Sempre usar apenas dígitos para montar o JID (evita LID ou formatação errada)
  const destNumber = String(ticket.contact.number || "").replace(/\D/g, "");
  const number = ticket.isGroup
    ? `${destNumber}@g.us`
    : `${destNumber}@s.whatsapp.net`;

  if (quotedMsg) {
      const chatMessages = await Message.findOne({
        where: {
          id: quotedMsg.id
        }
      });

      if (chatMessages) {
        const msgFound = JSON.parse(chatMessages.dataJson);
        const quotedKey = msgFound.key || {};
        // quoted.key.remoteJid deve ser o JID de destino (@s.whatsapp.net), não @lid (Baileys #1832)
        options = {
          quoted: {
            key: {
              ...quotedKey,
              remoteJid: number,
              participant: ticket.isGroup ? quotedKey.participant : undefined
            },
            message: msgFound.message || { extendedTextMessage: {} }
          }
        };
      }
    
  }

  try {
    const sentMessage = await wbot.sendMessage(number,{
        text: formatBody(body, ticket.contact)
      },
      {
        ...options
      }
    );

    await ticket.update({ lastMessage: formatBody(body, ticket.contact) });
    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMessage;
