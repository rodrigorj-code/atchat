const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");

module.exports = async function downloadMessage(sock, msg, msgType) {
    const startedAt = Date.now();



    const baseDir = "media";
    const folder = path.join(baseDir, msgType);



    const fallbackMime = "application/octet-stream";
    const rawMime =
        msg.message?.[msgType]?.mimetype ||
        msg.message?.documentWithCaptionMessage?.message?.documentMessage?.mimetype ||
        fallbackMime;


    let extension = "bin";
    try {
        extension = rawMime.split("/")[1]?.split(";")[0] || "bin";
    } catch (e) {
        ;
    }



    const originalFileName =
        msg.message?.[msgType]?.fileName ||
        msg.message?.documentWithCaptionMessage?.message?.documentMessage?.fileName ||
        `media_${Date.now()}`;


    const uniqueId = crypto.randomUUID();
    const safeBaseName = path
        .basename(originalFileName, path.extname(originalFileName))
        .replace(/[^\w\-]/g, "_");
    const fileName = `${safeBaseName}_${uniqueId}.${extension}`;
    const filePath = path.join(folder, fileName);

    try {

        await fs.mkdir(folder, { recursive: true });

        const stream = await downloadMediaMessage(
            msg,
            "stream",
            {},
            { logger: sock.logger, reuploadRequest: sock.updateMediaMessage }
        );
        if (!stream) throw new Error("Stream vazio (view-once? link expirado?)");

        const buffer = await streamToBuffer(stream);

        await fs.writeFile(filePath, buffer);
        const { size } = await fs.stat(filePath);


        return { filePath, mimeType: rawMime };
    } catch (error) {

        return null;
    } finally {

    }
};

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {

        const chunks = [];
        stream.on("data", (chunk) => {
            chunks.push(chunk);

        });
        stream.on("end", () => {

            resolve(Buffer.concat(chunks));
        });
        stream.on("error", (err) => {

            reject(err);
        });
    });
}
