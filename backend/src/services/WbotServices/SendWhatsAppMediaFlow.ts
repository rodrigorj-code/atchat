import { WAMessage, AnyMessageContent, WAPresence, jidNormalizedUser } from "@whiskeysockets/baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { getTicketRemoteJid } from "../../helpers/GetTicketRemoteJid";
import Ticket from "../../models/Ticket";
import mime from "mime-types";
import Contact from "../../models/Contact";

interface Request {
  media: Express.Multer.File;
  ticket: Ticket;
  body?: string;
}

interface RequestFlow {
  media: string;
  ticket: Ticket;
  body?: string;
  isFlow?: boolean;
  isRecord?: boolean;
}

const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");

const processAudio = async (audio: string): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio} -vn -ab 128k -ar 44100 -f ipod ${outputAudio} -y`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        //fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

const processAudioFile = async (audio: string): Promise<string> => {
  const outputAudio = `${publicFolder}/${new Date().getTime()}.mp3`;
  return new Promise((resolve, reject) => {
    exec(
      `${ffmpegPath.path} -i ${audio} -vn -ar 44100 -ac 2 -b:a 192k ${outputAudio}`,
      (error, _stdout, _stderr) => {
        if (error) reject(error);
        //fs.unlinkSync(audio);
        resolve(outputAudio);
      }
    );
  });
};

const nameFileDiscovery = (pathMedia: string) => {
  const spliting = pathMedia.split('/')
  const first = spliting[spliting.length - 1]
  return first.split(".")[0]
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

export const typeSimulation = async (ticket: Ticket, presence: WAPresence) => {

  const wbot = await GetTicketWbot(ticket);

  const contact = await Contact.findOne({
    where: {
      id: ticket.contactId,
    }
  });

  let chatJid = await getTicketRemoteJid(ticket);
  if (!chatJid && contact) {
    const dest = String(contact.number || "").replace(/\D/g, "");
    chatJid = ticket.isGroup ? `${dest}@g.us` : `${dest}@s.whatsapp.net`;
  }
  if (!chatJid) return;

  const jid = chatJid.includes("@") ? jidNormalizedUser(chatJid) : chatJid;
  await wbot.sendPresenceUpdate(presence, jid);
  await delay(5000);
  await wbot.sendPresenceUpdate("paused", jid);

}

const SendWhatsAppMediaFlow = async ({
  media,
  ticket,
  body,
  isFlow = false,
  isRecord = false
}: RequestFlow): Promise<WAMessage> => {
  try {
    const wbot = await GetTicketWbot(ticket);

    const mimetype = mime.lookup(media)
    const pathMedia = media

    let typeMessage = "";

    if (typeof mimetype === "string") {
      typeMessage = mimetype.split("/")[0];
    }
    const mediaName = nameFileDiscovery(media)

    let options: AnyMessageContent;

    if( mimetype ){
      if (typeMessage === "video") {
        options = {
          video: fs.readFileSync(pathMedia),
          caption: body,
          fileName: mediaName
          // gifPlayback: true
        };
      } else if (typeMessage === "audio") {
        console.log('record', isRecord)
        if (isRecord) {
          const convert = await processAudio(pathMedia);
          options = {
            audio: fs.readFileSync(convert),
            mimetype: typeMessage ? "audio/mp4" : mimetype,
            ptt: true
          };
        } else {
          const convert = await processAudioFile(pathMedia);
          options = {
            audio: fs.readFileSync(convert),
            mimetype: typeMessage ? "audio/mp4" : mimetype,
            ptt: false
          };
        }
      } else if (typeMessage === "document" || typeMessage === "text") {
        options = {
          document: fs.readFileSync(pathMedia),
          caption: body,
          fileName: mediaName,
          mimetype: mimetype
        };
      } else if (typeMessage === "application") {
        options = {
          document: fs.readFileSync(pathMedia),
          caption: body,
          fileName: mediaName,
          mimetype: mimetype
        };
      }
    } else {
      options = {
        image: fs.readFileSync(pathMedia),
        caption: body
      };
    }

    let chatJid = await getTicketRemoteJid(ticket);
    if (!chatJid) {
      const contactRow = await Contact.findOne({
        where: { id: ticket.contactId }
      });
      const destNumber = String(contactRow?.number || "").replace(/\D/g, "");
      if (ticket.isGroup) {
        chatJid = `${destNumber}@g.us`;
      } else if (!destNumber) {
        throw new AppError("Não foi possível obter o destino da mídia (LID sem remoteJid).");
      } else {
        chatJid = `${destNumber}@s.whatsapp.net`;
      }
    }
    const dest = chatJid.includes("@") ? jidNormalizedUser(chatJid) : chatJid;

    const sentMessage = await wbot.sendMessage(dest, {
      ...options
    });

    await ticket.update({ lastMessage: mediaName });

    return sentMessage;
  } catch (err) {
    Sentry.captureException(err);
    console.log(err);
    throw new AppError("ERR_SENDING_WAPP_MSG");
  }
};

export default SendWhatsAppMediaFlow;
