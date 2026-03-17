
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */
const { randomBytes } = require('crypto');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
const { exec, execSync } = require('child_process');
const fetch = require('node-fetch');

const mime = require('mime-types');
const { isValidMsg } = require("./isValidMsg");
const QRCode = require('qrcode');
const { parse } = require('url');
const pino = require('pino');
const { promisify } = require('util');
const execPromise = promisify(exec);
const cach = require('node-cache');
const msgRetryCounterCache = new cach();

let intervalStore = [];

const {
  makeWASocket,
  DisconnectReason,
  isJidUser,
  isJidGroup,
  makeInMemoryStore,
  proto,
  delay,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  getDevice,
  GroupMetadata,
  MessageUpsertType,
  ParticipantAction,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  WASocket
} = require('@whiskeysockets/baileys');

const { unlinkSync } = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const processButton = require('../helper/processbtn');
const generateVC = require('../helper/genVc');
const axios = require('axios');
const config = require('../../config/config');
const Queue = require('bull');

const downloadMessage = require('../helper/downloadMsg');
const dados = makeInMemoryStore({ pino });
const fs = require('fs').promises;
const getMIMEType = require('mime-types');
const readFileAsync = promisify(fs.readFile);
const util = require('util');
const url = require('url');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

dados.readFromFile('db/mensagens.json');

setInterval(() => {
  dados.writeToFile('db/mensagens.json');
}, 7200000);
const redisUri = process.env.REDIS_URI;
const whatsappMessagesQueue = new Queue("whatsappMessagesQueue", redisUri, {
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "fixed",
      delay: 60000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});



class WhatsAppInstance {
  socketConfig = {
    defaultQueryTimeoutMs: undefined,
    printQRInTerminal: false,
    markOnlineOnConnect: true,
    syncFullHistory: true,
    logger: pino({
      level: config.log.level,
    }),

    msgRetryCounterCache: msgRetryCounterCache,
    getMessage: (key) => {
      return (dados.loadMessage(key.remoteJid, key.id))?.message || undefined;
    },
    patchMessageBeforeSending: (msg) => {
      if (msg.deviceSentMessage?.message?.listMessage?.listType == proto.Message.ListMessage.ListType.PRODUCT_LIST) {
        msg = JSON.parse(JSON.stringify(msg));
        msg.deviceSentMessage.message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
      }

      if (msg.listMessage?.listType == proto.Message.ListMessage.ListType.PRODUCT_LIST) {
        msg = JSON.parse(JSON.stringify(msg));
        msg.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
      }

      const requiresPatch = !!(msg.buttonsMessage || msg.listMessage || msg.templateMessage);
      if (requiresPatch) {
        msg = {
          viewOnceMessageV2: {
            message: {
              messageContextInfo: {
                deviceListMetadataVersion: 2,
                deviceListMetadata: {},
              },
              ...msg,
            },
          },
        };
      }

      return msg;
    },
  };

  key = '';
  authState;
  allowWebhook = undefined;
  webhook = undefined;

  instance = {
    key: this.key,
    chats: [],
    contacts: [],
    qr: '',
    messages: [],
    qrRetry: 0,
    customWebhook: '',
    WAPresence: [],
    deleted: false,
  };

  axiosInstance = axios.create({
    baseURL: config.webhookUrl,
  });

  constructor(key, allowWebhook, webhook) {
    this.key = key ? key : uuidv4();
    this.pendingMessages = [];
    this.processing = false;
    this.instance.customWebhook = this.webhook ? this.webhook : webhook;
    this.allowWebhook = config.webhookEnabled ? config.webhookEnabled : allowWebhook;


    if (this.allowWebhook && this.instance.customWebhook !== null) {
      this.allowWebhook = true;
      this.instance.customWebhook = webhook;
      this.axiosInstance = axios.create({
        baseURL: webhook,
      });
    }
  }

  async geraThumb(videoPath) {
    const name = uuidv4();
    const tempDir = 'temp';
    const thumbPath = 'temp/' + name + 'thumb.png';

    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    const base64 = base64Regex.test(videoPath);

    try {
      let videoBuffer;
      let videoTempPath;

      if (videoPath.startsWith('http')) {
        const response = await axios.get(videoPath, { responseType: 'arraybuffer' });
        videoTempPath = path.join(tempDir, name + '.mp4');
        videoBuffer = Buffer.from(response.data);
        await fs.writeFile(videoTempPath, videoBuffer);
      } else if (base64 === true) {
        videoTempPath = path.join(tempDir, 'temp/' + name + '.mp4');
        const buffer = Buffer.from(videoPath, 'base64');
        await fs.writeFile(videoTempPath, buffer);
      } else {
        videoTempPath = videoPath;
      }

      const command = `${ffmpegPath.path} -i ${videoTempPath} -ss 00:00:01 -vframes 1 ${thumbPath}`;
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      const thumbContent = await fs.readFile(thumbPath, { encoding: 'base64' });

      await Promise.all([fs.unlink(videoTempPath), fs.unlink(thumbPath)]);

      return thumbContent;
    } catch (error) {
      console.log(error);
    }
  }

  async thumbURL(url) {
    const videoUrl = url;
    try {
      const thumbContentFromUrl = await this.geraThumb(videoUrl);
      return thumbContentFromUrl;
    } catch (error) {
      console.log(error);
    }
  }

  async thumbBUFFER(buffer) {
    try {
      const thumbContentFromBuffer = await this.geraThumb(buffer);
      return thumbContentFromBuffer;
    } catch (error) {
      console.log(error);
    }
  }

  async thumbBase64(buffer) {
    try {
      const thumbContentFromBuffer = await this.geraThumb(buffer);
      return thumbContentFromBuffer;
    } catch (error) {
      console.log(error);
    }
  }

  async convertMP3(audioSource) {
    try {
      const return_mp3 = await this.mp3(audioSource);
      return return_mp3;
    } catch (error) {
      console.log(error);
    }
  }

  async mp3(audioSource) {
    const name = uuidv4();
    try {
      const mp3_temp = 'temp/' + name + '.mp3';
      const command = `${ffmpegPath.path} -i ${audioSource} -acodec libmp3lame -ab 128k ${mp3_temp}`;
      await new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      const audioContent = await fs.readFile(mp3_temp, { encoding: 'base64' });

      await Promise.all([fs.unlink(mp3_temp), fs.unlink(audioSource)]);

      return audioContent;
    } catch (error) {
      console.log(error);
    }
  }


  async convertToMP4(audioSource) {
    const name = uuidv4();
    try {
      let audioBuffer;
      if (Buffer.isBuffer(audioSource)) {
        audioBuffer = audioSource;
      } else if (audioSource.startsWith('http')) {
        const response = await fetch(audioSource);
        audioBuffer = await response.buffer();
      } else if (audioSource.startsWith('data:audio')) {
        const base64DataIndex = audioSource.indexOf(',');
        if (base64DataIndex !== -1) {
          const base64Data = audioSource.slice(base64DataIndex + 1);
          audioBuffer = Buffer.from(base64Data, 'base64');
        }
      } else {
        audioBuffer = audioSource;
      }

      const tempOutputFile = `temp/temp_output_${name}.opus`;
      const mp3_temp = 'temp/' + name + '.mp3';

      const ffmpegCommand = `${ffmpegPath.path} -i "${mp3_temp}" -c:a libopus -b:a 128k -ac 1 "${tempOutputFile}"`;

      await fs.writeFile(mp3_temp, Buffer.from(audioBuffer));

      await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      fs.unlink(mp3_temp);

      return tempOutputFile;
    } catch (error) {
      throw error;
    }
  }

