
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

const { proto, getContentType } = require("@whiskeysockets/baileys");

const Sentry = require("@sentry/node");

const getTypeMessage = (msg) => {
    const msgType = getContentType(msg.message);
    if (msg.message?.viewOnceMessageV2) {
        return "viewOnceMessageV2";
    }
    return msgType;
};

const isValidMsg = (msg) => {
    if (!msg || !msg.key || !msg.key.remoteJid) return false;
    if (msg.key.remoteJid === "status@broadcast") return false;
    try {
        const msgType = getTypeMessage(msg);
        if (msgType === "pollCreationMessage") {

            return false;
        }

        if (!msgType) {
            return;
        }

        const ifType =
            msgType === "conversation" ||
            msgType === "extendedTextMessage" ||
            msgType === "audioMessage" ||
            msgType === "videoMessage" ||
            msgType === "imageMessage" ||
            msgType === "documentMessage" ||
            msgType === "stickerMessage" ||
            msgType === "buttonsResponseMessage" ||
            msgType === "buttonsMessage" ||
            msgType === "messageContextInfo" ||
            msgType === "locationMessage" ||
            msgType === "liveLocationMessage" ||
            msgType === "contactMessage" ||
            msgType === "voiceMessage" ||
            msgType === "mediaMessage" ||
            msgType === "contactsArrayMessage" ||
            msgType === "reactionMessage" ||
            msgType === "ephemeralMessage" ||
            msgType === "protocolMessage" ||
            msgType === "listResponseMessage" ||
            msgType === "listMessage" ||
            msgType === "viewOnceMessage" ||
            msgType === "documentWithCaptionMessage" ||
            msgType === "editedMessage" ||
            msgType === "MESSAGE_EDIT" ||
            msgType === "viewOnceMessageV2" ||
            msgType === "encCommentMessage" ||
            msgType === "pollCreationMessageV3" ||
            msgType === "ptvMessage" ||
            msgType === "interactiveMessage" ||
            msgType === "advertisingMessage" ||
            msgType === "highlyStructuredMessage" ||
            msgType === "eventMessage" ||
            msgType === "templateButtonReplyMessage";

        if (!ifType) {
            console.log(
                `#### Nao achou o type em isValidMsg: ${msgType}
  ${JSON.stringify(msg?.message)}`
            );
            Sentry.setExtra("Mensagem", { BodyMsg: msg.message, msg, msgType });
            Sentry.captureException(new Error("Novo Tipo de Mensagem em isValidMsg"));
        }

        return !!ifType;
    } catch (error) {
        Sentry.setExtra("Error isValidMsg", { msg });
        Sentry.captureException(error);
    }
};

module.exports = { isValidMsg };


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
