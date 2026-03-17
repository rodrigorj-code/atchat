
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

const { proto, downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
module.exports = async function downloadMessage(sock, msg, msgType) {

    const baseDir = "media";
    const folder = path.join(baseDir, msgType);

    const mimeType =
        msg.message[msgType]?.mimetype ||
        msg.message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype ||
        "application/octet-stream";
    const extension = mimeType.split("/")[1] || "bin";

    let fileName =
        msg.message[msgType]?.fileName ||
        msg.message?.documentWithCaptionMessage?.message?.documentMessage?.fileName ||
        `media_${Date.now()}`;

    const uniqueId = crypto.randomUUID(); // Gera um UUID único
    if (!path.extname(fileName)) {
        fileName = `${fileName}.${extension}`;
    }
    fileName = `${path.basename(fileName, path.extname(fileName))}_${uniqueId}${path.extname(fileName)}`;

    const filePath = path.join(folder, fileName);

    try {

        await fs.mkdir(folder, { recursive: true });


        const buffer = await downloadMediaMessage(
            msg,
            "buffer",
            {},
            {
                logger: sock.logger || console,
                reuploadRequest: sock.updateMediaMessage,
            }
        );

        await fs.writeFile(filePath, buffer);

        return {
            filePath,
            mimeType,
            size: buffer.length,
        };
    } catch (error) {
      
        return null;
    }
};


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