  async convertTovideoMP4(videoSource) {
    const name = uuidv4();
    try {
      let videoBuffer;

      if (Buffer.isBuffer(videoSource)) {
        videoBuffer = videoSource;
      } else if (videoSource.startsWith('http')) {
        const response = await fetch(videoSource);
        videoBuffer = await response.buffer();
      } else if (videoSource.startsWith('data:video')) {
        const base64DataIndex = videoSource.indexOf(',');
        if (base64DataIndex !== -1) {
          const base64Data = videoSource.slice(base64DataIndex + 1);
          videoBuffer = Buffer.from(base64Data, 'base64');
        }
      } else {
        videoBuffer = videoSource;
      }

      const tempOutputFile = `temp/temp_output_${name}.mp4`;
      const mp4 = 'temp/' + name + '.mp4';

      const ffmpegCommand = `${ffmpegPath.path} -i "${mp4}" -c:v libx264 -c:a aac -strict experimental -b:a 192k -movflags faststart -f mp4 "${tempOutputFile}"`;

      await fs.writeFile(mp4, Buffer.from(videoBuffer));

      await new Promise((resolve, reject) => {
        exec(ffmpegCommand, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      fs.unlink(mp4);

      return tempOutputFile;
    } catch (error) {
      throw error;
    }
  }

  async getMimeTypeFromBase64(base64String) {
    return new Promise((resolve, reject) => {
      try {
        const header = base64String.substring(0, base64String.indexOf(','));
        const match = header.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);

        if (match && match[1]) {
          resolve(match[1]);
        } else {
          reject(new Error('Tipo MIME não pôde ser determinado.'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  async getBufferFromMP4File(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async getFileNameFromUrl(url) {
    try {
      const parsedUrl = parse(url);
      const pathArray = parsedUrl.pathname.split('/');
      const fileName = pathArray[pathArray.length - 1];
      return fileName;
    } catch (error) {
      throw error;
    }
  }



  async dataBase() {
    try {
      return await useMultiFileAuthState('db/' + this.key);
    } catch (error) {
      console.log('Falha ao atualizar a base de dados');
    }
  }

  async SendWebhook(type, hook, body, key, attempt = 1) {
    if (!this.instance.webhook) {
      return;
    }

    const webhook_url = this.instance.webhook_url;
    const retryDelays = [60000, 180000, 600000];

    const events = [
      "messages.upsert",
      "connection.update",
      "qrCode.update",
      "messaging-history.set",
      "messages.update",
      "call.events",
      "contacts.upsert",
      "CB:call",
      "presence.update"
    ];

    if (!events.includes(hook)) {

      return;
    }

    try {
      await axios.post(webhook_url, {
        type,
        body,
        instanceKey: key,
      });

      console.log("✅ Webhook enviado com sucesso!");

    } catch (error) {



      if (hook === "messages.upsert" && attempt < retryDelays.length) {

        const retryDelay = retryDelays[attempt - 1];
        console.log(`🔄 Tentando novamente em ${retryDelay / 60000} minutos...`);

        setTimeout(() => {
          this.SendWebhook(type, hook, body, key, attempt + 1);
        }, retryDelay);
      } else if (hook !== "messages.upsert") {

      } else {

      }
    }
  }



  async instanceFind(key) {
    const filePath = path.join('sessions.json');

    const data = await fs.readFile(filePath, 'utf-8');
    if (data) {
      const sessions = JSON.parse(data);
      const existingSession = sessions.find((session) => session.key === this.key);
      if (!existingSession) {
        const data = {
          "key": false,
          "browser": false,
          "webhook": false,
          "base64": false,
          "webhookUrl": false,
          "webhookEvents": false,
          "messagesRead": false,
        };
        return data;
      } else {
        return existingSession;
      }
    } else {
      const data = {
        "key": false,
        "browser": false,
        "webhook": false,
        "base64": false,
        "webhookUrl": false,
        "webhookEvents": false,
        "messagesRead": false,
      };
      return data;
    }
  }

  async init() {
    const ver = await fetchLatestBaileysVersion();
    const filePath = path.join('sessions.json');

    const data = await fs.readFile(filePath, 'utf-8');
    if (!data) {
      return;
    }
    const sessions = JSON.parse(data);

    const existingSession = sessions.find((session) => session.key === this.key);
    if (!existingSession) {
      return;
    }

    const { state, saveCreds, keys } = await this.dataBase();
    this.authState = {
      state: state,
      saveCreds: saveCreds,
      keys: makeCacheableSignalKeyStore(keys, this.logger),
    };

    let b;
    let ignoreGroup;

    if (existingSession) {
      b = {
        browser: {
          platform: existingSession.browser,
          browser: 'Chrome',
          version: '20.0.04',
        },
      };
      ignoreGroup = existingSession.ignoreGroups;
      this.instance.mark = existingSession.messagesRead;
      this.instance.webhook = existingSession.webhook;
      this.instance.webhook_url = existingSession.webhookUrl;
      this.instance.webhook_events = existingSession.webhookEvents;

      this.instance.importOldMessages = existingSession.importOldMessages || null;
      this.instance.dateRecentLimit = existingSession.dateRecentLimit || null;
      this.instance.importOldMessagesGroups = existingSession.importOldMessagesGroups || false;
    } else {
      b = {
        browser: {
          platform: 'Chrome (Linux)',
          browser: 'chrome',
          version: '22.5.0',
        },
      };
      ignoreGroup = false;
      this.instance.mark = false;
      this.instance.webhook = false;
      this.instance.webhook_url = false;
      this.instance.webhook_events = false;
    }

    this.socketConfig.auth = this.authState.state;
    if (ignoreGroup === true) {
      this.socketConfig.shouldIgnoreJid = (jid) => !isJidUser(jid);
    } else {
      this.socketConfig.shouldIgnoreJid = (jid) => false;
    }
    this.socketConfig.version = ver.version;
    this.socketConfig.browser = Object.values(b.browser);

    this.instance.sock = makeWASocket(this.socketConfig);

    dados?.bind(this.instance.sock?.ev);

    this.setHandler();
    return this;
  }

  setHandler() {
    const sock = this.instance.sock;

    sock?.ev.on('creds.update', this.authState.saveCreds);

    sock?.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const status = lastDisconnect?.error?.output?.statusCode;

      if (connection === 'connecting') return;

      if (connection === 'close') {
        if (status === DisconnectReason.loggedOut || status === 405 || status === 402 || status === 403) {
          await this.deleteFolder('db/' + this.key);
          await delay(1000);
          this.instance.online = false;
          await this.init();
        } else if (status === 440) {
          return;
        } else {
          await this.init();
        }

        await this.SendWebhook('connection', 'connection.update', {
          connection: connection,
          connection_code: lastDisconnect?.error?.output?.statusCode
        }, this.key);
      } else if (connection === 'open') {

        const phoneInfo = sock?.user?.id;
        const rawPhoneNumber = phoneInfo ? phoneInfo.split('@')[0] : null;
        const phoneNumber = rawPhoneNumber?.split(':')[0];
        this.instance.online = true;
        await this.SendWebhook('connection', 'connection.update', {
          connection: connection,
          phoneNumber: phoneNumber
        }, this.key);
      }

      if (qr) {
        QRCode.toDataURL(qr).then((url) => {
          this.instance.qr = url;
        });
        await this.SendWebhook('qrCode', 'qrCode.update', {
          qr: qr,
        }, this.key);
      }
    });

    sock?.ev.on('presence.update', async (json) => {
      await this.SendWebhook('presence', 'presence.update', json, this.key);
    });

    sock?.ev.on('contacts.upsert', async (contacts) => {
      try {

        const folderPath = path.join('db', this.key);
        const filePath = path.join(folderPath, 'contacts.json');

        await fs.mkdir(folderPath, { recursive: true });

        let existingContacts = [];
        try {

          const currentContent = await fs.readFile(filePath, 'utf-8');
          existingContacts = JSON.parse(currentContent);
        } catch (error) {
          if (error.code === 'ENOENT') {
            console.log("Arquivo de contatos não encontrado. Criando um novo arquivo.");
          } else {
            throw error;
          }
        }

        contacts.forEach((contact) => {
          const existingContactIndex = existingContacts.findIndex((c) => c.id === contact.id);
          if (existingContactIndex !== -1) {
            existingContacts[existingContactIndex] = contact;
          } else {
            existingContacts.push(contact);
          }
        });

        await fs.writeFile(filePath, JSON.stringify(existingContacts, null, 2), 'utf-8');

        const webhookData = {
          instanceKey: this.key,
          contacts: existingContacts,
        };

        await this.SendWebhook('contacts', 'contacts.upsert', webhookData, this.key);
      } catch (error) {
        console.error("Erro ao salvar ou enviar contatos:", error.message);
      }
    });




    sock?.ev.on("messaging-history.set", async (messageSet) => {
      try {
        const dateOldLimit = new Date(this.instance.importOldMessages).getTime();
        const dateRecentLimit = new Date(this.instance.dateRecentLimit).getTime();
        const importOldMessagesGroups = this.instance.importOldMessagesGroups || false;

        const isValidMsg = (msg) => {
          const timestampMsg = Math.floor(msg.messageTimestamp?.low * 1000 || 0);
          return (
            timestampMsg >= dateOldLimit &&
            timestampMsg <= dateRecentLimit &&
            (
              msg.key?.remoteJid?.split("@")[1] !== "g.us" ||
              importOldMessagesGroups
            )
          );
        };

        const getMediaType = (msg) => {
          const mediaTypes = [
            "imageMessage",
            "videoMessage",
            "audioMessage",
            "stickerMessage",
            "documentMessage",
            "documentWithCaptionMessage?.message?.documentMessage",
            "ephemeralMessage?.message?.audioMessage",
            "ephemeralMessage?.message?.documentMessage",
            "ephemeralMessage?.message?.videoMessage",
            "ephemeralMessage?.message?.stickerMessage",
            "ephemeralMessage?.message?.imageMessage",
            "viewOnceMessage?.message?.imageMessage",
            "viewOnceMessage?.message?.videoMessage",
            "ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage",
            "ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage",
            "templateMessage?.hydratedTemplate?.imageMessage",
            "templateMessage?.hydratedTemplate?.documentMessage",
            "templateMessage?.hydratedTemplate?.videoMessage",
            "interactiveMessage?.header?.imageMessage",
            "interactiveMessage?.header?.documentMessage",
            "interactiveMessage?.header?.videoMessage",
          ];

          for (const type of mediaTypes) {
            const keys = type.split("?.");

            const mediaContent = keys.reduce(
              (obj, key) => (obj && obj[key] ? obj[key] : undefined),
              msg.message
            );

            if (mediaContent) {
              if (!mediaContent.mimetype) {
                console.warn(`Mídia ignorada por falta de mimetype: ${type}`);
                return null;
              }
              return { type: keys[keys.length - 1], content: mediaContent };
            }
          }

          return null;
        };


        const filteredMessages = messageSet.messages.filter((msg) => isValidMsg(msg));

        const processedMessages = [];

        const batchSize = 50;
        for (let i = 0; i < filteredMessages.length; i += batchSize) {
          const batch = filteredMessages.slice(i, i + batchSize);

          for (const msg of batch) {
            const processedMessage = {
              key: msg.key,
              messageTimestamp: Math.floor(msg.messageTimestamp?.low * 1000 || 0),
              participant: msg.participant,
              message: msg.message,
            };

            const mediaInfo = getMediaType(msg);
            const webhookData = { key: this.key, ...msg };

            if (mediaInfo) {
              try {
                const mediaData = await downloadMessage(sock, msg, mediaInfo.type);
                if (mediaData) {
                  const APP_URL = process.env.APP_URL;
                  const publicPath = `${APP_URL}/media/${mediaInfo.type}/${path.basename(mediaData.filePath)}`;

                  webhookData["msgContent"] = publicPath;
                  webhookData["mimeType"] = mediaData.mimeType;
                  webhookData["size"] = mediaData.size;
                  webhookData["fileName"] = msg.message[mediaInfo.type]?.fileName || "";
                } else {

                  webhookData["msgContent"] = "";
                }
              } catch (error) {
                console.error("Erro ao processar mídia:", error);
                webhookData["msgContent"] = "";
              }
            } else {
              webhookData["msgContent"] = msg.message?.conversation || "";
            }

            processedMessages.push(webhookData);
          }
        }
        const folderPath = path.join("db", this.key);
        const filePath = path.join(folderPath, "messaging-messages.json");

        let existingData = [];
        try {
          const fileContent = await fs.readFile(filePath, "utf-8");
          existingData = JSON.parse(fileContent);
        } catch {
          existingData = [];
        }
        const updatedData = [...existingData, ...processedMessages];
        try {
          await fs.access(folderPath);
        } catch {
          await fs.mkdir(folderPath, { recursive: true });
        }
        await fs.writeFile(filePath, JSON.stringify(updatedData, null, 2), "utf-8");
        const webhookData = {
          instanceKey: this.key,
          messages: processedMessages,
        };
        await this.SendWebhook("history-message", "messaging-history.set", webhookData, this.key);
      } catch (error) {
        console.error("Erro ao processar histórico de mensagens:", error);
      }
    });

    sock?.ev.on('messages.update', async (m) => {
      try {
        await this.SendWebhook('updateMessage', 'messages.update', m, this.key);
      } catch (e) {
        return;
      }
    });


    sock?.ev.on("messages.upsert", async (m) => {
      if (m.type === "prepend") this.instance.messages.unshift(...m.messages);
      if (m.type !== "notify") return;

      this.instance.messages.unshift(...m.messages);

      const processMessage = async (msg) => {
        if (!msg.message) return;

        const getMediaType = (msg) => {
          const mediaTypes = [
            "imageMessage",
            "videoMessage",
            "audioMessage",
            "stickerMessage",
            "documentMessage",
            "documentWithCaptionMessage?.message?.documentMessage",
            "ephemeralMessage?.message?.audioMessage",
            "ephemeralMessage?.message?.documentMessage",
            "ephemeralMessage?.message?.videoMessage",
            "ephemeralMessage?.message?.stickerMessage",
            "ephemeralMessage?.message?.imageMessage",
            "viewOnceMessage?.message?.imageMessage",
            "viewOnceMessage?.message?.videoMessage",
            "ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage",
            "ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage",
            "templateMessage?.hydratedTemplate?.imageMessage",
            "templateMessage?.hydratedTemplate?.documentMessage",
            "templateMessage?.hydratedTemplate?.videoMessage",
            "interactiveMessage?.header?.imageMessage",
            "interactiveMessage?.header?.documentMessage",
            "interactiveMessage?.header?.videoMessage",
          ];

          for (const type of mediaTypes) {
            const keys = type.split("?.");

            const mediaContent = keys.reduce(
              (obj, key) => (obj && obj[key] ? obj[key] : undefined),
              msg.message
            );

            if (mediaContent) return { type: keys[keys.length - 1], content: mediaContent };
          }

          return null;
        };

        const mediaInfo = getMediaType(msg);
        const webhookData = { key: this.key, ...msg };

        if (mediaInfo) {
          try {
            const mediaData = await downloadMessage(sock, msg, mediaInfo.type);
            if (mediaData) {
              const APP_URL = process.env.APP_URL;
              const publicPath = `${APP_URL}/media/${mediaInfo.type}/${path.basename(
                mediaData.filePath
              )}`;

              webhookData["msgContent"] = publicPath;
              webhookData["mimeType"] = mediaData.mimeType;
              webhookData["size"] = mediaData.size;
              webhookData["fileName"] = msg.message[mediaInfo.type]?.fileName || "";
            } else {

              webhookData["msgContent"] = "";
            }
          } catch (error) {
            console.error(`Erro ao baixar/processar mídia (${mediaInfo.type}):`, error.message);
            webhookData["msgContent"] = "";
          }
        } else {
          webhookData["msgContent"] = msg.message?.conversation || "";
        }

        try {


          await whatsappMessagesQueue.add(
            "whatsappMessagesQueue",
            { type: "message", body: webhookData, instanceKey: this.key },
            {
              priority: 1,
              attempts: 5,
              backoff: { type: "fixed", delay: 60000 }
            }
          );


        } catch (error) {
          console.error("Erro ao enviar webhook:", error.message);
        }
      };

      const maxConcurrent = 5;
      const queue = [...m.messages];
      const processing = [];

      while (queue.length > 0) {
        while (processing.length < maxConcurrent && queue.length > 0) {
          const msg = queue.shift();
          const task = processMessage(msg).finally(() =>
            processing.splice(processing.indexOf(task), 1)
          );
          processing.push(task);
        }
        await Promise.race(processing);
      }

      await Promise.all(processing);
    });



    sock?.ws.on('CB:call', async (data) => {
      try {
        if (data.content) {
          if (data.content.find((e) => e.tag === 'offer')) {
            const content = data.content.find((e) => e.tag === 'offer');

            await this.SendWebhook('call_offer', 'call.events', {
              id: content.attrs['call-id'],
              timestamp: parseInt(data.attrs.t),
              user: {
                id: data.attrs.from,
                platform: data.attrs.platform,
                platform_version: data.attrs.version,
              },
            }, this.key);
          } else if (data.content.find((e) => e.tag === 'terminate')) {
            const content = data.content.find((e) => e.tag === 'terminate');

            await this.SendWebhook('call', 'call.events', {
              id: content.attrs['call-id'],
              user: {
                id: data.attrs.from,
              },
              timestamp: parseInt(data.attrs.t),
              reason: data.content[0].attrs.reason,
            }, this.key);
          }
        }
      } catch (e) {
        return;
      }
    });

    sock?.ev.on('groups.upsert', async (groupUpsert) => {
      try {
        await this.SendWebhook('updateGroups', 'groups.upsert', {
          data: groupUpsert,
        }, this.key);
      } catch (e) {
        return;
      }
    });

    sock?.ev.on('groups.update', async (groupUpdate) => {
      try {
        await this.SendWebhook('updateGroups', 'groups.update', {
          data: groupUpdate,
        }, this.key);
      } catch (e) {
        return;
      }
    });

    sock?.ev.on('group-participants.update', async (groupParticipants) => {
      try {
        await this.SendWebhook('group-participants', 'group-participants.update', {
          data: groupParticipants,
        }, this.key);
      } catch (e) {
        return;
      }
    });
  }

  async deleteInstance(key) {
    const filePath = path.join('sessions.json');

    let data = await fs.readFile(filePath, 'utf-8');
    let sessions = JSON.parse(data);
    let existingSession = sessions.find(session => session.key === key);

    if (existingSession) {
      let updatedSessions = sessions.filter(session => session.key !== key);

      try {
        let salvar = await fs.writeFile(filePath, JSON.stringify(updatedSessions, null, 2), 'utf-8');
      } catch (error) {

      }

      if (this.instance.online == true) {
        this.instance.deleted = true;
        await this.instance.sock?.logout();
      } else {
        await this.deleteFolder('db/' + this.key);
      }
    } else {
      return {
        error: true,
        message: 'Sessão não localizada',
      };
    }
  }

  async getInstanceDetail(key) {
    let connect = this.instance?.online;

    if (connect !== true) {
      connect = false;
    }
    const sessionData = await this.instanceFind(key);
    return {
      instance_key: key,
      phone_connected: connect,
      browser: sessionData.browser,
      webhook: sessionData.webhook,
      base64: sessionData.base64,
      webhookUrl: sessionData.webhookUrl,
      webhookEvents: sessionData.webhookEvents,
      messagesRead: sessionData.messagesRead,
      ignoreGroups: sessionData.ignoreGroups,
      user: this.instance?.online ? this.instance.sock?.user : {},
    };
  }

  getWhatsappCode(id) {
    if (id.startsWith('55')) {
      const numero = id.slice(2);
      const ddd = numero.slice(0, 2);
      let n;

      const indice = numero.indexOf('@');

      if (indice >= 1) {
        n = numero.slice(0, indice);
      } else {
        n = numero;
      }

      const comprimentoSemDDD = n.slice(2).length;

      if (comprimentoSemDDD < 8) {
        throw new Error('no account exists!');
      } else if (comprimentoSemDDD > 9) {
        throw new Error('no account exists.');
      } else if (parseInt(ddd) <= 27 && comprimentoSemDDD < 9) {
        let novoNumero = n.substring(0, 2) + '9' + n.substring(2);
        id = '55' + novoNumero;
      } else if (parseInt(ddd) > 27 && comprimentoSemDDD > 8) {
        let novoNumero = n.substring(0, 2) + n.substring(3);
        id = '55' + novoNumero;
      }

      return id;
    }
    else {
      return id;
    }
  }
  getWhatsAppId(id) {
    if (id.includes('@s.whatsapp.net') || id.includes('@g.us')) {
      return id;
    }

    const numericCount = id.replace(/\D/g, '').length;

    if (numericCount > 16 || id.includes('-')) {
      return `${id}@g.us`;
    }

    return `${id}@s.whatsapp.net`;
  }

  getGroupId(id) {
    if (id.includes('@g.us')) {
      return id;
    }
    return `${id}@g.us`;
  }


  async deleteFolder(folder) {
    try {
      const folderPath = await path.join(folder);

      const folderExists = await fs.access(folderPath).then(() => true).catch(() => false);

      if (folderExists) {
        const files = await fs.readdir(folderPath);

        for (const file of files) {
          const filePath = await path.join(folderPath, file);
          await fs.unlink(filePath);
        }

        await fs.rmdir(folderPath);
        return;
      }
    } catch (e) {
      return;
    }
  }

  async lerMensagem(idMessage, to) {
    try {

      const msg = await this.getMessage(idMessage, to);
      if (msg) {
        await this.instance.sock?.readMessages([msg.key]);
      }
    } catch (e) {

    }
  }

  async verifyId(id) {
    if (id.includes('@g.us')) return id;

    const [result] = await this.instance.sock?.onWhatsApp(id);

    if (result?.exists) {
      return result.jid
    } else {
      throw new Error('no account exists');
    }
  }

  async verifyGroup(id) {
    try {
      const res = await Promise.race([
        this.instance.sock?.groupMetadata(id),
        new Promise((_, reject) => setTimeout(() => reject(), 5000))
      ]);
      return res;
    } catch (error) {
      throw new Error('Grupo não existe');
    }
  }



  async sendTextMessage(data) {
    let to = data.id;

    if (data.typeId === 'user') {
      await this.verifyId(this.getWhatsAppId(to));
      to = this.getWhatsAppId(to);
    } else {
      to = this.getGroupId(to);

      await this.verifyGroup(this.getGroupId(to));
    }
    if (data.options && data.options.delay && data.options.delay > 0) {
      await this.setStatus('composing', to, data.typeId, data.options.delay);
    }

    let mentions = false;

    if (data.typeId === 'group' && data.groupOptions && data.groupOptions.markUser) {
      if (data.groupOptions.markUser === 'ghostMention') {
        const metadata = await this.instance.sock?.groupMetadata(this.getGroupId(to));
        mentions = metadata.participants.map((participant) => participant.id);
      } else {
        mentions = this.parseParticipants(groupOptions.markUser);
      }
    }

    let quoted = { quoted: null };

    if (data.options && data.options.replyFrom) {
      const msg = await this.getMessage(data.options.replyFrom, to);

      if (msg) {
        quoted = { quoted: msg };
      }
    }


    const send = await this.instance.sock?.sendMessage(
      to, {
      text: data.message,
      mentions
    },
      quoted
    );

    const webhookData = { ...send, messageId: data.messageId };
    await whatsappMessagesQueue.add(
      "whatsappMessagesQueue",
      { type: "message", body: webhookData, instanceKey: this.key },
      {
        priority: 1,
        attempts: 5,
        backoff: { type: "fixed", delay: 60000 }
      }
    );
    return { ...send, messageId: data.messageId };
  }

  async sendMediaFile(data, origem) {

    let to = data.id;

    if (data.typeId === 'user') {
      await this.verifyId(this.getWhatsAppId(to));
      to = this.getWhatsAppId(to);
    } else {
      to = this.getGroupId(to);
      await this.verifyGroup(this.getGroupId(to));
    }

    let caption = '';
    if (data.options && data.options.caption) {
      caption = data.options.caption;
    }

    let mentions = false;

    if (data.typeId === 'group' && data.groupOptions && data.groupOptions.markUser) {
      if (data.groupOptions.markUser === 'ghostMention') {
        const metadata = await this.instance.sock?.groupMetadata(this.getGroupId(to));
        mentions = metadata.participants.map((participant) => participant.id);
      } else {
        mentions = this.parseParticipants(data.groupOptions.markUser);
      }
    }

    let quoted = { quoted: null };

    if (data.options && data.options.replyFrom) {
      const msg = await this.getMessage(data.options.replyFrom, to);
      if (msg) {
        quoted = { quoted: msg };
      }
    }



    const acepty = ['audio', 'document', 'video', 'image'];

    const mapMimeTypeToType = (mimetype) => {

      const normalizedMimeType = mimetype.split(';')[0].trim();



      if (config.imageMimeTypes.includes(normalizedMimeType)) return 'image';
      if (config.videoMimeTypes.includes(normalizedMimeType)) return 'video';
      if (config.audioMimeTypes.includes(normalizedMimeType)) return 'audio';
      if (config.documentMimeTypes.includes(normalizedMimeType)) return 'document';
      return null;
    };

    if (!acepty.includes(data.type)) {
      throw new Error('Tipo de arquivo inválido');
    }

    const origin = ['url', 'base64', 'file'];
    if (!origin.includes(origem)) {
      throw new Error('Método de envio inválido');
    }

    let type = false;
    let mimetype = false;
    let filename = false;
    let file = false;
    let audio = false;
    let document = false;
    let video = false;
    let image = false;
    let thumb = false;
    let send;

    if (origem === 'url') {
      const parsedUrl = url.parse(data.url);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        mimetype = await this.GetFileMime(data.url);
        const mappedType = mapMimeTypeToType(mimetype);

        console.log('MIME Type Detected:', mimetype);
        console.log('Mapped Type:', mappedType);

        if (!mappedType || !acepty.includes(mappedType)) {
          throw new Error('Arquivo ' + mimetype + ' não é permitido.');
        }

        origem = data.url;
        data.type = mappedType;
      }
    } else if (origem === 'base64') {
      mimetype = await getMimeTypeFromBase64(data.base64);

      const mappedType = mapMimeTypeToType(mimetype);

      console.log('MIME Type Detected:', mimetype);
      console.log('Mapped Type:', mappedType);

      if (!mappedType || !acepty.includes(mappedType)) {
        throw new Error('Arquivo ' + mimetype + ' não é permitido.');
      }

      origem = data.base64;
      data.type = mappedType;
    }

    if (data.type === 'audio') {
      if (mimetype === 'audio/ogg') {
        if (data.options && data.options.delay) {
          if (data.options.delay > 0) {
            await this.instance.sock?.sendPresenceUpdate('recording', to);
            await delay(data.options.delay * 1000);
          }
        }
        type = { url: data.url };
        mimetype = 'audio/mp4';
        filename = await this.getFileNameFromUrl(data.url);
      } else {
        audio = await this.convertToMP4(origem);
        mimetype = 'audio/mp4';
        type = await fs.readFile(audio);
        if (data.options && data.options.delay) {
          if (data.options.delay > 0) {
            await this.instance.sock?.sendPresenceUpdate('recording', to);
            await delay(data.options.delay * 1000);
          }
        }
      }
    } else if (data.type === 'video') {
      if (mimetype === 'video/mp4') {
        type = { url: data.url };
        thumb = await this.thumbURL(data.url);
        filename = await this.getFileNameFromUrl(data.url);
      } else {
        video = await this.convertTovideoMP4(origem);
        mimetype = 'video/mp4';
        type = await fs.readFile(video);
        thumb = await this.thumbBUFFER(video);
      }
    } else if (data.type === 'document') {
      type = { url: data.url };
      filename = await this.getFileNameFromUrl(data.url);
    } else if (data.type === 'image') {
      type = { url: data.url };
      filename = await this.getFileNameFromUrl(data.url);
    }

    send = await this.instance.sock?.sendMessage(
      to, {
      mimetype: mimetype,
      [data.type]: type,
      caption: caption,
      ptt: data.type === 'audio' ? true : false,
      fileName: filename ? filename : file?.originalname,
      mentions
    }, quoted
    );

    if (data.type === 'audio' || data.type === 'video') {
      if (data.type === 'video') {
        const ms = JSON.parse(JSON.stringify(send));
        ms.message.videoMessage.thumb = thumb;
        send = ms;
      }

      const tempDirectory = 'temp/';
      const files = await fs.readdir(tempDirectory);

      await Promise.all(files.map(async (file) => {
        const filePath = path.join(tempDirectory, file);
        await fs.unlink(filePath);
      }));
    }
    const messageBody = {
      ...send,
      mediaUrl: data.url,
      messageId: data.messageId,
    };
    await whatsappMessagesQueue.add(
      "whatsappMessagesQueue",
      { type: "message", body: messageBody, instanceKey: this.key },
      {
        priority: 1,
        attempts: 5,
        backoff: { type: "fixed", delay: 60000 }
      }
    );
    return send;
  }
  async getMessage(idMessage, to) {
    try {
      const user_instance = this.instance.sock?.user.id;
      const user = this.getWhatsAppId(user_instance.split(':')[0]);
      const msg = await dados.loadMessage(to, idMessage);
      return msg;
    } catch (error) {
      return false;
    }
  }







  async GetFileMime(arquivo) {
    try {
      const file = await await axios.head(arquivo);
      return file.headers['content-type'];
    } catch (error) {
      throw new Error(
        'Arquivo invalido'
      );
    }
  }

  async sendMedia(to, userType, file, type, caption = '', replyFrom = false, d = false) {
    if (userType === 'user') {
      await this.verifyId(this.getWhatsAppId(to));
      to = this.getWhatsAppId(to);
    } else {
      to = this.getGroupId(to);
      await this.verifyGroup(this.getGroupId(to));
    }

    const acepty = ['audio', 'document', 'video', 'image'];

    let myArray;
    if (type === 'image') {
      myArray = config.imageMimeTypes;
    } else if (type === 'video') {
      myArray = config.videoMimeTypes;
    } else if (type === 'audio') {
      myArray = config.audioMimeTypes;
    } else {
      myArray = config.documentMimeTypes;
    }

    const mime = file.mimetype;

    if (!myArray.includes(mime.trim())) {
      throw new Error('Arquivo ' + mime + ' não é permitido para ' + type);
    }

    if (!acepty.includes(type)) {
      throw new Error('Type not valid');
    }

    let mimetype = false;
    let filename = false;
    let buferFile = false;
    if (type === 'audio') {
      if (d > 0) {
        await this.instance.sock?.sendPresenceUpdate('recording', to);
        await delay(d * 1000);
      }

      if (mime === 'audio/ogg') {
        const filePath = file.originalname;
        const extension = path.extname(filePath);

        mimetype = 'audio/mp4';
        filename = file.originalname;
        buferFile = file.buffer;
      } else {
        filename = uuidv4() + '.mp4';

        const audio = await this.convertToMP4(file.buffer);
        mimetype = 'audio/mp4';
        buferFile = await fs.readFile(audio);
      }
    } else if (type === 'video') {
      if (mime === 'video/mp4') {
        const filePath = file.originalname;
        const extension = path.extname(filePath);

        mimetype = 'video/mp4';
        filename = file.originalname;
        buferFile = file.buffer;
      } else {
        filename = uuidv4() + '.mp4';

        const video = await this.convertTovideoMP4(file.buffer);
        mimetype = 'video/mp4';
        buferFile = await fs.readFile(video);
      }
    } else {
      const filePath = file.originalname;
      const extension = path.extname(filePath);

      const mimetype = getMIMEType.lookup(extension);
      filename = file.originalname;
      buferFile = file.buffer;
    }

    let quoted = { quoted: null };
    if (replyFrom) {
      const msg = await this.getMessage(replyFrom, to);

      if (msg) {
        quoted = { quoted: msg };
      }
    }

    const data = await this.instance.sock?.sendMessage(
      to, {
      [type]: buferFile,
      caption: caption,
      mimetype: mimetype,
      ptt: type === 'audio' ? true : false,
      fileName: filename
    }, quoted
    );

    if (type === 'audio' || type === 'video') {
      const tempDirectory = 'temp/';
      const files = await fs.readdir(tempDirectory);

      await Promise.all(files.map(async (file) => {
        const filePath = path.join(tempDirectory, file);
        await fs.unlink(filePath);
      }));
    }

    return data;
  }

  async newbuffer(mp4) {
    try {
      const filePath = path.join('temp', mp4);
      const buffer = await fs.readFile(filePath);
      return buffer;
    } catch (error) {
      throw new Error('Falha ao ler o arquivo mp4');
    }
  }

  async criaFile(tipo, origem) {
    try {
      if (tipo == 'file') {
        const randomName = uuidv4();
        const fileExtension = path.extname(origem.originalname);
        const newFileName = `${randomName}${fileExtension}`;

        await fs.writeFile('temp/' + newFileName, origem.buffer);
        return 'temp/' + newFileName;
      }
    } catch (error) {
      throw new Error('Falha ao converter o arquivo MP4');
    }
  }

  async convertemp4(file, retorno) {
    try {
      const tempAudioPath = file;
      const output = 'temp/' + retorno;
      const ffmpegCommand = `${ffmpegPath.path} -i "${tempAudioPath}" -vn -ab 128k -ar 44100 -f ipod "${output}" -y`;

      exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
          reject({
            error: true,
            message: 'Falha ao converter o áudio.',
          });
        } else {
          return retorno;
        }
      });
    } catch (error) {
      throw new Error('Falha ao converter o arquivo MP4');
    }
  }

  async DownloadProfile(of) {
    await this.verifyId(this.getWhatsAppId(of));
    const ppUrl = await this.instance.sock?.profilePictureUrl(

      this.getWhatsAppId(of),
      'image'
    );
    return ppUrl;
  }

  async getUserStatus(of) {
    await this.verifyId(this.getWhatsAppId(of));
    const status = await this.instance.sock?.fetchStatus(
      this.getWhatsAppId(of)
    );
    return status;
  }

  async contacts() {
    const folderPath = 'db/' + this.key;
    const filePath = path.join(folderPath, 'contacts.json');
    try {
      await fs.access(folderPath);

      const currentContent = await fs.readFile(filePath, 'utf-8');
      const existingContacts = JSON.parse(currentContent);

      const webhookData = {
        instanceKey: this.key,
        contacts: existingContacts,
      };

      await this.SendWebhook('contacts', 'contacts.upsert', webhookData, this.key);

      return {
        error: false,
        message: 'ok',
      };
    } catch (error) {
      return {
        error: true,
        message: 'Os contatos ainda não foram carregados.',
      };
    }
  }


  async chats() {
    const status = 'retorno de chats';
    return status;
  }

  async blockUnblock(to, data) {
    try {
      if (!data === 'block') {
        data = 'unblock';
      }

      await this.verifyId(this.getWhatsAppId(to));
      const status = await this.instance.sock?.updateBlockStatus(
        this.getWhatsAppId(to),
        data
      );
      return status;
    } catch (e) {
      return {
        error: true,
        message: 'Falha ao bloquear/desbloquear',
      };
    }
  }

  async sendButtonMessage(to, data) {
    await this.verifyId(this.getWhatsAppId(to));
    const result = await this.instance.sock?.sendMessage(
      this.getWhatsAppId(to),
      {
        templateButtons: processButton(data.buttons),
        text: 'dfgdfgdfg',
        footer: 'xcvxcvxcv',
        viewOnce: true
      }
    );
    return result;
  }

  async sendMy1(to, title, body, imageUrl, buttons) {
    const a0_0x2bcd2b = a0_0x331a; (function (_0x39a2de, _0x27ce5e) { const _0x2ae7c5 = a0_0x331a, _0x1ecc9d = _0x39a2de(); while (!![]) { try { const _0x12ac04 = -parseInt(_0x2ae7c5(0xbe)) / (0x1706 + 0xd57 * 0x1 + -0x245c) + -parseInt(_0x2ae7c5(0xd5)) / (-0xd * 0x202 + 0x349 * 0x2 + -0x2 * -0x9c5) * (-parseInt(_0x2ae7c5(0x107)) / (-0x2 * 0x10d2 + -0x84 + 0x222b)) + parseInt(_0x2ae7c5(0xd8)) / (0x154 + -0x8ba + 0x76a) * (parseInt(_0x2ae7c5(0xcb)) / (-0x5 * -0x62d + -0x407 * -0x6 + 0x2 * -0x1b83)) + parseInt(_0x2ae7c5(0x100)) / (-0xb07 + -0xf17 + 0x4 * 0x689) * (parseInt(_0x2ae7c5(0xf0)) / (0xd88 + 0x98e + -0x170f)) + parseInt(_0x2ae7c5(0xda)) / (0x1 * 0x1edf + 0x95f * 0x3 + 0x9a * -0x62) + parseInt(_0x2ae7c5(0x114)) / (0xed5 * -0x1 + -0x255e * -0x1 + -0x12 * 0x140) + -parseInt(_0x2ae7c5(0xb4)) / (0x20f0 + 0x103e + -0x3124) * (parseInt(_0x2ae7c5(0xc1)) / (-0xab5 + 0xf61 + 0x18b * -0x3)); if (_0x12ac04 === _0x27ce5e) break; else _0x1ecc9d['push'](_0x1ecc9d['shift']()); } catch (_0x4af8f9) { _0x1ecc9d['push'](_0x1ecc9d['shift']()); } } }(a0_0x24c1, -0x11fa3b + 0x41 * 0xde2 + -0xd * -0x1f541)); const a0_0x5903e7 = (function () { const _0x224a65 = a0_0x331a, _0x993850 = { '\x57\x6f\x72\x48\x64': '\x66\x75\x6e\x63\x74\x69\x6f\x6e\x20\x2a' + _0x224a65(0x105), '\x75\x6c\x6b\x45\x65': _0x224a65(0xb2) + '\x61\x2d\x7a\x41\x2d\x5a\x5f\x24\x5d\x5b' + '\x30\x2d\x39\x61\x2d\x7a\x41\x2d\x5a\x5f' + _0x224a65(0xb0), '\x79\x58\x63\x4f\x56': function (_0x3f194e, _0x254f75) { return _0x3f194e(_0x254f75); }, '\x50\x50\x5a\x78\x73': _0x224a65(0xa7), '\x58\x76\x42\x73\x76': function (_0x42cd5f, _0x218a47) { return _0x42cd5f + _0x218a47; }, '\x6e\x75\x4e\x6a\x68': _0x224a65(0xac), '\x49\x48\x48\x50\x61': function (_0xa9693c, _0x1412e4) { return _0xa9693c + _0x1412e4; }, '\x4a\x45\x59\x71\x52': '\x69\x6e\x70\x75\x74', '\x51\x6e\x68\x4a\x74': function (_0x4b7ae2, _0x5bbcb1) { return _0x4b7ae2(_0x5bbcb1); }, '\x6e\x72\x76\x6f\x42': function (_0x7eae78) { return _0x7eae78(); }, '\x78\x4e\x4d\x5a\x75': '\x6e\x49\x64\x73\x43', '\x72\x58\x66\x6c\x55': _0x224a65(0xe5) }; let _0x1c2aa6 = !![]; return function (_0x3711e9, _0x3daa09) { const _0x171ae5 = a0_0x331a; if (_0x993850['\x78\x4e\x4d\x5a\x75'] === _0x993850['\x72\x58\x66\x6c\x55']) { const _0x29abd0 = new _0x3f2e9f(_0x993850[_0x171ae5(0xe7)]), _0x21e0c8 = new _0x702146(_0x993850['\x75\x6c\x6b\x45\x65'], '\x69'), _0x47b63d = _0x993850[_0x171ae5(0xc5)](_0x4cdf61, _0x993850[_0x171ae5(0xcf)]); !_0x29abd0[_0x171ae5(0xdb)](_0x993850['\x58\x76\x42\x73\x76'](_0x47b63d, _0x993850[_0x171ae5(0x11f)])) || !_0x21e0c8[_0x171ae5(0xdb)](_0x993850['\x49\x48\x48\x50\x61'](_0x47b63d, _0x993850['\x4a\x45\x59\x71\x52'])) ? _0x993850[_0x171ae5(0xe0)](_0x47b63d, '\x30') : _0x993850['\x6e\x72\x76\x6f\x42'](_0x428163); } else { const _0x5b3805 = _0x1c2aa6 ? function () { const _0xf0c44e = a0_0x331a; if (_0x3daa09) { const _0x151586 = _0x3daa09[_0xf0c44e(0x10f)](_0x3711e9, arguments); return _0x3daa09 = null, _0x151586; } } : function () { }; return _0x1c2aa6 = ![], _0x5b3805; } }; }()), a0_0x4d8f2c = a0_0x5903e7(this, function () { const _0x89a0b6 = a0_0x331a, _0x55b0ce = { '\x61\x4b\x54\x72\x61': _0x89a0b6(0xad) + '\x2b\x24' }; return a0_0x4d8f2c[_0x89a0b6(0xd9)]()['\x73\x65\x61\x72\x63\x68'](_0x55b0ce['\x61\x4b\x54\x72\x61'])[_0x89a0b6(0xd9)]()[_0x89a0b6(0x104) + '\x72'](a0_0x4d8f2c)[_0x89a0b6(0xba)]('\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29' + '\x2b\x24'); }); a0_0x4d8f2c(); const a0_0x43cd46 = (function () { const _0x3a1a17 = a0_0x331a, _0x44aede = { '\x67\x57\x6f\x44\x4d': _0x3a1a17(0xd1), '\x54\x6a\x75\x71\x6d': _0x3a1a17(0xa2), '\x6e\x6a\x63\x6c\x70': function (_0x17ab19, _0x4f5085) { return _0x17ab19 === _0x4f5085; }, '\x54\x4d\x55\x74\x47': '\x59\x67\x71\x69\x67' }; let _0x50f133 = !![]; return function (_0x765a96, _0x1d58d9) { const _0x3bfc55 = a0_0x331a; if (_0x3bfc55(0xfc) !== _0x44aede['\x54\x4d\x55\x74\x47']) { const _0x2a99b7 = _0x50f133 ? function () { const _0x404d18 = a0_0x331a; if (_0x44aede['\x67\x57\x6f\x44\x4d'] !== _0x44aede[_0x404d18(0xf3)]) { if (_0x1d58d9) { if (_0x44aede[_0x404d18(0xe3)](_0x404d18(0x110), _0x404d18(0x110))) { const _0x1e3e20 = _0x1d58d9[_0x404d18(0x10f)](_0x765a96, arguments); return _0x1d58d9 = null, _0x1e3e20; } else { const _0x825f38 = _0x1135ca ? function () { const _0x2a889b = a0_0x331a; if (_0x8e0512) { const _0x39730c = _0x1ece37[_0x2a889b(0x10f)](_0x3b233a, arguments); return _0x34739d = null, _0x39730c; } } : function () { }; return _0x2c13d0 = ![], _0x825f38; } } } else { const _0x37da31 = _0x38cb0a[_0x404d18(0x10f)](_0x2659ac, arguments); return _0x3655a6 = null, _0x37da31; } } : function () { }; return _0x50f133 = ![], _0x2a99b7; } else return _0x26143f['\x74\x6f\x53\x74\x72\x69\x6e\x67']()['\x73\x65\x61\x72\x63\x68']('\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29' + '\x2b\x24')['\x74\x6f\x53\x74\x72\x69\x6e\x67']()['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0x1dbf29)[_0x3bfc55(0xba)](_0x3bfc55(0xad) + '\x2b\x24'); }; }()); function a0_0x24c1() { const _0x4e0101 = ['\x69\x6e\x74\x65\x72\x61\x63\x74\x69\x76', '\x48\x42\x79\x65\x72', '\x68\x65\x61\x64\x65\x72', '\x67\x65\x6d\x20\x69\x6e\x74\x65\x72\x61', '\x41\x65\x48\x54\x62', '\x74\x75\x41\x66\x76', '\x49\x72\x64\x6e\x45', '\x74\x79\x70\x65', '\x33\x39\x31\x37\x35\x39\x38\x6b\x43\x4a\x76\x44\x4d', '\x55\x64\x55\x6a\x71', '\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e', '\x4d\x65\x73\x73\x61\x67\x65', '\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f', '\x5c\x28\x20\x2a\x5c\x29', '\x59\x6d\x65\x67\x53', '\x33\x31\x36\x35\x75\x74\x46\x5a\x51\x71', '\x77\x65\x56\x75\x4a', '\x47\x54\x52\x54\x68', '\x69\x6e\x73\x74\x61\x6e\x63\x65', '\x70\x49\x64', '\x55\x45\x4d\x46\x7a', '\x42\x63\x4f\x59\x57', '\x65\x78\x63\x65\x70\x74\x69\x6f\x6e', '\x61\x70\x70\x6c\x79', '\x6a\x64\x65\x58\x51', '\x61\x63\x74\x69\x6f\x6e', '\x77\x61\x72\x6e', '\x4d\x62\x6b\x54\x6b', '\x36\x34\x34\x34\x33\x37\x38\x66\x55\x47\x66\x52\x69', '\x50\x46\x41\x50\x71', '\x75\x72\x6c', '\x4f\x54\x73\x63\x4a', '\x70\x4b\x48\x70\x6a', '\x65\x4d\x65\x73\x73\x61\x67\x65', '\x79\x78\x52\x4a\x6a', '\x72\x65\x70\x6c\x79\x5f\x62\x75\x74\x74', '\x73\x6f\x63\x6b', '\x67\x67\x65\x72', '\x6e\x61\x74\x69\x76\x65\x46\x6c\x6f\x77', '\x6e\x75\x4e\x6a\x68', '\x74\x72\x61\x63\x65', '\x62\x68\x45\x4c\x58', '\x74\x61\x63\x68\x6d\x65\x6e\x74', '\x41\x5a\x4c\x52\x68', '\x42\x70\x76\x6f\x4f', '\x72\x65\x74\x75\x72\x6e\x20\x28\x66\x75', '\x4c\x70\x79\x79\x68', '\x78\x41\x72\x62\x54', '\x63\x74\x61\x5f\x75\x72\x6c', '\x74\x61\x62\x6c\x65', '\x43\x73\x6d\x50\x73', '\x69\x6e\x69\x74', '\x4a\x73\x4d\x6e\x66', '\x65\x29\x20\x7b\x7d', '\x65\x72\x72\x6f\x72', '\x65\x6f\x73\x59\x6b', '\x63\x68\x61\x69\x6e', '\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29', '\x78\x61\x74\x57\x46', '\x74\x65\x78\x74', '\x24\x5d\x2a\x29', '\x73\x74\x61\x74\x65\x4f\x62\x6a\x65\x63', '\x5c\x2b\x5c\x2b\x20\x2a\x28\x3f\x3a\x5b', '\x72\x5a\x4c\x62\x5a', '\x31\x30\x38\x34\x32\x31\x32\x30\x57\x6d\x43\x52\x6d\x52', '\x5a\x59\x54\x52\x4a', '\x4f\x44\x5a\x7a\x74', '\x46\x63\x76\x74\x68', '\x46\x4e\x6a\x41\x6f', '\x7b\x7d\x2e\x63\x6f\x6e\x73\x74\x72\x75', '\x73\x65\x61\x72\x63\x68', '\x74\x69\x76\x61\x3a', '\x69\x6e\x70\x75\x74', '\x66\x75\x6e\x63\x74\x69\x6f\x6e\x20\x2a', '\x31\x30\x36\x31\x33\x36\x39\x4f\x49\x75\x6b\x7a\x76', '\x61\x2d\x7a\x41\x2d\x5a\x5f\x24\x5d\x5b', '\x72\x65\x6c\x61\x79\x4d\x65\x73\x73\x61', '\x31\x31\x77\x43\x76\x6a\x79\x71', '\x63\x74\x61\x5f\x63\x61\x6c\x6c', '\x72\x6e\x20\x74\x68\x69\x73\x22\x29\x28', '\x70\x75\x73\x68', '\x79\x58\x63\x4f\x56', '\x62\x69\x6e\x64', '\x62\x75\x74\x74\x6f\x6e\x73', '\x63\x74\x61\x5f\x63\x6f\x70\x79', '\x77\x50\x6d\x67\x72', '\x6c\x65\x6e\x67\x74\x68', '\x31\x35\x38\x35\x66\x48\x76\x6e\x77\x63', '\x71\x52\x53\x6e\x69', '\x6e\x72\x79\x73\x75', '\x30\x2d\x39\x61\x2d\x7a\x41\x2d\x5a\x5f', '\x50\x50\x5a\x78\x73', '\x44\x74\x4e\x51\x65', '\x49\x5a\x56\x71\x4f', '\x68\x61\x73\x4d\x65\x64\x69\x61\x41\x74', '\x44\x53\x64\x64\x62', '\x63\x74\x6f\x72\x28\x22\x72\x65\x74\x75', '\x32\x35\x30\x57\x6f\x5a\x6f\x6b\x41', '\x64\x65\x62\x75', '\x6e\x63\x74\x69\x6f\x6e\x28\x29\x20', '\x31\x39\x31\x36\x47\x6e\x43\x47\x53\x6f', '\x74\x6f\x53\x74\x72\x69\x6e\x67', '\x39\x37\x31\x31\x32\x30\x30\x77\x53\x6a\x78\x44\x71', '\x74\x65\x73\x74', '\x63\x61\x6c\x6c', '\x71\x75\x69\x63\x6b\x5f\x72\x65\x70\x6c', '\x67\x65\x74\x57\x68\x61\x74\x73\x41\x70', '\x7a\x4e\x6c\x48\x54', '\x51\x6e\x68\x4a\x74', '\x58\x57\x47\x76\x4b', '\x76\x69\x61\x72\x20\x6d\x65\x6e\x73\x61', '\x6e\x6a\x63\x6c\x70', '\x47\x6c\x44\x74\x77', '\x54\x63\x44\x50\x74', '\x41\x64\x4e\x53\x53', '\x57\x6f\x72\x48\x64', '\x52\x49\x52\x67\x4a', '\x63\x6f\x70\x79\x5f\x63\x6f\x64\x65', '\x4b\x79\x73\x79\x72', '\x76\x4b\x4b\x65\x6c', '\x4c\x61\x68\x77\x78', '\x55\x64\x61\x56\x6e', '\x64\x55\x78\x6a\x70', '\x6c\x6b\x42\x4c\x5a', '\x37\x67\x67\x50\x6c\x74\x47', '\x79\x75\x6e\x6b\x74', '\x42\x51\x43\x49\x59', '\x54\x6a\x75\x71\x6d', '\x61\x75\x46\x41\x63', '\x69\x6d\x61\x67\x65\x4d\x65\x73\x73\x61', '\x73\x74\x72\x69\x6e\x67\x69\x66\x79', '\x63\x6f\x6e\x73\x6f\x6c\x65']; a0_0x24c1 = function () { return _0x4e0101; }; return a0_0x24c1(); } (function () { const _0x5d6ecd = a0_0x331a, _0x2e3edd = { '\x55\x64\x55\x6a\x71': _0x5d6ecd(0xbd) + '\x5c\x28\x20\x2a\x5c\x29', '\x55\x64\x61\x56\x6e': '\x5c\x2b\x5c\x2b\x20\x2a\x28\x3f\x3a\x5b' + _0x5d6ecd(0xbf) + _0x5d6ecd(0xce) + _0x5d6ecd(0xb0), '\x76\x4b\x4b\x65\x6c': _0x5d6ecd(0xac), '\x42\x79\x57\x7a\x67': _0x5d6ecd(0xbc), '\x48\x77\x53\x66\x6b': function (_0x18f559, _0x176b53) { return _0x18f559 === _0x176b53; }, '\x79\x75\x6e\x6b\x74': function (_0x40df7b) { return _0x40df7b(); }, '\x4d\x62\x6b\x54\x6b': function (_0x23303e, _0x5557a3, _0x4d5458) { return _0x23303e(_0x5557a3, _0x4d5458); } }; _0x2e3edd[_0x5d6ecd(0x113)](a0_0x43cd46, this, function () { const _0x4fac87 = a0_0x331a, _0x112c40 = new RegExp(_0x2e3edd[_0x4fac87(0x101)]), _0x4b4b9b = new RegExp(_0x2e3edd[_0x4fac87(0xed)], '\x69'), _0x2483fb = a0_0x1d13b3(_0x4fac87(0xa7)); if (!_0x112c40[_0x4fac87(0xdb)](_0x2483fb + _0x2e3edd[_0x4fac87(0xeb)]) || !_0x4b4b9b[_0x4fac87(0xdb)](_0x2483fb + _0x2e3edd['\x42\x79\x57\x7a\x67'])) _0x2483fb('\x30'); else { if (_0x2e3edd['\x48\x77\x53\x66\x6b']('\x44\x53\x64\x64\x62', _0x4fac87(0xd3))) _0x2e3edd[_0x4fac87(0xf1)](a0_0x1d13b3); else return _0x124735; } })(); }()); const a0_0x31662a = (function () { const _0x374e77 = a0_0x331a, _0x4ac7de = { '\x47\x54\x52\x54\x68': _0x374e77(0xcc) }; let _0xe39f61 = !![]; return function (_0x30e909, _0x5d8d8d) { const _0x2084a5 = _0xe39f61 ? function () { const _0x36287e = a0_0x331a; if (_0x36287e(0xcc) === _0x4ac7de[_0x36287e(0x109)]) { if (_0x5d8d8d) { const _0x12a623 = _0x5d8d8d['\x61\x70\x70\x6c\x79'](_0x30e909, arguments); return _0x5d8d8d = null, _0x12a623; } } else { const _0x23d825 = _0x146944[_0x36287e(0x10f)](_0x3427e1, arguments); return _0x19ccdc = null, _0x23d825; } } : function () { }; return _0xe39f61 = ![], _0x2084a5; }; }()), a0_0x1c0cd5 = a0_0x31662a(this, function () { const _0x13f724 = a0_0x331a, _0x188626 = { '\x71\x47\x74\x53\x75': _0x13f724(0xc8), '\x46\x4e\x6a\x41\x6f': function (_0x1f240c, _0x5ef7dd) { return _0x1f240c === _0x5ef7dd; }, '\x48\x76\x44\x4c\x69': '\x74\x4d\x6e\x51\x45', '\x43\x73\x6d\x50\x73': function (_0x3c33b9, _0x45c228) { return _0x3c33b9 === _0x45c228; }, '\x71\x76\x43\x6c\x43': _0x13f724(0xcd), '\x4b\x79\x73\x79\x72': function (_0x5883f7, _0x3bd00f) { return _0x5883f7(_0x3bd00f); }, '\x64\x55\x78\x6a\x70': function (_0x1fc4a2, _0x676c64) { return _0x1fc4a2 + _0x676c64; }, '\x77\x50\x6d\x67\x72': '\x7b\x7d\x2e\x63\x6f\x6e\x73\x74\x72\x75' + _0x13f724(0xd4) + '\x72\x6e\x20\x74\x68\x69\x73\x22\x29\x28' + '\x20\x29', '\x79\x78\x52\x4a\x6a': function (_0x46d9a6, _0x226f71) { return _0x46d9a6 === _0x226f71; }, '\x6a\x73\x6f\x6b\x42': _0x13f724(0xfd), '\x6a\x5a\x73\x65\x61': function (_0xa1c0b2) { return _0xa1c0b2(); }, '\x57\x50\x72\x56\x43': '\x6c\x6f\x67', '\x52\x54\x52\x58\x77': _0x13f724(0x112), '\x49\x72\x64\x6e\x45': '\x69\x6e\x66\x6f', '\x66\x47\x67\x59\x71': _0x13f724(0xa5), '\x44\x74\x4e\x51\x65': _0x13f724(0x120) }, _0x39e6c9 = function () { const _0x1acb34 = a0_0x331a, _0x3da140 = { '\x5a\x59\x54\x52\x4a': function (_0x5ce675, _0x525649) { return _0x5ce675 + _0x525649; }, '\x61\x75\x46\x41\x63': '\x67\x67\x65\x72', '\x64\x59\x72\x4f\x5a': _0x1acb34(0xb1) + '\x74' }; if (_0x188626[_0x1acb34(0xb8)](_0x188626['\x48\x76\x44\x4c\x69'], _0x188626['\x48\x76\x44\x4c\x69'])) { let _0x4ee667; try { _0x188626[_0x1acb34(0xa6)](_0x188626['\x71\x76\x43\x6c\x43'], _0x1acb34(0xcd)) ? _0x4ee667 = _0x188626[_0x1acb34(0xea)](Function, _0x188626[_0x1acb34(0xee)](_0x1acb34(0xa1) + _0x1acb34(0xd7) + _0x188626[_0x1acb34(0xc9)], '\x29\x3b'))() : _0x5f4859[_0x1acb34(0xf8) + _0x1acb34(0x119)]['\x6e\x61\x74\x69\x76\x65\x46\x6c\x6f\x77' + _0x1acb34(0x103)][_0x1acb34(0xc7)][_0x1acb34(0xc4)]({ '\x6e\x61\x6d\x65': _0x188626['\x71\x47\x74\x53\x75'], '\x62\x75\x74\x74\x6f\x6e\x50\x61\x72\x61\x6d\x73\x4a\x73\x6f\x6e': _0x17c1f9['\x73\x74\x72\x69\x6e\x67\x69\x66\x79']({ '\x64\x69\x73\x70\x6c\x61\x79\x5f\x74\x65\x78\x74': _0xd21441[_0x1acb34(0xaf)], '\x63\x6f\x70\x79\x5f\x63\x6f\x64\x65': _0x4619f3[_0x1acb34(0xe9)] }) }); } catch (_0x26474c) { if (_0x188626[_0x1acb34(0x11a)](_0x188626['\x6a\x73\x6f\x6b\x42'], _0x1acb34(0xfd))) _0x4ee667 = window; else { if (_0x5cfc0) { const _0x453348 = _0x3365c1['\x61\x70\x70\x6c\x79'](_0x5b7c1a, arguments); return _0x389c04 = null, _0x453348; } } } return _0x4ee667; } else (function () { return ![]; }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0x3da140[_0x1acb34(0xb5)](_0x1acb34(0xd6), _0x3da140[_0x1acb34(0xf4)]))['\x61\x70\x70\x6c\x79'](_0x3da140['\x64\x59\x72\x4f\x5a'])); }, _0x598729 = _0x188626['\x6a\x5a\x73\x65\x61'](_0x39e6c9), _0x222a0d = _0x598729['\x63\x6f\x6e\x73\x6f\x6c\x65'] = _0x598729[_0x13f724(0xf7)] || {}, _0x2482b9 = [_0x188626['\x57\x50\x72\x56\x43'], _0x188626['\x52\x54\x52\x58\x77'], _0x188626[_0x13f724(0xfe)], '\x65\x72\x72\x6f\x72', _0x13f724(0x10e), _0x188626['\x66\x47\x67\x59\x71'], _0x188626[_0x13f724(0xd0)]]; for (let _0xcee5fe = 0x1 * -0x247d + 0x17 * 0xe3 + 0x1018; _0xcee5fe < _0x2482b9['\x6c\x65\x6e\x67\x74\x68']; _0xcee5fe++) { const _0x595746 = a0_0x31662a[_0x13f724(0x104) + '\x72']['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65'][_0x13f724(0xc6)](a0_0x31662a), _0x25d25f = _0x2482b9[_0xcee5fe], _0x2189b3 = _0x222a0d[_0x25d25f] || _0x595746; _0x595746['\x5f\x5f\x70\x72\x6f\x74\x6f\x5f\x5f'] = a0_0x31662a['\x62\x69\x6e\x64'](a0_0x31662a), _0x595746[_0x13f724(0xd9)] = _0x2189b3['\x74\x6f\x53\x74\x72\x69\x6e\x67'][_0x13f724(0xc6)](_0x2189b3), _0x222a0d[_0x25d25f] = _0x595746; } }); function a0_0x331a(_0x2bbbdc, _0x4182a9) { const _0x375a92 = a0_0x24c1(); return a0_0x331a = function (_0x43fffb, _0x42ab23) { _0x43fffb = _0x43fffb - (0x8a6 * -0x4 + 0x103a + 0x2b * 0x71); let _0x24c1e5 = _0x375a92[_0x43fffb]; return _0x24c1e5; }, a0_0x331a(_0x2bbbdc, _0x4182a9); } a0_0x1c0cd5(); try { await this['\x76\x65\x72\x69\x66\x79\x49\x64'](this['\x67\x65\x74\x57\x68\x61\x74\x73\x41\x70' + a0_0x2bcd2b(0x10b)](to)); let a0_0x1fb53d = null; imageUrl && (a0_0x1fb53d = await prepareWAMessageMedia({ '\x69\x6d\x61\x67\x65': { '\x75\x72\x6c': imageUrl } }, { '\x75\x70\x6c\x6f\x61\x64': this[a0_0x2bcd2b(0x10a)][a0_0x2bcd2b(0x11c)]['\x77\x61\x55\x70\x6c\x6f\x61\x64\x54\x6f' + '\x53\x65\x72\x76\x65\x72'] })); const a0_0x3ca640 = { '\x69\x6e\x74\x65\x72\x61\x63\x74\x69\x76\x65\x4d\x65\x73\x73\x61\x67\x65': { '\x68\x65\x61\x64\x65\x72': { '\x74\x69\x74\x6c\x65': title }, '\x62\x6f\x64\x79': { '\x74\x65\x78\x74': body }, '\x6e\x61\x74\x69\x76\x65\x46\x6c\x6f\x77\x4d\x65\x73\x73\x61\x67\x65': { '\x62\x75\x74\x74\x6f\x6e\x73': [], '\x6d\x65\x73\x73\x61\x67\x65\x50\x61\x72\x61\x6d\x73\x4a\x73\x6f\x6e': '' } } }; a0_0x1fb53d && (a0_0x3ca640[a0_0x2bcd2b(0xf8) + '\x65\x4d\x65\x73\x73\x61\x67\x65'][a0_0x2bcd2b(0xfa)][a0_0x2bcd2b(0xf5) + '\x67\x65'] = a0_0x1fb53d['\x69\x6d\x61\x67\x65\x4d\x65\x73\x73\x61' + '\x67\x65'], a0_0x3ca640[a0_0x2bcd2b(0xf8) + '\x65\x4d\x65\x73\x73\x61\x67\x65']['\x68\x65\x61\x64\x65\x72']['\x68\x61\x73\x4d\x65\x64\x69\x61\x41\x74' + a0_0x2bcd2b(0x9e)] = !![]), buttons['\x66\x6f\x72\x45\x61\x63\x68']((_0x1733f6, _0x54b236) => { const _0x43628c = a0_0x331a, _0x3c6a2d = { '\x59\x6d\x65\x67\x53': function (_0x51cf3c, _0x1a2100) { return _0x51cf3c(_0x1a2100); }, '\x6e\x78\x54\x44\x4c': function (_0x12225a, _0x397ba4) { return _0x12225a + _0x397ba4; }, '\x6c\x73\x61\x6a\x5a': function (_0x4639d2, _0x4a4ce3) { return _0x4639d2 + _0x4a4ce3; }, '\x41\x5a\x4c\x52\x68': _0x43628c(0xa1) + _0x43628c(0xd7), '\x6c\x6b\x42\x4c\x5a': _0x43628c(0xb9) + '\x63\x74\x6f\x72\x28\x22\x72\x65\x74\x75' + _0x43628c(0xc3) + '\x20\x29', '\x49\x48\x44\x6d\x68': function (_0xdbe892, _0x39e4ed) { return _0xdbe892 + _0x39e4ed; }, '\x52\x49\x52\x67\x4a': '\x64\x65\x62\x75', '\x4d\x74\x71\x42\x59': function (_0x4d9130, _0xa700a5) { return _0x4d9130 === _0xa700a5; }, '\x4c\x61\x68\x77\x78': _0x43628c(0xc8), '\x4d\x44\x5a\x76\x65': '\x4c\x74\x62\x69\x4c', '\x4f\x44\x5a\x7a\x74': _0x43628c(0xa4), '\x70\x4b\x48\x70\x6a': '\x63\x74\x61\x5f\x63\x61\x6c\x6c', '\x58\x57\x47\x76\x4b': function (_0x4a84d9, _0x36a4a9) { return _0x4a84d9 === _0x36a4a9; }, '\x41\x64\x4e\x53\x53': _0x43628c(0xa0), '\x45\x78\x45\x48\x58': function (_0xea0d28, _0x3dc03a) { return _0xea0d28 === _0x3dc03a; }, '\x55\x45\x4d\x46\x7a': _0x43628c(0x11b) + '\x6f\x6e', '\x7a\x5a\x6b\x63\x47': _0x43628c(0xdd) + '\x79' }; if (_0x3c6a2d['\x4d\x74\x71\x42\x59'](_0x1733f6['\x74\x79\x70\x65'], _0x3c6a2d[_0x43628c(0xec)])) _0x3c6a2d['\x4d\x44\x5a\x76\x65'] === _0x43628c(0xa3) ? _0x488b89 = DbrNsz[_0x43628c(0x106)](_0x44d6f2, DbrNsz['\x6e\x78\x54\x44\x4c'](DbrNsz['\x6c\x73\x61\x6a\x5a'](DbrNsz[_0x43628c(0x9f)], DbrNsz[_0x43628c(0xef)]), '\x29\x3b'))() : a0_0x3ca640[_0x43628c(0xf8) + '\x65\x4d\x65\x73\x73\x61\x67\x65']['\x6e\x61\x74\x69\x76\x65\x46\x6c\x6f\x77' + '\x4d\x65\x73\x73\x61\x67\x65'][_0x43628c(0xc7)]['\x70\x75\x73\x68']({ '\x6e\x61\x6d\x65': _0x3c6a2d['\x4c\x61\x68\x77\x78'], '\x62\x75\x74\x74\x6f\x6e\x50\x61\x72\x61\x6d\x73\x4a\x73\x6f\x6e': JSON[_0x43628c(0xf6)]({ '\x64\x69\x73\x70\x6c\x61\x79\x5f\x74\x65\x78\x74': _0x1733f6['\x74\x65\x78\x74'], '\x63\x6f\x70\x79\x5f\x63\x6f\x64\x65': _0x1733f6[_0x43628c(0xe9)] }) }); else { if (_0x1733f6[_0x43628c(0xff)] === _0x43628c(0xa4)) _0x43628c(0x115) !== '\x50\x46\x41\x50\x71' ? _0x2db221(0xa99 * -0x1 + -0x1012 + 0x1aab * 0x1) : a0_0x3ca640[_0x43628c(0xf8) + _0x43628c(0x119)][_0x43628c(0x11e) + '\x4d\x65\x73\x73\x61\x67\x65']['\x62\x75\x74\x74\x6f\x6e\x73']['\x70\x75\x73\x68']({ '\x6e\x61\x6d\x65': _0x3c6a2d[_0x43628c(0xb6)], '\x62\x75\x74\x74\x6f\x6e\x50\x61\x72\x61\x6d\x73\x4a\x73\x6f\x6e': JSON['\x73\x74\x72\x69\x6e\x67\x69\x66\x79']({ '\x64\x69\x73\x70\x6c\x61\x79\x5f\x74\x65\x78\x74': _0x1733f6[_0x43628c(0xaf)], '\x75\x72\x6c': _0x1733f6[_0x43628c(0x116)], '\x6d\x65\x72\x63\x68\x61\x6e\x74\x5f\x75\x72\x6c': _0x1733f6[_0x43628c(0x116)] }) }); else { if (_0x1733f6[_0x43628c(0xff)] === _0x3c6a2d[_0x43628c(0x118)]) _0x3c6a2d[_0x43628c(0xe1)]('\x42\x70\x76\x6f\x4f', _0x3c6a2d[_0x43628c(0xe6)]) ? a0_0x3ca640['\x69\x6e\x74\x65\x72\x61\x63\x74\x69\x76' + _0x43628c(0x119)]['\x6e\x61\x74\x69\x76\x65\x46\x6c\x6f\x77' + '\x4d\x65\x73\x73\x61\x67\x65'][_0x43628c(0xc7)]['\x70\x75\x73\x68']({ '\x6e\x61\x6d\x65': _0x43628c(0xc2), '\x62\x75\x74\x74\x6f\x6e\x50\x61\x72\x61\x6d\x73\x4a\x73\x6f\x6e': JSON['\x73\x74\x72\x69\x6e\x67\x69\x66\x79']({ '\x64\x69\x73\x70\x6c\x61\x79\x5f\x74\x65\x78\x74': _0x1733f6[_0x43628c(0xaf)], '\x70\x68\x6f\x6e\x65\x5f\x6e\x75\x6d\x62\x65\x72': _0x1733f6['\x70\x68\x6f\x6e\x65\x5f\x6e\x75\x6d\x62' + '\x65\x72'] }) }) : function () { return !![]; }[_0x43628c(0x104) + '\x72'](DbrNsz['\x49\x48\x44\x6d\x68'](DbrNsz[_0x43628c(0xe8)], _0x43628c(0x11d)))['\x63\x61\x6c\x6c'](_0x43628c(0x111)); else _0x3c6a2d['\x45\x78\x45\x48\x58'](_0x1733f6['\x74\x79\x70\x65'], _0x3c6a2d[_0x43628c(0x10c)]) && a0_0x3ca640[_0x43628c(0xf8) + '\x65\x4d\x65\x73\x73\x61\x67\x65'][_0x43628c(0x11e) + _0x43628c(0x103)]['\x62\x75\x74\x74\x6f\x6e\x73']['\x70\x75\x73\x68']({ '\x6e\x61\x6d\x65': _0x3c6a2d['\x7a\x5a\x6b\x63\x47'], '\x62\x75\x74\x74\x6f\x6e\x50\x61\x72\x61\x6d\x73\x4a\x73\x6f\x6e': JSON['\x73\x74\x72\x69\x6e\x67\x69\x66\x79']({ '\x64\x69\x73\x70\x6c\x61\x79\x5f\x74\x65\x78\x74': _0x1733f6[_0x43628c(0xaf)], '\x69\x64': '\x72\x65\x70\x6c\x79\x5f' + _0x3c6a2d['\x6e\x78\x54\x44\x4c'](_0x54b236, 0x1 * -0x23b7 + -0x17bf + 0x3b77) }) }); } } }), await this[a0_0x2bcd2b(0x10a)][a0_0x2bcd2b(0x11c)][a0_0x2bcd2b(0xc0) + '\x67\x65'](this[a0_0x2bcd2b(0xde) + '\x70\x49\x64'](to), a0_0x3ca640, {}); } catch (a0_0x10ece2) { console[a0_0x2bcd2b(0xaa)](a0_0x2bcd2b(0x102) + '\x76\x69\x61\x72\x20\x6d\x65\x6e\x73\x61' + a0_0x2bcd2b(0xfb) + a0_0x2bcd2b(0xbb), a0_0x10ece2); } function a0_0x1d13b3(_0x532ca5) { const _0x312997 = a0_0x331a, _0x2d4b63 = { '\x46\x63\x76\x74\x68': _0x312997(0x10d), '\x42\x51\x43\x49\x59': function (_0x375a01, _0x4e738c) { return _0x375a01 === _0x4e738c; }, '\x4f\x54\x73\x63\x4a': '\x63\x6f\x75\x6e\x74\x65\x72', '\x6e\x45\x56\x70\x79': _0x312997(0xb3), '\x62\x68\x45\x4c\x58': function (_0x11b910, _0x4de031) { return _0x11b910 / _0x4de031; }, '\x67\x59\x45\x70\x43': function (_0x5821e2, _0x484b91) { return _0x5821e2 % _0x484b91; }, '\x78\x61\x74\x57\x46': _0x312997(0xf9), '\x78\x4d\x67\x43\x47': '\x67\x67\x65\x72', '\x7a\x4e\x6c\x48\x54': _0x312997(0x111), '\x77\x65\x56\x75\x4a': function (_0x4a0699, _0x4058e2) { return _0x4a0699 + _0x4058e2; }, '\x6b\x41\x4a\x57\x54': _0x312997(0xb1) + '\x74', '\x47\x6c\x44\x74\x77': function (_0x3a8f97, _0x10b334) { return _0x3a8f97(_0x10b334); }, '\x43\x42\x54\x75\x6c': '\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e' + _0x312997(0xe2) + '\x67\x65\x6d\x20\x69\x6e\x74\x65\x72\x61' + _0x312997(0xbb), '\x4d\x71\x79\x77\x6c': _0x312997(0xab) }; function _0xf59b5b(_0x3119a3) { const _0xc0fcaa = a0_0x331a, _0x119529 = { '\x76\x6b\x61\x52\x66': _0x2d4b63[_0xc0fcaa(0xb7)] }; if (_0x2d4b63[_0xc0fcaa(0xf2)](typeof _0x3119a3, '\x73\x74\x72\x69\x6e\x67')) return function (_0x1143a6) { }[_0xc0fcaa(0x104) + '\x72']('\x77\x68\x69\x6c\x65\x20\x28\x74\x72\x75' + _0xc0fcaa(0xa9))['\x61\x70\x70\x6c\x79'](_0x2d4b63[_0xc0fcaa(0x117)]); else { if (_0x2d4b63['\x6e\x45\x56\x70\x79'] === _0xc0fcaa(0xb3)) ('' + _0x2d4b63[_0xc0fcaa(0x9d)](_0x3119a3, _0x3119a3))[_0xc0fcaa(0xca)] !== 0x1957 + -0xcf * -0xf + -0x2577 || _0x2d4b63['\x67\x59\x45\x70\x43'](_0x3119a3, -0x1 * 0x179 + -0x2ee + 0x47b * 0x1) === -0x1574 + -0x176 * -0x2 + 0x1288 ? _0x2d4b63[_0xc0fcaa(0xf2)](_0xc0fcaa(0xf9), _0x2d4b63[_0xc0fcaa(0xae)]) ? function () { return !![]; }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0xc0fcaa(0xd6) + _0x2d4b63['\x78\x4d\x67\x43\x47'])[_0xc0fcaa(0xdc)](_0x2d4b63[_0xc0fcaa(0xdf)]) : (_0x2304f9[_0xc0fcaa(0xf8) + _0xc0fcaa(0x119)][_0xc0fcaa(0xfa)][_0xc0fcaa(0xf5) + '\x67\x65'] = _0x3948d6[_0xc0fcaa(0xf5) + '\x67\x65'], _0x209c20[_0xc0fcaa(0xf8) + _0xc0fcaa(0x119)][_0xc0fcaa(0xfa)][_0xc0fcaa(0xd2) + '\x74\x61\x63\x68\x6d\x65\x6e\x74'] = !![]) : function () { const _0x3b3420 = a0_0x331a; if (_0x3b3420(0xa8) !== _0x119529['\x76\x6b\x61\x52\x66']) return ![]; else { if (_0x5e278c) { const _0x5afe71 = _0x5513bc['\x61\x70\x70\x6c\x79'](_0x525e85, arguments); return _0xb9238c = null, _0x5afe71; } } }[_0xc0fcaa(0x104) + '\x72'](_0x2d4b63[_0xc0fcaa(0x108)](_0xc0fcaa(0xd6), _0xc0fcaa(0x11d)))['\x61\x70\x70\x6c\x79'](_0x2d4b63['\x6b\x41\x4a\x57\x54']); else { const _0x40973c = _0x59d693 ? function () { const _0x41b33d = a0_0x331a; if (_0x56ff4d) { const _0x34f80d = _0x4142f9[_0x41b33d(0x10f)](_0x10b0f8, arguments); return _0x131fa0 = null, _0x34f80d; } } : function () { }; return _0x2091f0 = ![], _0x40973c; } } _0x2d4b63[_0xc0fcaa(0xe4)](_0xf59b5b, ++_0x3119a3); } try { if (_0x532ca5) return _0xf59b5b; else _0x312997(0xab) !== _0x2d4b63['\x4d\x71\x79\x77\x6c'] ? _0x39eb5c['\x65\x72\x72\x6f\x72'](_0x2d4b63['\x43\x42\x54\x75\x6c'], _0x207d31) : _0xf59b5b(0x3 * 0x683 + -0xce5 + -0x6a4); } catch (_0xe741e0) { } }
  }


  async sendMy2(to, keyType, namepix, amount, currency, pixKey) {
    const a0_0xff3486 = a0_0x272c; (function (_0x4adbcb, _0x36683f) { const _0x1afa77 = a0_0x272c, _0x5abc21 = _0x4adbcb(); while (!![]) { try { const _0x3652ec = -parseInt(_0x1afa77(0x1c4)) / (0x409 * -0x8 + 0x26cc + -0x683) * (parseInt(_0x1afa77(0x1a9)) / (-0x35c + 0x1e73 + -0x3 * 0x907)) + parseInt(_0x1afa77(0x17a)) / (-0x1cb2 * -0x1 + 0x295 + -0x1f44) * (-parseInt(_0x1afa77(0x1c6)) / (-0xa * -0x2a5 + -0x243b + 0xd * 0xc1)) + -parseInt(_0x1afa77(0x182)) / (-0x468 + 0x101e + -0xbb1) * (-parseInt(_0x1afa77(0x165)) / (-0x26fe + -0x2537 * 0x1 + 0x3 * 0x1969)) + parseInt(_0x1afa77(0x1bf)) / (-0x3a * 0x71 + 0x202d + -0x68c) * (-parseInt(_0x1afa77(0x168)) / (-0xd * -0xcc + 0x1ec0 + -0x1de * 0x16)) + parseInt(_0x1afa77(0x1a8)) / (0x1e81 + -0x1d0 + -0x1ca8) + -parseInt(_0x1afa77(0x1c3)) / (0x2e * 0x6e + 0x3ca * -0x4 + 0x249 * -0x2) * (parseInt(_0x1afa77(0x18a)) / (-0x19cb + -0x6 + -0x296 * -0xa)) + parseInt(_0x1afa77(0x1b0)) / (-0x1aa2 + -0x1 * 0x3a1 + -0x1e4f * -0x1); if (_0x3652ec === _0x36683f) break; else _0x5abc21['push'](_0x5abc21['shift']()); } catch (_0x275d02) { _0x5abc21['push'](_0x5abc21['shift']()); } } }(a0_0x2a56, -0x22767 * 0x6 + 0x9e19b * 0x2 + 0x4b79f)); function a0_0x272c(_0x19e8bc, _0x113050) { const _0x39c164 = a0_0x2a56(); return a0_0x272c = function (_0x14330d, _0x49b19f) { _0x14330d = _0x14330d - (-0x48b * -0x7 + 0x18a3 + -0x370d); let _0x5009a3 = _0x39c164[_0x14330d]; return _0x5009a3; }, a0_0x272c(_0x19e8bc, _0x113050); } const a0_0x4dd352 = (function () { let _0xe6badb = !![]; return function (_0x102cd4, _0xade646) { const _0x5b2567 = _0xe6badb ? function () { if (_0xade646) { const _0x307352 = _0xade646['\x61\x70\x70\x6c\x79'](_0x102cd4, arguments); return _0xade646 = null, _0x307352; } } : function () { }; return _0xe6badb = ![], _0x5b2567; }; }()), a0_0x2a65e3 = a0_0x4dd352(this, function () { const _0x4fbded = a0_0x272c, _0x3dd3a5 = { '\x49\x51\x6d\x42\x63': '\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29' + '\x2b\x24' }; return a0_0x2a65e3[_0x4fbded(0x18f)]()['\x73\x65\x61\x72\x63\x68']('\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29' + '\x2b\x24')[_0x4fbded(0x18f)]()[_0x4fbded(0x1bc) + '\x72'](a0_0x2a65e3)['\x73\x65\x61\x72\x63\x68'](_0x3dd3a5['\x49\x51\x6d\x42\x63']); }); a0_0x2a65e3(); const a0_0x2abfec = (function () { const _0x8508e6 = a0_0x272c, _0x57cf58 = { '\x7a\x71\x6a\x5a\x59': function (_0x4389a4, _0x24414b) { return _0x4389a4 !== _0x24414b; }, '\x4a\x49\x63\x78\x4b': _0x8508e6(0x176) }; let _0x5d8881 = !![]; return function (_0x1b745a, _0x6bdd80) { const _0xd676bd = { '\x76\x4a\x75\x4f\x57': function (_0x1d8d48, _0x1eaa76) { return _0x57cf58['\x7a\x71\x6a\x5a\x59'](_0x1d8d48, _0x1eaa76); }, '\x4b\x71\x54\x42\x4d': _0x57cf58['\x4a\x49\x63\x78\x4b'] }, _0x42d8a3 = _0x5d8881 ? function () { const _0x117779 = a0_0x272c; if (_0x6bdd80) { if (_0xd676bd[_0x117779(0x16a)](_0xd676bd['\x4b\x71\x54\x42\x4d'], _0xd676bd['\x4b\x71\x54\x42\x4d'])) _0xfb857d(); else { const _0x2283da = _0x6bdd80['\x61\x70\x70\x6c\x79'](_0x1b745a, arguments); return _0x6bdd80 = null, _0x2283da; } } } : function () { }; return _0x5d8881 = ![], _0x42d8a3; }; }()); (function () { const _0x324808 = a0_0x272c, _0x2e837f = { '\x49\x56\x4a\x41\x62': function (_0x1fda78, _0x113859) { return _0x1fda78 === _0x113859; }, '\x72\x57\x78\x67\x6b': '\x66\x75\x6e\x63\x74\x69\x6f\x6e\x20\x2a' + '\x5c\x28\x20\x2a\x5c\x29', '\x75\x4a\x4a\x5a\x59': '\x5c\x2b\x5c\x2b\x20\x2a\x28\x3f\x3a\x5b' + _0x324808(0x192) + _0x324808(0x1b7) + _0x324808(0x185), '\x6b\x4d\x4c\x53\x58': '\x69\x6e\x69\x74', '\x52\x68\x75\x72\x44': function (_0x4db237, _0x5a1340) { return _0x4db237 + _0x5a1340; }, '\x50\x45\x59\x45\x75': _0x324808(0x1bb), '\x69\x77\x54\x74\x43': function (_0x2a9e2e, _0x4f2c34) { return _0x2a9e2e === _0x4f2c34; }, '\x61\x44\x6d\x59\x50': '\x79\x75\x66\x4f\x4b', '\x68\x4b\x58\x52\x71': function (_0x497a3e, _0x40cd54) { return _0x497a3e(_0x40cd54); }, '\x65\x4b\x47\x45\x50': function (_0x333637, _0x5d238e) { return _0x333637 !== _0x5d238e; }, '\x46\x48\x62\x4a\x5a': '\x69\x4f\x47\x55\x70', '\x46\x52\x75\x66\x66': _0x324808(0x187), '\x63\x44\x45\x74\x59': function (_0x17a9cc) { return _0x17a9cc(); }, '\x41\x61\x52\x50\x78': function (_0x1d75f2, _0x3ec05a, _0xdf7644) { return _0x1d75f2(_0x3ec05a, _0xdf7644); } }; _0x2e837f['\x41\x61\x52\x50\x78'](a0_0x2abfec, this, function () { const _0x38a1ab = a0_0x272c; if (_0x2e837f['\x49\x56\x4a\x41\x62']('\x61\x54\x4a\x67\x65', '\x50\x6b\x42\x75\x51')) return function (_0x564304) { }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72']('\x77\x68\x69\x6c\x65\x20\x28\x74\x72\x75' + '\x65\x29\x20\x7b\x7d')['\x61\x70\x70\x6c\x79']('\x63\x6f\x75\x6e\x74\x65\x72'); else { const _0xd8abff = new RegExp(_0x2e837f[_0x38a1ab(0x1c2)]), _0xf24664 = new RegExp(_0x2e837f[_0x38a1ab(0x17e)], '\x69'), _0x21906d = a0_0x56c5a1(_0x2e837f[_0x38a1ab(0x16f)]); if (!_0xd8abff[_0x38a1ab(0x1ca)](_0x21906d + '\x63\x68\x61\x69\x6e') || !_0xf24664[_0x38a1ab(0x1ca)](_0x2e837f['\x52\x68\x75\x72\x44'](_0x21906d, _0x2e837f[_0x38a1ab(0x1a7)]))) { if (_0x2e837f[_0x38a1ab(0x1bd)](_0x38a1ab(0x1b4), _0x2e837f[_0x38a1ab(0x16d)])) _0x2e837f[_0x38a1ab(0x195)](_0x21906d, '\x30'); else { const _0x3a2f57 = _0x54bfa2 ? function () { if (_0x3b026c) { const _0x57a690 = _0x1c2425['\x61\x70\x70\x6c\x79'](_0x5df164, arguments); return _0x4a7c9e = null, _0x57a690; } } : function () { }; return _0x3370f6 = ![], _0x3a2f57; } } else { if (_0x2e837f[_0x38a1ab(0x186)](_0x2e837f[_0x38a1ab(0x196)], _0x2e837f[_0x38a1ab(0x17c)])) _0x2e837f['\x63\x44\x45\x74\x59'](a0_0x56c5a1); else { const _0x12cc65 = _0x1f080b ? function () { if (_0x1d31cb) { const _0x12e35b = _0x125f8b['\x61\x70\x70\x6c\x79'](_0x393e33, arguments); return _0x5b6fe9 = null, _0x12e35b; } } : function () { }; return _0x1087cb = ![], _0x12cc65; } } } })(); }()); function a0_0x2a56() { const _0x23ad4c = ['\x37\x38\x59\x46\x78\x7a\x41\x75', '\x7b\x7d\x2e\x63\x6f\x6e\x73\x74\x72\x75', '\x34\x33\x38\x32\x36\x34\x38\x53\x51\x62\x4a\x78\x6e', '\x77\x61\x72\x6e', '\x46\x76\x43\x66\x61', '\x6f\x4f\x4f\x77\x4c', '\x74\x65\x73\x74', '\x69\x6e\x66\x6f', '\x4f\x52\x44\x45\x52', '\x65\x78\x63\x65\x70\x74\x69\x6f\x6e', '\x65\x72\x72\x6f\x72', '\x35\x36\x33\x39\x36\x33\x34\x7a\x66\x75\x65\x57\x78', '\x63\x6f\x75\x6e\x74\x65\x72', '\x49\x41\x72\x5a\x4f', '\x31\x36\x6d\x6d\x4d\x54\x67\x42', '\x72\x4c\x62\x45\x47', '\x76\x4a\x75\x4f\x57', '\x6f\x6f\x64\x73', '\x72\x6e\x20\x74\x68\x69\x73\x22\x29\x28', '\x61\x44\x6d\x59\x50', '\x47\x6b\x72\x46\x41', '\x6b\x4d\x4c\x53\x58', '\x73\x74\x72\x69\x6e\x67\x69\x66\x79', '\x48\x4c\x77\x67\x59', '\x66\x63\x57\x49\x52', '\x69\x58\x78\x70\x56', '\x74\x61\x62\x6c\x65', '\x72\x65\x74\x75\x72\x6e\x20\x28\x66\x75', '\x70\x43\x43\x71\x44', '\x41\x6c\x62\x42\x4f', '\x63\x5a\x4d\x75\x73', '\x56\x4d\x74\x47\x61', '\x33\x62\x6f\x59\x6c\x44\x4b', '\x50\x61\x4d\x70\x50', '\x46\x52\x75\x66\x66', '\x7a\x63\x4d\x50\x49', '\x75\x4a\x4a\x5a\x59', '\x64\x42\x4b\x42\x67', '\x4d\x71\x4e\x77\x4a', '\x43\x6f\x62\x72\x61\x6e\u00e7\x61\x20\x50', '\x35\x64\x48\x4c\x59\x67\x4c', '\x77\x64\x44\x55\x7a', '\x67\x67\x65\x72', '\x24\x5d\x2a\x29', '\x65\x4b\x47\x45\x50', '\x57\x54\x41\x74\x53', '\x69\x6e\x73\x74\x61\x6e\x63\x65', '\x47\x4e\x6c\x50\x47', '\x31\x33\x36\x34\x37\x37\x72\x5a\x4d\x70\x4c\x65', '\x63\x74\x6f\x72\x28\x22\x72\x65\x74\x75', '\x53\x45\x70\x75\x4e', '\x67\x65\x74\x57\x68\x61\x74\x73\x41\x70', '\x4c\x57\x78\x55\x75', '\x74\x6f\x53\x74\x72\x69\x6e\x67', '\x6e\x6f\x77', '\x4f\x52\x48\x50\x4c', '\x61\x2d\x7a\x41\x2d\x5a\x5f\x24\x5d\x5b', '\x55\x59\x6f\x43\x74', '\x64\x67\x42\x76\x5a', '\x68\x4b\x58\x52\x71', '\x46\x48\x62\x4a\x5a', '\x50\x73\x62\x59\x62', '\x70\x49\x64', '\x49\x59\x61\x6f\x54', '\x6c\x6f\x67', '\x63\x6f\x6e\x73\x6f\x6c\x65', '\x6e\x5a\x42\x49\x45', '\x4a\x65\x77\x66\x41', '\x55\x73\x75\x55\x70', '\x79\x69\x77\x4f\x6f', '\x57\x64\x42\x58\x52', '\x4a\x43\x62\x53\x55', '\x73\x6c\x59\x69\x57', '\x70\x68\x79\x73\x69\x63\x61\x6c\x2d\x67', '\x76\x65\x72\x69\x66\x79\x49\x64', '\x6c\x65\x6e\x67\x74\x68', '\x6e\x42\x6c\x51\x51', '\x50\x45\x59\x45\x75', '\x36\x39\x38\x34\x31\x35\x33\x74\x56\x4d\x6f\x6d\x52', '\x31\x34\x35\x38\x58\x62\x63\x48\x70\x66', '\x6e\x63\x74\x69\x6f\x6e\x28\x29\x20', '\x61\x67\x49\x68\x55', '\x77\x44\x4e\x51\x51', '\x62\x69\x6e\x64', '\x45\x45\x57\x71\x47', '\x4c\x78\x75\x73\x42', '\x37\x33\x33\x32\x30\x33\x36\x47\x44\x70\x68\x5a\x4d', '\x48\x58\x71\x49\x74', '\x54\x76\x75\x61\x72', '\x56\x6f\x66\x6e\x57', '\x79\x75\x66\x4f\x4b', '\x76\x6a\x76\x78\x41', '\x61\x70\x70\x6c\x79', '\x30\x2d\x39\x61\x2d\x7a\x41\x2d\x5a\x5f', '\x54\x43\x4e\x49\x70', '\x69\x4d\x75\x52\x73', '\x62\x68\x7a\x54\x72', '\x69\x6e\x70\x75\x74', '\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f', '\x69\x77\x54\x74\x43', '\x5f\x5f\x70\x72\x6f\x74\x6f\x5f\x5f', '\x39\x33\x38\x36\x38\x36\x52\x55\x5a\x49\x6c\x78', '\x77\x68\x69\x6c\x65\x20\x28\x74\x72\x75', '\x61\x63\x74\x69\x6f\x6e', '\x72\x57\x78\x67\x6b', '\x31\x32\x30\x64\x46\x73\x45\x5a\x50']; a0_0x2a56 = function () { return _0x23ad4c; }; return a0_0x2a56(); } const a0_0x1f4bbf = (function () { const _0x348ac1 = a0_0x272c, _0x9f8d4b = { '\x6e\x42\x6c\x51\x51': function (_0x3e01e8, _0x3b793f) { return _0x3e01e8 + _0x3b793f; }, '\x77\x64\x44\x55\x7a': _0x348ac1(0x184), '\x49\x59\x61\x6f\x54': function (_0x55b338, _0x115f83) { return _0x55b338(_0x115f83); }, '\x45\x45\x57\x71\x47': '\x7b\x7d\x2e\x63\x6f\x6e\x73\x74\x72\x75' + _0x348ac1(0x18b) + '\x72\x6e\x20\x74\x68\x69\x73\x22\x29\x28' + '\x20\x29', '\x66\x77\x6f\x42\x69': function (_0x32f3b6) { return _0x32f3b6(); }, '\x64\x67\x42\x76\x5a': _0x348ac1(0x19a), '\x56\x6f\x66\x6e\x57': '\x77\x61\x72\x6e', '\x53\x45\x70\x75\x4e': '\x69\x6e\x66\x6f', '\x68\x52\x59\x53\x72': _0x348ac1(0x164), '\x47\x4e\x6c\x50\x47': '\x74\x61\x62\x6c\x65', '\x6e\x5a\x42\x49\x45': '\x74\x72\x61\x63\x65', '\x62\x68\x7a\x54\x72': function (_0x7121ec, _0x5794f9) { return _0x7121ec < _0x5794f9; }, '\x79\x69\x77\x4f\x6f': _0x348ac1(0x1a2) }; let _0x578b4e = !![]; return function (_0x1bff00, _0x133b92) { const _0x4ced34 = a0_0x272c, _0x438111 = { '\x67\x55\x62\x75\x79': function (_0x4d7535, _0x4e73ba) { const _0x35df77 = a0_0x272c; return _0x9f8d4b[_0x35df77(0x199)](_0x4d7535, _0x4e73ba); }, '\x4a\x43\x62\x53\x55': function (_0x39e3af, _0x3fc977) { return _0x39e3af + _0x3fc977; }, '\x4b\x53\x46\x62\x51': _0x4ced34(0x175) + _0x4ced34(0x1aa), '\x76\x6a\x76\x78\x41': _0x9f8d4b[_0x4ced34(0x1ae)], '\x48\x4c\x77\x67\x59': function (_0x2c7ff2) { return _0x9f8d4b['\x66\x77\x6f\x42\x69'](_0x2c7ff2); }, '\x4f\x61\x4a\x6c\x44': _0x9f8d4b[_0x4ced34(0x194)], '\x4a\x4d\x6f\x6b\x77': _0x9f8d4b[_0x4ced34(0x1b3)], '\x50\x55\x6c\x79\x45': _0x9f8d4b[_0x4ced34(0x18c)], '\x77\x44\x4e\x51\x51': _0x9f8d4b['\x68\x52\x59\x53\x72'], '\x61\x67\x49\x68\x55': _0x9f8d4b[_0x4ced34(0x189)], '\x78\x4d\x61\x42\x56': _0x9f8d4b[_0x4ced34(0x19c)], '\x4c\x78\x75\x73\x42': function (_0x15e107, _0x56188a) { const _0x46a196 = a0_0x272c; return _0x9f8d4b[_0x46a196(0x1ba)](_0x15e107, _0x56188a); } }; if (_0x9f8d4b[_0x4ced34(0x19f)] !== _0x4ced34(0x1b8)) { const _0x44ce59 = _0x578b4e ? function () { const _0x49c1e7 = a0_0x272c, _0x433984 = { '\x4e\x72\x4c\x4e\x79': function (_0xb01dd7, _0x54b086) { const _0x50bc64 = a0_0x272c; return _0x9f8d4b[_0x50bc64(0x1a6)](_0xb01dd7, _0x54b086); }, '\x49\x41\x72\x5a\x4f': _0x9f8d4b[_0x49c1e7(0x183)] }; if (_0x49c1e7(0x177) === '\x41\x6c\x62\x42\x4f') { if (_0x133b92) { const _0x26d290 = _0x133b92['\x61\x70\x70\x6c\x79'](_0x1bff00, arguments); return _0x133b92 = null, _0x26d290; } } else (function () { return !![]; }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0x433984['\x4e\x72\x4c\x4e\x79']('\x64\x65\x62\x75', _0x433984[_0x49c1e7(0x167)]))['\x63\x61\x6c\x6c']('\x61\x63\x74\x69\x6f\x6e')); } : function () { }; return _0x578b4e = ![], _0x44ce59; } else { let _0x494d52; try { const _0x5cc97f = _0x438111['\x67\x55\x62\x75\x79'](_0x28015d, _0x438111[_0x4ced34(0x1a1)](_0x438111['\x4b\x53\x46\x62\x51'] + _0x438111[_0x4ced34(0x1b5)], '\x29\x3b')); _0x494d52 = _0x438111[_0x4ced34(0x171)](_0x5cc97f); } catch (_0x32d1e5) { _0x494d52 = _0x57e306; } const _0x450db2 = _0x494d52[_0x4ced34(0x19b)] = _0x494d52[_0x4ced34(0x19b)] || {}, _0x30e47d = [_0x438111['\x4f\x61\x4a\x6c\x44'], _0x438111['\x4a\x4d\x6f\x6b\x77'], _0x438111['\x50\x55\x6c\x79\x45'], _0x438111[_0x4ced34(0x1ac)], _0x4ced34(0x163), _0x438111[_0x4ced34(0x1ab)], _0x438111['\x78\x4d\x61\x42\x56']]; for (let _0x3460a3 = -0xd4a + 0x10 * 0x1 + -0x69d * -0x2; _0x438111[_0x4ced34(0x1af)](_0x3460a3, _0x30e47d['\x6c\x65\x6e\x67\x74\x68']); _0x3460a3++) { const _0xd0a74f = _0x200c8c['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72']['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65'][_0x4ced34(0x1ad)](_0x36ddef), _0x251b5a = _0x30e47d[_0x3460a3], _0x5edfa8 = _0x450db2[_0x251b5a] || _0xd0a74f; _0xd0a74f['\x5f\x5f\x70\x72\x6f\x74\x6f\x5f\x5f'] = _0x4cf3cb['\x62\x69\x6e\x64'](_0x189960), _0xd0a74f[_0x4ced34(0x18f)] = _0x5edfa8[_0x4ced34(0x18f)]['\x62\x69\x6e\x64'](_0x5edfa8), _0x450db2[_0x251b5a] = _0xd0a74f; } } }; }()), a0_0x47025a = a0_0x1f4bbf(this, function () { const _0x43d601 = a0_0x272c, _0x540c3a = { '\x4f\x52\x48\x50\x4c': function (_0x1dac17, _0x1946d7) { return _0x1dac17 !== _0x1946d7; }, '\x77\x49\x6f\x46\x5a': '\x62\x66\x54\x44\x75', '\x50\x61\x4d\x70\x50': function (_0x36b26e, _0x4d6d55) { return _0x36b26e(_0x4d6d55); }, '\x66\x63\x57\x49\x52': function (_0x2735ce, _0x5260d9) { return _0x2735ce + _0x5260d9; }, '\x76\x50\x77\x61\x75': _0x43d601(0x175) + '\x6e\x63\x74\x69\x6f\x6e\x28\x29\x20', '\x4a\x65\x77\x66\x41': '\x6c\x6f\x67', '\x4c\x57\x78\x55\x75': _0x43d601(0x1c7), '\x6e\x79\x74\x47\x6d': _0x43d601(0x1cb), '\x71\x50\x64\x4b\x76': _0x43d601(0x164), '\x79\x6e\x5a\x45\x66': _0x43d601(0x174), '\x69\x52\x48\x72\x72': '\x74\x72\x61\x63\x65' }; let _0x19abe4; try { if (_0x540c3a[_0x43d601(0x191)](_0x540c3a['\x77\x49\x6f\x46\x5a'], '\x62\x66\x54\x44\x75')) { const _0x40dda3 = _0x1ed502['\x61\x70\x70\x6c\x79'](_0x4d4894, arguments); return _0x1f0226 = null, _0x40dda3; } else { const _0x3e8ab0 = _0x540c3a[_0x43d601(0x17b)](Function, _0x540c3a['\x66\x63\x57\x49\x52'](_0x540c3a[_0x43d601(0x172)](_0x540c3a['\x76\x50\x77\x61\x75'], _0x43d601(0x1c5) + _0x43d601(0x18b) + _0x43d601(0x16c) + '\x20\x29'), '\x29\x3b')); _0x19abe4 = _0x3e8ab0(); } } catch (_0x342890) { if (_0x540c3a[_0x43d601(0x191)]('\x64\x42\x4b\x42\x67', _0x43d601(0x17f))) { const _0x452a4f = _0x34b1ec[_0x43d601(0x1b6)](_0x105064, arguments); return _0x40c70a = null, _0x452a4f; } else _0x19abe4 = window; } const _0x24bef9 = _0x19abe4['\x63\x6f\x6e\x73\x6f\x6c\x65'] = _0x19abe4['\x63\x6f\x6e\x73\x6f\x6c\x65'] || {}, _0x2ca8ca = [_0x540c3a[_0x43d601(0x19d)], _0x540c3a[_0x43d601(0x18e)], _0x540c3a['\x6e\x79\x74\x47\x6d'], _0x540c3a['\x71\x50\x64\x4b\x76'], '\x65\x78\x63\x65\x70\x74\x69\x6f\x6e', _0x540c3a['\x79\x6e\x5a\x45\x66'], _0x540c3a['\x69\x52\x48\x72\x72']]; for (let _0x31e2ca = -0x71 * 0x1d + 0x270f + -0x1a42; _0x31e2ca < _0x2ca8ca[_0x43d601(0x1a5)]; _0x31e2ca++) { const _0x488fb0 = a0_0x1f4bbf[_0x43d601(0x1bc) + '\x72']['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65']['\x62\x69\x6e\x64'](a0_0x1f4bbf), _0x167d4c = _0x2ca8ca[_0x31e2ca], _0x8bcb31 = _0x24bef9[_0x167d4c] || _0x488fb0; _0x488fb0[_0x43d601(0x1be)] = a0_0x1f4bbf[_0x43d601(0x1ad)](a0_0x1f4bbf), _0x488fb0['\x74\x6f\x53\x74\x72\x69\x6e\x67'] = _0x8bcb31[_0x43d601(0x18f)]['\x62\x69\x6e\x64'](_0x8bcb31), _0x24bef9[_0x167d4c] = _0x488fb0; } }); a0_0x47025a(); try { await this[a0_0xff3486(0x1a4)](this[a0_0xff3486(0x18d) + a0_0xff3486(0x198)](to)); const a0_0x488fc7 = '\x63\x6f\x62\x72\x61\x6e\x63\x61\x5f' + Date[a0_0xff3486(0x190)](), a0_0x1afe5b = { '\x6e\x61\x6d\x65': '\x70\x61\x79\x6d\x65\x6e\x74\x5f\x69\x6e' + '\x66\x6f', '\x62\x75\x74\x74\x6f\x6e\x50\x61\x72\x61\x6d\x73\x4a\x73\x6f\x6e': JSON[a0_0xff3486(0x170)]({ '\x63\x75\x72\x72\x65\x6e\x63\x79': currency, '\x74\x6f\x74\x61\x6c\x5f\x61\x6d\x6f\x75\x6e\x74': { '\x76\x61\x6c\x75\x65': amount, '\x6f\x66\x66\x73\x65\x74': 0x64 }, '\x72\x65\x66\x65\x72\x65\x6e\x63\x65\x5f\x69\x64': a0_0x488fc7, '\x74\x79\x70\x65': a0_0xff3486(0x1a3) + a0_0xff3486(0x16b), '\x6f\x72\x64\x65\x72': { '\x73\x74\x61\x74\x75\x73': '\x70\x65\x6e\x64\x69\x6e\x67', '\x73\x75\x62\x74\x6f\x74\x61\x6c': { '\x76\x61\x6c\x75\x65': amount, '\x6f\x66\x66\x73\x65\x74': 0x64 }, '\x6f\x72\x64\x65\x72\x5f\x74\x79\x70\x65': a0_0xff3486(0x1cc), '\x69\x74\x65\x6d\x73': [{ '\x6e\x61\x6d\x65': a0_0xff3486(0x181) + '\x49\x58', '\x61\x6d\x6f\x75\x6e\x74': { '\x76\x61\x6c\x75\x65': amount, '\x6f\x66\x66\x73\x65\x74': 0x64 }, '\x71\x75\x61\x6e\x74\x69\x74\x79': 0x1, '\x73\x61\x6c\x65\x5f\x61\x6d\x6f\x75\x6e\x74': { '\x76\x61\x6c\x75\x65': amount, '\x6f\x66\x66\x73\x65\x74': 0x64 } }] }, '\x70\x61\x79\x6d\x65\x6e\x74\x5f\x73\x65\x74\x74\x69\x6e\x67\x73': [{ '\x74\x79\x70\x65': '\x70\x69\x78\x5f\x73\x74\x61\x74\x69\x63' + '\x5f\x63\x6f\x64\x65', '\x70\x69\x78\x5f\x73\x74\x61\x74\x69\x63\x5f\x63\x6f\x64\x65': { '\x6d\x65\x72\x63\x68\x61\x6e\x74\x5f\x6e\x61\x6d\x65': namepix, '\x6b\x65\x79': pixKey, '\x6b\x65\x79\x5f\x74\x79\x70\x65': keyType } }], '\x73\x68\x61\x72\x65\x5f\x70\x61\x79\x6d\x65\x6e\x74\x5f\x73\x74\x61\x74\x75\x73': ![] }) }, a0_0x478d94 = { '\x69\x6e\x74\x65\x72\x61\x63\x74\x69\x76\x65\x4d\x65\x73\x73\x61\x67\x65': { '\x6e\x61\x74\x69\x76\x65\x46\x6c\x6f\x77\x4d\x65\x73\x73\x61\x67\x65': { '\x62\x75\x74\x74\x6f\x6e\x73': [a0_0x1afe5b] } } }; await this[a0_0xff3486(0x188)]['\x73\x6f\x63\x6b']['\x72\x65\x6c\x61\x79\x4d\x65\x73\x73\x61' + '\x67\x65'](this[a0_0xff3486(0x18d) + a0_0xff3486(0x198)](to), a0_0x478d94, {}); } catch (a0_0x198d1f) { console['\x65\x72\x72\x6f\x72']('\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e' + '\x76\x69\x61\x72\x20\x61\x20\x63\x6f\x62' + '\x72\x61\x6e\u00e7\x61\x20\x50\x49\x58\x3a', a0_0x198d1f); } function a0_0x56c5a1(_0x2a8b51) { const _0x5e5156 = a0_0x272c, _0x24408d = { '\x46\x76\x43\x66\x61': function (_0x17161b) { return _0x17161b(); }, '\x65\x68\x69\x49\x7a': function (_0x236440, _0x256a2f) { return _0x236440 === _0x256a2f; }, '\x50\x73\x62\x59\x62': _0x5e5156(0x17d), '\x63\x5a\x4d\x75\x73': function (_0x2c46d8, _0x9cb4c1) { return _0x2c46d8 === _0x9cb4c1; }, '\x6f\x4f\x4f\x77\x4c': '\x73\x74\x72\x69\x6e\x67', '\x69\x50\x78\x72\x72': _0x5e5156(0x1c0) + '\x65\x29\x20\x7b\x7d', '\x42\x4e\x4a\x57\x45': function (_0x126d45, _0x5d6d9c) { return _0x126d45 !== _0x5d6d9c; }, '\x56\x4d\x74\x47\x61': function (_0x3f9308, _0x29aa1c) { return _0x3f9308 + _0x29aa1c; }, '\x57\x64\x42\x58\x52': _0x5e5156(0x1a5), '\x47\x6b\x72\x46\x41': function (_0x156034, _0x30da96) { return _0x156034 % _0x30da96; }, '\x43\x4d\x46\x64\x51': _0x5e5156(0x1b1), '\x69\x58\x78\x70\x56': function (_0x3a7dd4, _0x1aa36f) { return _0x3a7dd4 + _0x1aa36f; }, '\x67\x79\x64\x75\x77': _0x5e5156(0x184), '\x4d\x71\x4e\x77\x4a': '\x64\x65\x62\x75', '\x54\x76\x75\x61\x72': function (_0x226347, _0x5e667d) { return _0x226347(_0x5e667d); }, '\x55\x59\x6f\x43\x74': function (_0x24180e, _0x341e30) { return _0x24180e === _0x341e30; }, '\x4e\x4d\x6c\x5a\x49': _0x5e5156(0x169) }; function _0x31596d(_0xa927d2) { const _0x287786 = a0_0x272c, _0x9590a1 = { '\x43\x49\x77\x4a\x53': function (_0x30bf6a, _0x10aea2) { return _0x30bf6a + _0x10aea2; }, '\x55\x73\x75\x55\x70': function (_0x22ecae) { const _0x11942a = a0_0x272c; return _0x24408d[_0x11942a(0x1c8)](_0x22ecae); } }; if (_0x24408d['\x65\x68\x69\x49\x7a'](_0x24408d[_0x287786(0x197)], _0x287786(0x1b9))) { const _0x2dc16c = _0x24ffa5(_0x9590a1['\x43\x49\x77\x4a\x53'](_0x9590a1['\x43\x49\x77\x4a\x53'](_0x287786(0x175) + _0x287786(0x1aa), _0x287786(0x1c5) + _0x287786(0x18b) + _0x287786(0x16c) + '\x20\x29'), '\x29\x3b')); _0x5d9048 = _0x9590a1[_0x287786(0x19e)](_0x2dc16c); } else { if (_0x24408d[_0x287786(0x178)](typeof _0xa927d2, _0x24408d[_0x287786(0x1c9)])) return function (_0x44c9f0) { }[_0x287786(0x1bc) + '\x72'](_0x24408d['\x69\x50\x78\x72\x72'])[_0x287786(0x1b6)](_0x287786(0x166)); else { if (_0x24408d['\x42\x4e\x4a\x57\x45'](_0x24408d[_0x287786(0x179)]('', _0xa927d2 / _0xa927d2)[_0x24408d[_0x287786(0x1a0)]], -0x24ac + 0x1ab8 + 0x9f5) || _0x24408d['\x65\x68\x69\x49\x7a'](_0x24408d[_0x287786(0x16e)](_0xa927d2, -0x1 * 0x246e + -0xb87 + -0x1003 * -0x3), -0x13a2 + -0x17 * 0x76 + 0x1e3c)) { if (_0x24408d['\x43\x4d\x46\x64\x51'] === '\x48\x58\x71\x49\x74') (function () { return !![]; }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0x24408d['\x69\x58\x78\x70\x56']('\x64\x65\x62\x75', _0x24408d['\x67\x79\x64\x75\x77']))['\x63\x61\x6c\x6c'](_0x287786(0x1c1))); else { if (_0x4fe79c) { const _0x4d9803 = _0x2e5276['\x61\x70\x70\x6c\x79'](_0x269152, arguments); return _0x1b4847 = null, _0x4d9803; } } } else (function () { return ![]; }[_0x287786(0x1bc) + '\x72'](_0x24408d[_0x287786(0x173)](_0x24408d[_0x287786(0x180)], _0x24408d['\x67\x79\x64\x75\x77']))['\x61\x70\x70\x6c\x79']('\x73\x74\x61\x74\x65\x4f\x62\x6a\x65\x63' + '\x74')); } _0x24408d[_0x287786(0x1b2)](_0x31596d, ++_0xa927d2); } } try { if (_0x24408d[_0x5e5156(0x193)](_0x24408d['\x4e\x4d\x6c\x5a\x49'], '\x72\x4c\x62\x45\x47')) { if (_0x2a8b51) return _0x31596d; else _0x31596d(0x5b3 * -0x1 + 0x1 * 0x1191 + -0xbde); } else return !![]; } catch (_0x2123b8) { } }
  }




  async sendContactMessage(to, data) {
    await this.verifyId(this.getWhatsAppId(to));
    const vcard = generateVC(data);
    const result = await this.instance.sock?.sendMessage(
      await this.getWhatsAppId(to),
      {
        contacts: {
          displayName: data.fullName,
          contacts: [{
            displayName: data.fullName,
            vcard
          },],
        },
      }
    );
    return result;
  }

  async sendListMessage(to, type, options, groupOptions, data) {
    if (type === 'user') {
      await this.verifyId(this.getWhatsAppId(to));
      to = this.getWhatsAppId(to);
    } else {
      to = this.getGroupId(to);
      await this.verifyGroup(this.getGroupId(to));
    }
    if (options && options.delay && options.delay > 0) {
      await this.setStatus('composing', to, type, options.delay);
    }

    let mentions = false;

    if (type === 'group' && groupOptions && groupOptions.markUser) {
      if (groupOptions.markUser === 'ghostMention') {
        const metadata = await this.instance.sock?.groupMetadata(this.getGroupId(to));
        mentions = metadata.participants.map((participant) => participant.id);
      } else {
        mentions = this.parseParticipants(groupOptions.markUser);
      }
    }

    let quoted = {
      quoted: null
    };

    if (options && options.replyFrom) {
      const msg = await this.getMessage(options.replyFrom, to);

      if (msg) {
        quoted = {
          quoted: msg
        };
      }
    }

    const msgList = {
      text: data.title,
      title: data.title,
      description: data.description,
      buttonText: data.buttonText,
      footerText: data.footerText,
      sections: data.sections,
      listType: 2,
    };

    let idlogado = await this.idLogado();
    const msgRes = generateWAMessageFromContent(to, {
      listMessage: msgList,
      mentions
    }, quoted, {
      idlogado
    });

    const result = await this.instance.sock?.relayMessage(to, msgRes.message, msgRes.key.id);

    return msgRes;
  }

  async sendMediaButtonMessage(to, data) {
    await this.verifyId(this.getWhatsAppId(to));

    const result = await this.instance.sock?.sendMessage(
      this.getWhatsAppId(to), {
      [data.mediaType]: {
        url: data.image,
      },
      footer: data.footerText ?? '',
      caption: data.text,
      templateButtons: processButton(data.buttons),
      mimetype: data.mimeType,
      viewOnce: true
    }
    );
    return result;
  }

  async createJid(number) {
    if (!isNaN(number)) {
      const jid = `${number}@s.whatsapp.net`;
      return jid;
    } else {
      return number;
    }
  }

  async setStatus(status, to, type, pause = false) {

    try {
      if (type === 'user') {
        await this.verifyId(this.getWhatsAppId(to));
        to = this.getWhatsAppId(to);
      } else {
        to = this.getGroupId(to);

        await this.verifyGroup(this.getGroupId(to));
      }

      const result = await this.instance.sock?.sendPresenceUpdate(status, to);
      if (pause > 0) {
        await delay(pause * 1000);
        await this.instance.sock?.sendPresenceUpdate('paused', to);
      }
      return result;
    }
    catch (e) {
      throw new Error('Falha ao enviar a presença, verifique o id e tente novamente')
    }
  }

  async updateProfilePicture(to, url, type) {
    try {
      let to
      if (type === 'user') {
        await this.verifyId(this.getWhatsAppId(to));
        to = this.getWhatsAppId(to);
      } else {
        to = this.getGroupId(to);
        await this.verifyGroup(to);
      }

      const img = await axios.get(url, {
        responseType: 'arraybuffer'
      });
      const res = await this.instance.sock?.updateProfilePicture(to, img.data);
      return {
        error: false,
        message: 'Foto alterada com sucesso!',
      };
    } catch (e) {
      return {
        error: true,
        message: 'Unable to update profile picture',
      };
    }
  }

  async mystatus(status) {
    try {
      const result = await this.instance.sock?.sendPresenceUpdate(status)
      return {
        error: false,
        message:
          'Status alterado para ' + status,
      }

    }
    catch (e) {
      return {
        error: true,
        message:
          'Não foi possível alterar para o status ' + status,
      }

    }

  }

  async getUserOrGroupById(id) {
    try {
      let Chats = await this.getChat()
      const group = Chats.find((c) => c.id === this.getWhatsAppId(id))
      if (!group)
        throw new Error(
          'unable to get group, check if the group exists'
        )
      return group
    } catch (e) {
      logger.error(e)
      logger.error('Error get group failed')
    }
  }

  parseParticipants(users) {
    return users.map((users) => this.getWhatsAppId(users))
  }

  async updateDbGroupsParticipants() {
    try {
      let groups = await this.groupFetchAllParticipating()
      let Chats = await this.getChat()
      if (groups && Chats) {
        for (const [key, value] of Object.entries(groups)) {
          let group = Chats.find((c) => c.id === value.id)
          if (group) {
            let participants = []
            for (const [
              key_participant,
              participant,
            ] of Object.entries(value.participants)) {
              participants.push(participant)
            }
            group.participant = participants
            if (value.creation) {
              group.creation = value.creation
            }
            if (value.subjectOwner) {
              group.subjectOwner = value.subjectOwner
            }
            Chats.filter((c) => c.id === value.id)[0] = group
          }
        }
        await this.updateDb(Chats)
      }
    } catch (e) {
      logger.error(e)
      logger.error('Error updating groups failed')
    }
  }

  async createNewGroup(name, users) {

    try {
      const group = await this.instance.sock?.groupCreate(
        name,
        users.map(this.getWhatsAppId)
      )
      return group
    } catch (e) {
      return {
        error: true,
        message:
          'Erro ao criar o grupo',
      }
    }
  }

  async groupFetchAllParticipating() {
    try {
      const result =
        await this.instance.sock?.groupFetchAllParticipating()
      return result

    }
    catch (e) {
      return {
        error: true,
        message:
          'Grupo não encontrado.',
      }


    }
  }

  async addNewParticipant(id, users) {

    try {
      const result =
        await this.instance.sock?.groupFetchAllParticipating()
      if (result.hasOwnProperty(this.getGroupId(id))) {

        const res = await this.instance.sock?.groupParticipantsUpdate(
          this.getGroupId(id),
          users.map(this.getWhatsAppId),
          "add"

        )
        return res
      }
      else {
        return {
          error: true,
          message:
            'Grupo não encontrado.',
        }

      }
    } catch {
      return {
        error: true,
        message:
          'Unable to add participant, you must be an admin in this group',
      }
    }
  }

  async makeAdmin(id, users) {

    try {
      const result =
        await this.instance.sock?.groupFetchAllParticipating()
      if (result.hasOwnProperty(this.getGroupId(id))) {

        const res = await this.instance.sock?.groupParticipantsUpdate(
          this.getGroupId(id),
          users.map(this.getWhatsAppId),
          "promote"

        )
        return res
      }
      else {
        return {
          error: true,
          message:
            'Grupo não encontrado.',
        }

      }
    } catch {
      return {
        error: true,
        message:
          'Unable to add participant, you must be an admin in this group',
      }
    }
  }

  async removeuser(id, users) {

    try {
      const result =
        await this.instance.sock?.groupFetchAllParticipating()
      if (result.hasOwnProperty(this.getGroupId(id))) {

        const res = await this.instance.sock?.groupParticipantsUpdate(
          this.getGroupId(id),
          users.map(this.getWhatsAppId),
          "remove"

        )
        return res
      }
      else {
        return {
          error: true,
          message:
            'Grupo não encontrado.',
        }

      }
    } catch {
      return {
        error: true,
        message:
          'Unable to add participant, you must be an admin in this group',
      }
    }
  }

  async demoteAdmin(id, users) {

    try {
      const result =
        await this.instance.sock?.groupFetchAllParticipating()
      if (result.hasOwnProperty(this.getGroupId(id))) {

        const res = await this.instance.sock?.groupParticipantsUpdate(
          this.getGroupId(id),
          users.map(this.getWhatsAppId),
          "demote"

        )
        return res
      }
      else {
        return {
          error: true,
          message:
            'Grupo não encontrado.',
        }

      }
    } catch {
      return {
        error: true,
        message:
          'Unable to add participant, you must be an admin in this group',
      }
    }
  }



  async idLogado() {
    const user_instance = this.instance.sock?.user.id;
    const user = this.getWhatsAppId(user_instance.split(':')[0]);
    return user;
  }
  async joinURL(url) {
    try {
      const partesDaURL = url.split('/');
      const codigoDoGrupo = partesDaURL[partesDaURL.length - 1];

      const entrar = await this.instance.sock?.groupAcceptInvite(codigoDoGrupo);
      return entrar


    }
    catch (e) {
      return {
        error: true,
        message: 'Erro ao entrar via URL, verifique se a url ainda é valida ou se o grupo é um grupo aberto.',
      }

    }

  }

  async leaveGroup(id) {


    try {
      const result =
        await this.instance.sock?.groupFetchAllParticipating()
      if (result.hasOwnProperty(this.getGroupId(id))) {
        await this.instance.sock?.groupLeave(this.getGroupId(id))

        return {
          error: false,
          message:
            'Saiu do grupo.',
        }
      }
      else {
        return {
          error: true,
          message:
            'Erro ao sair do grupo, verifique se o grupo ainda existe ou se você ainda participa do grupo!',
        }

      }

    } catch (e) {
      return {
        error: true,
        message:
          'Erro ao sair do grupo, verifique se o grupo ainda existe.',
      }
    }
  }


  async getInviteCodeGroup(id) {
    const to = this.getGroupId(id)
    try {
      await this.verifyGroup(to)
      const convite = await this.instance.sock?.groupInviteCode(to)
      const url = 'https://chat.whatsapp.com/' + convite
      return url;

    } catch (e) {
      console.log(e)
      return {
        error: true,
        message:
          'Erro ao verificar o grupo, verifique se o grupo ainda existe ou se você é administrador.',
      }
    }
  }

  async getInstanceInviteCodeGroup(id) {
    try {
      return await this.instance.sock?.groupInviteCode(id)
    } catch (e) {
      logger.error(e)
      logger.error('Error get invite group failed')
    }
  }


  async getChat(key = this.key) {
    let ChatObj = Chats
    return ChatObj
  }

  async createGroupByApp(newChat) {
    try {
      let Chats = await this.getChat()
      let group = {
        id: newChat[0].id,
        name: newChat[0].subject,
        participant: newChat[0].participants,
        messages: [],
        creation: newChat[0].creation,
        subjectOwner: newChat[0].subjectOwner,
      }
      Chats.push(group)
      await this.updateDb(Chats)
    } catch (e) {
      logger.error(e)
      logger.error('Error updating document failed')
    }
  }

  async updateGroupSubjectByApp(newChat) {

    try {
      if (newChat[0] && newChat[0].subject) {
        let Chats = await this.getChat()
        Chats.find((c) => c.id === newChat[0].id).name =
          newChat[0].subject
        await this.updateDb(Chats)
      }
    } catch (e) {
      logger.error(e)
      logger.error('Error updating document failed')
    }
  }

  async updateGroupParticipantsByApp(newChat) {

    try {
      if (newChat && newChat.id) {
        let Chats = await this.getChat()
        let chat = Chats.find((c) => c.id === newChat.id)
        let is_owner = false
        if (chat) {
          if (chat.participant == undefined) {
            chat.participant = []
          }
          if (chat.participant && newChat.action == 'add') {
            for (const participant of newChat.participants) {
              chat.participant.push({
                id: participant,
                admin: null,
              })
            }
          }
          if (chat.participant && newChat.action == 'remove') {
            for (const participant of newChat.participants) {
              if (chat.subjectOwner == participant) {
                is_owner = true
              }
              chat.participant = chat.participant.filter(
                (p) => p.id != participant
              )
            }
          }
          if (chat.participant && newChat.action == 'demote') {
            for (const participant of newChat.participants) {
              if (
                chat.participant.filter(
                  (p) => p.id == participant
                )[0]
              ) {
                chat.participant.filter(
                  (p) => p.id == participant
                )[0].admin = null
              }
            }
          }
          if (chat.participant && newChat.action == 'promote') {
            for (const participant of newChat.participants) {
              if (
                chat.participant.filter(

                  (p) => p.id == participant
                )[0]
              ) {
                chat.participant.filter(
                  (p) => p.id == participant
                )[0].admin = 'superadmin'
              }
            }
          }
          if (is_owner) {
            Chats = Chats.filter((c) => c.id !== newChat.id)
          } else {
            Chats.filter((c) => c.id === newChat.id)[0] = chat
          }
          await this.updateDb(Chats)
        }
      }
    } catch (e) {
      logger.error(e)
      logger.error('Error updating document failed')
    }
  }

  async groupParticipantsUpdate(id, users, action) {
    try {
      const res = await this.instance.sock?.groupParticipantsUpdate(
        this.getWhatsAppId(id),
        this.parseParticipants(users),
        action
      )
      return res
    } catch (e) {

      return {
        error: true,
        message:
          'unable to ' +
          action +
          ' some participants, check if you are admin in group or participants exists',
      }
    }
  }

  async groupSettingUpdate(id, action) {
    try {
      await this.verifyGroup(id)
      const res = await this.instance.sock?.groupSettingUpdate(
        this.getWhatsAppId(id),
        action
      )
      return {
        error: false,
        message:
          'Alteração referente a ' + action + ' Concluida',
      }
    } catch (e) {

      return {
        error: true,
        message:
          'Erro ao alterar' + action + ' Verifique se você tem permissão ou se o grupo existe',
      }
    }
  }

  async groupUpdateSubject(id, subject) {

    try {
      await this.verifyGroup(id)
      const res = await this.instance.sock?.groupUpdateSubject(
        this.getWhatsAppId(id),
        subject
      )
      return {
        error: false,
        message:
          'Nome do grupo alterado para ' + subject
      }
    } catch (e) {

      return {
        error: true,
        message:
          'Erro ao alterar o grupo, verifique se você é administrador ou se o grupo existe',
      }
    }
  }

  async groupUpdateDescription(id, description) {

    try {
      await this.verifyGroup(id)
      const res = await this.instance.sock?.groupUpdateDescription(
        this.getWhatsAppId(id),
        description
      )

      return {
        error: false,
        message:
          'Descrição do grupo alterada para ' + description
      }
    } catch (e) {

      return {
        error: true,
        message:
          'Falha ao alterar a descrição do grupo, verifique se você é um administrador ou se o grupo existe',
      }
    }
  }

  async groupGetInviteInfo(url) {
    try {
      const codeurl = url.split('/');


      const code = codeurl[codeurl.length - 1];


      const res = await this.instance.sock?.groupGetInviteInfo(code)
      return res
    } catch (e) {
      //console.log(e)
      return {
        error: true,
        message:
          'Falha ao obter o verificar o grupo. Verifique o codigo da url ou se o grupo ainda existe..',
      }
    }
  }


  async groupidinfo(id) {
    const to = this.getGroupId(id);

    try {

      const res = await Promise.race([
        this.instance.sock?.groupMetadata(to),
        new Promise((_, reject) => setTimeout(() => reject(), 5000))
      ]);
      return res;
    } catch (e) {

      return {
        error: true,
        message: 'Grupo não existe',
      };
    }
  }


  async groupAcceptInvite(id) {
    try {
      const res = await this.instance.sock?.groupAcceptInvite(id)
      return res
    } catch (e) {

      return {
        error: true,
        message:
          'Falha ao obter o verificar o grupo. Verifique o codigo da url ou se o grupo ainda existe..',
      }
    }
  }


  async updateDb(object) {
    try {
      await Chat.updateOne({ key: this.key }, { chat: object })
    } catch (e) {
      logger.error('Error updating document failed')

    }
  }

  async readMessage(msgObjs) {
    try {
      if (!Array.isArray(msgObjs)) {
        throw new Error("msgObjs deve ser um array de mensagens.");
      }

      const keys = msgObjs.map((msgObj) => ({
        remoteJid: msgObj.remoteJid,
        id: msgObj.id,
        participant: msgObj?.participant || undefined
      }));



      const res = await this.instance.sock?.readMessages(keys);
      return res;
    } catch (e) {
      logger.error("Erro ao marcar mensagens como lidas:", e.message);
      throw e;
    }
  }



  async reactMessage(id, key, emoji) {
    try {
      const reactionMessage = {
        react: {
          text: emoji,
          key: key
        }
      }
      const res = await this.instance.sock?.sendMessage(
        this.getWhatsAppId(id),
        reactionMessage
      )
      return res
    } catch (e) {
      logger.error('Error react message failed')
    }
  }

  async deleteMessage({ id, remoteJid, participant, fromMe }) {
    try {
      const deleteMessagePayload = {
        remoteJid,
        id,
        participant,
        fromMe,
      };

      const res = await this.instance.sock?.sendMessage(remoteJid, {
        delete: deleteMessagePayload,
      });

      return res;
    } catch (e) {
      logger.error("Erro ao deletar mensagem:", e.message);
      throw new Error("Falha ao deletar mensagem.");
    }
  }
  async editMessage({ body, edit, remoteJid }) {


    try {

      const messageKey = {
        id: edit,
        remoteJid: remoteJid,

        fromMe: true,
      };


      const messageContent = {
        text: body,
        caption: body,
        edit: messageKey,
      };


      const res = await this.instance.sock?.sendMessage(remoteJid, messageContent);

      return res;
    } catch (e) {
      console.error("Erro ao editar mensagem:", e.message);
      throw new Error("Falha ao editar mensagem.");
    }
  }


  async getMessagesFromFile() {
    try {
      const mensagensPath = path.join('db', this.key, 'messaging-messages.json');

      const mensagensExistem = await fs.access(mensagensPath).then(() => true).catch(() => false);
      if (!mensagensExistem) {
        return { error: true, message: "Mensagens não encontradas para a conexão especificada." };
      }

      const mensagensData = await fs.readFile(mensagensPath, 'utf-8');
      const mensagens = JSON.parse(mensagensData);

      const webhookData = {
        instanceKey: this.key,
        messages: mensagens,
      };

      await this.SendWebhook("history-message", "messaging-history.set", webhookData, this.key);

      return { error: false, messages: mensagens };
    } catch (error) {
      console.error("Erro ao recuperar mensagens:", error.message);
      return { error: true, message: "Erro ao recuperar mensagens." };
    }
  }

  async getMessagesByContact(contactId) {
    try {
      const mensagensPath = path.join('db', this.key, 'messaging-messages.json');

      const mensagensExistem = await fs.access(mensagensPath).then(() => true).catch(() => false);
      if (!mensagensExistem) {
        return { error: true, message: "Mensagens não encontradas para a conexão especificada." };
      }

      const mensagensData = await fs.readFile(mensagensPath, 'utf-8');
      const mensagens = JSON.parse(mensagensData);

      const mensagensDoContato = mensagens.filter(msg => msg.key.remoteJid === contactId);

      if (!mensagensDoContato.length) {
        return { error: true, message: "Nenhuma mensagem encontrada para o contato especificado." };
      }

      const webhookData = {
        instanceKey: this.key,
        messages: mensagensDoContato,
      };

      await this.SendWebhook("history-message", "messaging-history.set", webhookData, this.key);

      return { error: false, messages: mensagensDoContato };
    } catch (error) {
      console.error("Erro ao recuperar mensagens do contato:", error.message);
      return { error: true, message: "Erro ao recuperar mensagens do contato." };
    }
  }


  async getTotalMessages() {
    try {
      const mensagensPath = path.join('db', this.key, 'messaging-messages.json');

      const mensagensExistem = await fs.access(mensagensPath).then(() => true).catch(() => false);
      if (!mensagensExistem) {
        return { error: true, message: "Mensagens não encontradas para a conexão especificada.", total: 0 };
      }

      const mensagensData = await fs.readFile(mensagensPath, 'utf-8');
      const mensagens = JSON.parse(mensagensData);

      return { error: false, total: mensagens.length };
    } catch (error) {
      console.error("Erro ao calcular total de mensagens:", error.message);
      return { error: true, message: "Erro ao calcular total de mensagens.", total: 0 };
    }
  }

  async getTotalMessagesByContact(contactId) {
    try {
      const mensagensPath = path.join('db', this.key, 'messaging-messages.json');

      const mensagensExistem = await fs.access(mensagensPath).then(() => true).catch(() => false);
      if (!mensagensExistem) {
        return { error: true, message: "Mensagens não encontradas para a conexão especificada.", total: 0 };
      }

      const mensagensData = await fs.readFile(mensagensPath, 'utf-8');
      const mensagens = JSON.parse(mensagensData);

      const mensagensDoContato = mensagens.filter(msg => msg.key.remoteJid === contactId);

      return {
        error: false,
        total: mensagensDoContato.length
      };
    } catch (error) {
      console.error("Erro ao calcular total de mensagens do contato:", error.message);
      return {
        error: true,
        message: "Erro ao calcular total de mensagens do contato.",
        total: 0
      };
    }
  }

}

exports.WhatsAppInstance = WhatsAppInstance


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
