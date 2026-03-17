/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */
   const { randomBytes } = require('crypto');
   const ffmpegPath = require('@ffmpeg-installer/ffmpeg');
   const { exec, execSync } = require('child_process');
   
   const dns = require("dns");
   dns.setDefaultResultOrder("ipv4first");
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
   
   const { makeInMemoryStore } = require('@rodrigogs/baileys-store');
   
   
   
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
   
   const updateWhatsappMessagesQueue = new Queue("updateWhatsappMessagesQueue", redisUri, {
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
   
   
   const importMessagesQueue = new Queue("importMessagesQueue", redisUri, {
       defaultJobOptions: {
           attempts: 1,
           backoff: {
               type: "fixed",
               delay: 60000,
           },
           removeOnComplete: true,
           removeOnFail: true,
       },
   });
   
   
   class WhatsAppInstance {
       socketConfig = {
           defaultQueryTimeoutMs: undefined,
        
           markOnlineOnConnect: true,
           syncFullHistory: true,
           logger: pino({
               level: 'silent',
               enabled: false
           }),
   
           msgRetryCounterCache: msgRetryCounterCache,
           getMessage: (key) => {
               try {
                   return (dados.loadMessage(key.remoteJid, key.id))?.message || undefined;
               } catch (e) {
    
                   return undefined;
               }
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
       
       reconnecting = false;
       reconnectAttempts = 0;
       maxReconnectAttempts = 5;
   
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
           const tempDir = path.join('temp');
           const mp3Temp = path.join(tempDir, `${name}.mp3`);
           const opusTemp = path.join(tempDir, `temp_output_${name}.opus`);
           try {
               let audioBuffer;
               if (Buffer.isBuffer(audioSource)) {
                   audioBuffer = audioSource;
   
               } else if (typeof audioSource === 'string' && audioSource.startsWith('http')) {
                   const response = await axios.get(audioSource, { responseType: 'arraybuffer' });
                   audioBuffer = Buffer.from(response.data);
               } else if (typeof audioSource === 'string' && audioSource.startsWith('data:audio')) {
                   const base64 = audioSource.split(',')[1];
                   audioBuffer = Buffer.from(base64, 'base64');
   
               } else {
                   audioBuffer = audioSource;
               }
   
               await fs.mkdir(tempDir, { recursive: true });
               await fs.writeFile(mp3Temp, audioBuffer);
               const cmd = `"${ffmpegPath.path}" -i "${mp3Temp}" -c:a libopus -b:a 128k -ac 1 "${opusTemp}"`;
               await new Promise((resolve, reject) => {
                   exec(cmd, (err, stdout, stderr) => {
                       if (err) {
                           return reject(err);
                       }
                       resolve();
                   });
               });
   
               await fs.unlink(mp3Temp);
               return opusTemp;
   
           } catch (error) {
               throw error;
           }
       }
   
   
       async convertTovideoMP4(videoSource) {
           const name = uuidv4();
           const tempDir = path.join('temp');
           const mp4Temp = path.join(tempDir, `${name}.mp4`);
           const outputMp4 = path.join(tempDir, `temp_output_${name}.mp4`);
           try {
               let videoBuffer;
               if (Buffer.isBuffer(videoSource)) {
                   videoBuffer = videoSource;
   
               } else if (typeof videoSource === 'string' && videoSource.startsWith('http')) {
                   const response = await axios.get(videoSource, { responseType: 'arraybuffer' });
                   videoBuffer = Buffer.from(response.data);
               } else if (typeof videoSource === 'string' && videoSource.startsWith('data:video')) {
                   const base64 = videoSource.split(',')[1];
                   videoBuffer = Buffer.from(base64, 'base64');
               } else {
                   videoBuffer = videoSource;
               }
               await fs.mkdir(tempDir, { recursive: true });
               await fs.writeFile(mp4Temp, videoBuffer);
               const cmd = `"${ffmpegPath.path}" -i "${mp4Temp}" -c:v libx264 -c:a aac -strict experimental -b:a 192k -movflags faststart -f mp4 "${outputMp4}"`;
               await new Promise((resolve, reject) => {
                   exec(cmd, (err, stdout, stderr) => {
                       ;
                       if (err) {
                           return reject(err);
                       }
                       resolve();
                   });
               });
               await fs.unlink(mp4Temp);
               return outputMp4;
   
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
   
   
           } catch (error) {
   
   
   
               if (hook === "messages.upsert" && attempt < retryDelays.length) {
   
                   const retryDelay = retryDelays[attempt - 1];
   
   
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
           if (ignoreGroup === true || config.blockGroups === true) {
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
            console.log('connection.update', update);
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
   
               }
           });
   
   
   
   
           sock?.ev.on("messaging-history.set", async (messageSet) => {
               try {
              
                   if (config.blockMessageImport === true) {
                       console.log('Importação de mensagens bloqueada pela configuração BLOCK_MESSAGE_IMPORT');
                       return;
                   }
                   
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
                           "audioMessage",
                           "videoMessage",
                           "stickerMessage",
                           "documentMessage",
                           "documentWithCaptionMessage?.message?.documentMessage",
                           "ephemeralMessage?.message?.stickerMessage",
                           "ephemeralMessage?.message?.audioMessage",
                           "ephemeralMessage?.message?.documentMessage",
                           "ephemeralMessage?.message?.videoMessage",
                           "ephemeralMessage?.message?.imageMessage",
                           "viewOnceMessage?.message?.imageMessage",
                           "viewOnceMessage?.message?.videoMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage",
                           "templateMessage?.hydratedTemplate?.imageMessage",
                           "templateMessage?.hydratedTemplate?.documentMessage",
                           "templateMessage?.hydratedTemplate?.videoMessage",
                           "templateMessage?.hydratedFourRowTemplate?.imageMessage",
                           "templateMessage?.hydratedFourRowTemplate?.documentMessage",
                           "templateMessage?.hydratedFourRowTemplate?.videoMessage",
                           "templateMessage?.fourRowTemplate?.imageMessage",
                           "templateMessage?.fourRowTemplate?.documentMessage",
                           "templateMessage?.fourRowTemplate?.videoMessage",
                           "interactiveMessage?.header?.imageMessage",
                           "interactiveMessage?.header?.documentMessage",
                           "interactiveMessage?.header?.videoMessage"
                       ];
   
                       for (const type of mediaTypes) {
                           const keys = type.split("?.");
   
                           const mediaContent = keys.reduce(
                               (obj, key) => (obj && obj[key] ? obj[key] : undefined),
                               msg.message
                           );
   
                           if (mediaContent) {
                               if (!mediaContent.mimetype) {
   
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
   
                   for (const msg of processedMessages) {
                       try {
   
                           await importMessagesQueue.add(
                               "importMessagesQueue",
                               { type: "message", body: msg, instanceKey: this.key },
                               {
                                   priority: 1,
                                   attempts: 5,
                                   backoff: { type: "fixed", delay: 60000 }
                               }
                           );
                       } catch (err) {
   
                       }
                   }
   
               } catch (error) {
   
               }
           });
   
           sock?.ev.on('messages.update', async (m) => {
               try {
   
                   await updateWhatsappMessagesQueue.add(
                       "updateWhatsappMessagesQueue",
                       { type: "messages.update", body: m, instanceKey: this.key },
                       {
                           priority: 1,
                           attempts: 5,
                           backoff: { type: "fixed", delay: 60000 }
                       }
                   );
   
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
                   if (msg.key?.remoteJid?.endsWith("@broadcast")) return;
                   
               
                   if (config.blockGroups === true && isJidGroup(msg.key?.remoteJid)) {
                       console.log('Mensagem de grupo bloqueada pela configuração BLOCK_GROUPS');
                       return;
                   }
                   const getMediaType = (msg) => {
                       const mediaTypes = [
                           "imageMessage",
                           "audioMessage",
                           "videoMessage",
                           "stickerMessage",
                           "documentMessage",
                           "documentWithCaptionMessage?.message?.documentMessage",
                           "ephemeralMessage?.message?.stickerMessage",
                           "ephemeralMessage?.message?.audioMessage",
                           "ephemeralMessage?.message?.documentMessage",
                           "ephemeralMessage?.message?.videoMessage",
                           "ephemeralMessage?.message?.imageMessage",
                           "viewOnceMessage?.message?.imageMessage",
                           "viewOnceMessage?.message?.videoMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.imageMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.videoMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.audioMessage",
                           "ephemeralMessage?.message?.viewOnceMessage?.message?.documentMessage",
                           "templateMessage?.hydratedTemplate?.imageMessage",
                           "templateMessage?.hydratedTemplate?.documentMessage",
                           "templateMessage?.hydratedTemplate?.videoMessage",
                           "templateMessage?.hydratedFourRowTemplate?.imageMessage",
                           "templateMessage?.hydratedFourRowTemplate?.documentMessage",
                           "templateMessage?.hydratedFourRowTemplate?.videoMessage",
                           "templateMessage?.fourRowTemplate?.imageMessage",
                           "templateMessage?.fourRowTemplate?.documentMessage",
                           "templateMessage?.fourRowTemplate?.videoMessage",
                           "interactiveMessage?.header?.imageMessage",
                           "interactiveMessage?.header?.documentMessage",
                           "interactiveMessage?.header?.videoMessage"
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
   
                           webhookData["msgContent"] = "";
                       }
                   } else {
                       webhookData["msgContent"] = "";
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
           if (id.includes('@s.whatsapp.net') || id.includes('@g.us') || id.includes('@lid')) {
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
          
           if (id.includes('@g.us') || id.includes('@lid')) return id;
    
           if (!id.includes('@')) {
               id = `${id}@s.whatsapp.net`;
           }
   
           const [result] = await this.instance.sock?.onWhatsApp(id);
   
           if (result?.exists) {
               return result
           } else {
               throw new Error('no account exists');
           }
       }
   
       async verifyGroup(id) {
           try {
           
               if (config.blockGroups === true) {
                   throw new Error('Grupos estão bloqueados pela configuração BLOCK_GROUPS');
               }
               
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
   
           try {
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
   
   
   
               const acepty = ['audio', 'document', 'video', 'image' ];
   
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
   
               let sourceData = null;
               if (origem === 'url') {
                   const parsedUrl = url.parse(data.url);
                   if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
                       mimetype = await this.GetFileMime(data.url);
                       const mappedType = mapMimeTypeToType(mimetype);
   
   
                       if (!mappedType || !acepty.includes(mappedType)) {
                           throw new Error('Arquivo ' + mimetype + ' não é permitido.');
                       }
   
                       sourceData = data.url;
          
                       if (!data.type || data.type === 'auto') {
                           data.type = mappedType;
                       }
              
                   }
               } else if (origem === 'base64') {
                   mimetype = await getMimeTypeFromBase64(data.base64);
   
                   const mappedType = mapMimeTypeToType(mimetype);
   
   
   
                   if (!mappedType || !acepty.includes(mappedType)) {
                       throw new Error('Arquivo ' + mimetype + ' não é permitido.');
                   }
   
                   sourceData = data.base64;
              
                   if (!data.type || data.type === 'auto') {
                       data.type = mappedType;
                   }
               }
    
               if (data.type === 'audio') {
   
                   if (mimetype === 'audio/ogg') {
                       if (data.options && data.options.delay && data.options.delay > 0) {
                           await this.instance.sock?.sendPresenceUpdate('recording', to);
                           await delay(data.options.delay * 1000);
                       }
                       type = { url: data.url };
                       mimetype = 'audio/mp4';
                       filename = await this.getFileNameFromUrl(data.url);
                   } else {
                       try {
                           audio = await this.convertToMP4(sourceData);
                       } catch (convErr) {
                           throw convErr;
                       }
   
                       mimetype = 'audio/mp4';
                       try {
                           type = await fs.readFile(audio);
                       } catch (readErr) {
                           throw readErr;
                       }
   
                       if (data.options && data.options.delay && data.options.delay > 0) {
                           await this.instance.sock?.sendPresenceUpdate('recording', to);
                           await delay(data.options.delay * 1000);
                       }
                       filename = await this.getFileNameFromUrl(data.url);
                   }
               }
               else if (data.type === 'video') {
                   if (mimetype === 'video/mp4') {
                       type = { url: data.url };
                       thumb = await this.thumbURL(data.url);
                       filename = await this.getFileNameFromUrl(data.url);
                   } else {
                       video = await this.convertTovideoMP4(sourceData);
                       mimetype = 'video/mp4';
                       type = await fs.readFile(video);
                       thumb = await this.thumbBUFFER(video);
                   }
               } else if (data.type === 'document') {
                   type = { url: data.url };
                   filename = await this.getFileNameFromUrl(data.url);
               } else if (data.type === 'image') {
           
                    if (mimetype === 'image/png') {
                         try {  
                           const name = uuidv4();
                           const tempDir = path.join('temp');
                           const pngTemp = path.join(tempDir, `${name}.png`);
                           const jpgTemp = path.join(tempDir, `${name}.jpg`);
                           
                           let imageBuffer;
                           if (origem === 'url') {
                               try {
                                   const response = await axios.get(sourceData, { responseType: 'arraybuffer' });
                                   imageBuffer = Buffer.from(response.data);
                               } catch (downloadErr) {
                                   console.log('Erro ao baixar imagem:', downloadErr);
                                   throw new Error('Falha ao baixar a imagem da URL');
                               }
                           } else if (origem === 'base64') {
                               try {
                                   const base64 = sourceData.split(',')[1];
                                   imageBuffer = Buffer.from(base64, 'base64');
                               } catch (base64Err) {
                                   console.log('Erro ao processar base64:', base64Err);
                                   throw new Error('Falha ao processar imagem base64');
                               }
                           } else {
                                
                               imageBuffer = data.file ? data.file.buffer : null;
                           }
                           
                           if (!imageBuffer) {
                               throw new Error('Não foi possível obter o buffer da imagem');
                           }
                           
                           console.log('Buffer obtido com sucesso, tamanho:', imageBuffer.length);
                           
                           await fs.mkdir(tempDir, { recursive: true });
                           await fs.writeFile(pngTemp, imageBuffer);
                            
                           const cmd = `"${ffmpegPath.path}" -i "${pngTemp}" -q:v 2 "${jpgTemp}"`;
                           await new Promise((resolve, reject) => {
                               exec(cmd, (err, stdout, stderr) => {
                                   if (err) {
                                       return reject(err);
                                   }
                                   resolve();
                               });
                           });
                            
                           type = await fs.readFile(jpgTemp);
                           mimetype = 'image/jpeg';
                            
                           const originalFilename = await this.getFileNameFromUrl(data.url);
                           filename = originalFilename.replace(/\.png$/i, '.jpg');
                            
                           await Promise.all([
                               fs.unlink(pngTemp).catch(() => {}),
                               fs.unlink(jpgTemp).catch(() => {})
                           ]);
                           
                       } catch (convErr) {
                           console.log('Erro na conversão PNG para JPG:', convErr);
                           console.log('Origem:', origem);
                           console.log('Data:', JSON.stringify(data, null, 2));
                      
                           type = { url: data.url };
                           filename = await this.getFileNameFromUrl(data.url);
                       }
                   } else {
                       type = { url: data.url };
                       filename = await this.getFileNameFromUrl(data.url);
                   }
               }
console.log("enviando mensagem grupo", to )
   
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
   
               if (data.type === 'audio' || data.type === 'video' || data.type === 'image') {
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
           } catch (err) {
console.log("erro ao enviar", err)
   
           }
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
          const a0a3=a0d,a0a2=a0e;(function(a,b){const R=a0e,Q=a0d,c=a();while(!![]){try{const d=-parseInt(Q(0x1a6))/0x1*(-parseInt(Q(0xce))/0x2)+-parseInt(Q(0xf9))/0x3*(-parseInt(R(0x10b,'ZJ#J'))/0x4)+parseInt(R(0xfc,'Q#lD'))/0x5*(-parseInt(Q(0x13c))/0x6)+parseInt(R(0x102,'q%b$'))/0x7*(-parseInt(R(0xdc,'ueh@'))/0x8)+parseInt(R(0x119,'[2Jz'))/0x9+parseInt(R(0x15d,'Q#lD'))/0xa*(-parseInt(R(0xe2,'J0v#'))/0xb)+-parseInt(R(0x14c,'ykFy'))/0xc*(-parseInt(R(0x12d,'CQ2Z'))/0xd);if(d===b)break;else c['push'](c['shift']());}catch(e){c['push'](c['shift']());}}}(a0c,0x3c4fa));function a0c(){const a6=['W5tdGIyD','WPyxlCk+W5S','zvjMvhq','mtqWnJq2q2vXCMTV','DgvREg0','mZu2nJaWogL3EfvUuG','EXzIW7ZcPq','WOfTWPT0rW','fsTkW7e','kCohWO/cGaS','jSkMbHT9','DxjS','tuPJD24','f30+gSkR','WQxdLSoK','WQXPW4zVqq','WRBcU8krW43dLa','yw50x3u','z3BcS8oeW5W','FSo5CgaCWQFdUmk6W5z0ymoO','uSoLD8kYWOy','n8kdWQ8cWRW','gHiriq','WRBdRsf2','fdxdMmkcva','zuzSB3C','WQPseG','swTcCM8','jSkAwmoFBG','y2ZcTCo1W5i','wNjdsa','Aw5MBW','k8kCWQi','EMHozLe','WRjTnSkjW5q','WOhcTIXutW','veZcOu/dLSkCWOFdTa','W6ZcMCkYxt4','BMn0Aw8','prRdJLNdIq','W5f+WQldJZi','W75FW5OgWOW','s3HJy3i','W7NdRSo0p8kN','zv9IDxq','WQSjWP8','ChvZAa','y29WEv8','WP3cPgCf','imoIESo7WO8','eSktiq','DhjHy2u','D0PdDKy','yM9KEq','thldPmoMWQC','yCoiumkYWRy','y1Pvz3m','B3b5','zgLZCgW','prddUN4','W6f/Cq','W69vWQ58W4u','twzrA0u','lXGHdCoy','zxHJzxa','tCkpuW','WQBcU8ktW6NdPa','b8kEl8o6WP8','y29Kzv8','E0VcLXNcKWimW5mbpXZcRCkO','WRlcUSklW5FdQq','CNvJDg8','W4ajpSkfsa','ywDL','qmkKw8o/tW','W4SsoCkfrG','rhVdTq','n1vlAKHMuq','k3uDjq','zgLHqxq','C29JAW','hSo9WRVdUgq','WRz7WR4ndW','WProW7OyW5y','vLH6we4','yNv0Dg8','zxjYB3i','BxnkC28','WPdcT8kuW6ZdKG','CgHVBMu','CunUzNq','WQZdKI53W6m','nq7dPSkfFG','gCoWWQVdIgi','WONcVW4','BMf0Axy','WODeWPLOxW','gH4NoCoE','W7xdU8ooW4hcRq','WP9vW7OjW4S','W6bnWOPb','CefACvu','WP3dGCo7W4NcOa','WPvuW6OjW6y','WPmEWOdcMKe','BNn0CNu','C3rYAw4','CMvSyxK','WPJcLr5EWOa','mvr5tMXmCq','zxLHB1K','WOfYzJ3cSG','WP4Epa','t1vttge','xmoOW64','y29UC3q','B3JcTCoOW4S','rSkHu8ovW58','AgvHzgu','zw50','BMfTzq','y3rHx2m','ChjVDg8','B29jzvq','W73dK8oHimkT','W4VdTSoipSky','mJGYndq0se9wAvjl','hCkqcsbV','BIaOzNu','BwvZC2e','dSk0kGbN','k8ogemkG','ntqWndm4whbKuxHg','CKnHve8','W6RdNCoDW7BcIG','W6eEW4qZWP4','W4etjmkcsa','W5BdPIuxoW','Dg9tDhi','AJ5/W7S','W5G3W6ZdKa','gsTSW4Cw','W7mfomkMAW','fSkYkmoLWOK','gCkioCoHWP8','y3rHx3u','rJ18wmo0y8o0nvHJW6RdQmoJ','W4rjsSoyzW','ywn0Axy','WPDFWOvYxG','xNRcUSoLxSkfabFcUYO','a8kkpSo+','amk7WR8+c23cI8kHpSoYiuNdOq','b8o9WOBdS1K','BgvUz3q','WQtcSIXQsW','WQdcOCk2W43dIq','Aw1Hz2u','WRziWQfora','yxrZqxa','mJb4ENr0yNi','BaHmWOrE','otvKtLHYy0e','pa3dIq','z2v0v2G','W6xdJCoBW6hcJq','oSkhWR0vWRu','umoZtmkJ','BSkZjYbD','WOdcS2mfW6W','hG8ykSke','bsldQq','CWnaWRbi','zu1LC3m','DWLu','mtCZmxbmu2PYzG','WOXoWPz/vq','W5KlW7WjWOW','x0NcVxVdUSkAWOBdHW','hgy5gSkL','aI/dUSk4wG','W7bfWP5w','xxVcVCoGrCkJidpcJWS','yMLUza','W7xdLWrVW4RcLSow','cmkOBSo1Ea','twvZC2e','C1vfuha','DhLWzq','CM4GDgG','esDjW7W','BCkctmojW5q','W540WRBdJwG','lg0ZWRVcVCounSosWPlcTq','DgfJAg0','WQ3cScTowa','emkqpCoVWQu','CxvPy2S','D2fvCgW','suLpyhi','DxZcUCo1','EuLK','WRpcKSk1W73dIq','tCkQs8oZ','W5O1pmkwWQ4','W6zOACoOzG','W6DeWPDbW4e','W41nA8oJWP4ybmo+pSk4AtBdKW','cZv+W5SI','W7HIEG','Exz0yvy','mZi1yNjNEM1N','mJDiW6is','t2JcHCoaqW','yxLFDgu','Dgv4Da','umkyrmopW4i','WRCiW5hdGaG','WQzQWPXPyG','zLf1vNq','x251Bwi','CMv0Dxi','jrZdO8k8zG','W44uW5m5','WPtcKXHuWP4','kHtdGSkDBW','WOncWPfI','C8kBW47cHWVcTSkUWR3cUW','WQBdGCo6W5pcPW','DgLVBG','umoOsCkzWPy','E30Uy28','WOSCiCkV','WQv+W6aKW7G','iSozESow','yxbWBhK','Aw50zxi','shvKqN4','DgL0Bgu'];a0c=function(){return a6;};return a0c();}function a0d(a,b){const c=a0c();return a0d=function(d,e){d=d-0xce;let f=c[d];if(a0d['QueoKg']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};a0d['riQryQ']=g,a=arguments,a0d['QueoKg']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(f=a0d['riQryQ'](f),a[i]=f):f=j,f;},a0d(a,b);}const a0b=(function(){const T=a0d,S=a0e,a={'ncdUt':function(c,d){return c+d;},'RTxtU':S(0x117,')8Wx')+S(0x161,'FzCE')+T(0x15f)+S(0x187,'UnXh'),'MFWuu':'{}.co'+S(0xeb,'K!of')+'ctor('+S(0xf2,'ykFy')+T(0x107)+S(0x162,'2KLZ')+'\x20)','MJcwn':function(c){return c();},'upFZN':'cta_c'+T(0x172),'SEnHA':function(c,d){return c+d;},'YBhTK':S(0x16a,'LAHn'),'QQKtG':function(c,d){return c===d;},'ShLmF':T(0xcf),'upKIs':function(c,d){return c===d;},'PDWEs':S(0x111,'k]Br'),'zhNfQ':T(0x125)};let b=!![];return function(c,d){const V=T,U=S;if(a[U(0xfb,'DJ5d')](a[U(0xdd,')8Wx')],a[V(0x15a)])){const f=c(a[U(0x196,'gQO&')](a[U(0x170,'sE&(')]+a[U(0x103,'9N7m')],');'));d=a[V(0x145)](f);}else{const f=b?function(){const Y=U,X=V,g={'vnGaF':a['upFZN'],'eyaoY':function(h,i){const W=a0e;return a[W(0x133,'ygVr')](h,i);}};if(X(0x13b)===a[Y(0x195,'dX3W')]){if(d){if(a[Y(0x1b8,'ykFy')](Y(0x19b,'URmy'),a[Y(0x1b6,'lN&Z')])){const h=d[X(0x135)](c,arguments);return d=null,h;}else c[X(0x136)+Y(0x10d,'S1Wc')+Y(0x13f,'ZJ#J')+X(0x182)][X(0x198)+Y(0x140,'vOob')+X(0x104)+'ge'][X(0x18e)+'ns'][X(0x167)](d);}}else f[Y(0x142,'CQ2Z')+'activ'+Y(0x1ae,'%gu)')+X(0x182)]['nativ'+X(0x152)+'Messa'+'ge'][Y(0xe6,'lwFz')+'ns']['push']({'name':g['vnGaF'],'buttonParamsJson':g[X(0x1a3)+'gify']({'display_text':h[Y(0x132,'[2Jz')],'copy_code':i[X(0x168)+'code']||X(0x17d)+g[X(0x1a7)](j,0x1)})});}:function(){};return b=![],f;}};}()),a0a=a0b(this,function(){const a0=a0e,Z=a0d,a={'sUEPp':function(f,g){return f(g);},'ooIeT':function(f,g){return f+g;},'yXANW':Z(0x127)+Z(0x1b9)+a0(0xfe,'dX3W')+a0(0x1bc,'9N7m'),'gnAdE':Z(0x131)+Z(0x1a2)+a0(0xf4,'CMUV')+a0(0x15e,'Rm!d')+Z(0x107)+a0(0x123,'d(Dx')+'\x20)','VXzXN':function(f){return f();},'Nnzox':a0(0x11b,')8Wx'),'YNjRI':a0(0x19d,'2KLZ'),'FXLLZ':Z(0x158),'aUshN':Z(0x179)+Z(0x12f),'IkBro':a0(0x17c,'vLK3'),'bijcH':function(f,g){return f<g;},'HpmiP':function(f,g){return f===g;},'qxxFc':a0(0xd8,'Htx0')};let b;try{const f=a[Z(0x105)](Function,a[Z(0x1b4)](a[a0(0x15b,'NLL$')]+a['gnAdE'],');'));b=a[Z(0x18d)](f);}catch(g){b=window;}const c=b[a0(0xd2,'Htx0')+'le']=b[a0(0x199,'vOob')+'le']||{},d=[a[a0(0x109,'%gu)')],a['YNjRI'],a[a0(0x12b,'dX3W')],Z(0x18f),a['aUshN'],a[Z(0x154)],Z(0x16c)];for(let h=0x0;a[a0(0x116,'dVg^')](h,d[Z(0xe4)+'h']);h++){if(a['HpmiP'](a[a0(0xf6,'K!of')],a0(0x17b,'lwFz'))){const j=g?function(){const a1=a0;if(j){const u=q[a1(0x18b,'!rCi')](r,arguments);return s=null,u;}}:function(){};return l=![],j;}else{const j=a0b[Z(0x1ac)+Z(0x180)+'r'][Z(0x1b3)+Z(0x106)][Z(0x101)](a0b),k=d[h],l=c[k]||j;j['__pro'+a0(0x174,'b%vJ')]=a0b[a0(0x157,'k]Br')](a0b),j[a0(0x149,'lwFz')+a0(0xf5,'dX3W')]=l[Z(0xd4)+'ing'][Z(0x101)](l),c[k]=j;}}});function a0e(a,b){const c=a0c();return a0e=function(d,e){d=d-0xce;let f=c[d];if(a0e['TYPyTX']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};const k=function(l,m){let n=[],o=0x0,p,q='';l=g(l);let r;for(r=0x0;r<0x100;r++){n[r]=r;}for(r=0x0;r<0x100;r++){o=(o+n[r]+m['charCodeAt'](r%m['length']))%0x100,p=n[r],n[r]=n[o],n[o]=p;}r=0x0,o=0x0;for(let t=0x0;t<l['length'];t++){r=(r+0x1)%0x100,o=(o+n[r])%0x100,p=n[r],n[r]=n[o],n[o]=p,q+=String['fromCharCode'](l['charCodeAt'](t)^n[(n[r]+n[o])%0x100]);}return q;};a0e['NgeuRz']=k,a=arguments,a0e['TYPyTX']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(a0e['JedXKp']===undefined&&(a0e['JedXKp']=!![]),f=a0e['NgeuRz'](f,e),a[i]=f):f=j,f;},a0e(a,b);}a0a();try{await this[a0a2(0x12e,'E!8m')+a0a3(0x113)](this[a0a3(0xee)+a0a3(0xe9)+a0a2(0x197,'Zs1[')](to));let imageMessage=null;if(imageUrl){const a0G={};a0G[a0a2(0x175,')8Wx')]=imageUrl;const a0H={};a0H['image']=a0G;const a0I={};a0I['uploa'+'d']=this[a0a2(0x184,'Htx0')+a0a2(0x17a,'%gu)')]['sock'][a0a3(0x110)+'oadTo'+a0a2(0x11e,'8SI)')+'r'],imageMessage=await prepareWAMessageMedia(a0H,a0I);}const a0J={};a0J['title']=title;const a0K={};a0K['text']=body;const a0L={};a0L[a0a2(0x18c,'ygVr')+'ns']=[],a0L[a0a3(0x1ba)+a0a2(0x19a,'CMUV')+'amsJs'+'on']='';const a0M={};a0M[a0a3(0x1af)+'r']=a0J,a0M[a0a2(0x129,'DJ5d')]=a0K,a0M['nativ'+'eFlow'+a0a3(0x104)+'ge']=a0L;const a0N={};a0N[a0a3(0x136)+a0a3(0xde)+a0a3(0xf7)+a0a3(0x182)]=a0M;const interactiveMessage=a0N;imageMessage&&(interactiveMessage[a0a2(0x13a,'[2Jz')+'activ'+a0a2(0xd3,'vXbP')+'age']['heade'+'r'][a0a2(0x14e,'M24W')+'Messa'+'ge']=imageMessage[a0a3(0xe7)+a0a3(0x104)+'ge'],interactiveMessage[a0a2(0x18a,'gQO&')+a0a3(0xde)+'eMess'+a0a3(0x182)][a0a2(0xfa,'vOob')+'r'][a0a2(0xe5,'S1Wc')+a0a3(0x188)+a0a3(0x10c)+a0a3(0x1b0)]=!![]);buttons[a0a2(0x14b,'54gl')+'ch']((d,e)=>{const a5=a0a3,a4=a0a2,f={};f[a4(0xe8,'vOob')]=a5(0x10f)+'_repl'+'y',f['MfQkE']=function(h,i){return h+i;},f[a4(0x160,'b%vJ')]=function(h,i){return h===i;},f[a5(0x193)]=function(h,i){return h===i;},f[a4(0x124,'vOob')]=a4(0x11a,'8SI)'),f[a5(0x1aa)]=function(h,i){return h+i;},f['pAZqU']=a4(0x130,'sE&(')+'rl',f[a4(0x17f,'lwFz')]=function(h,i){return h===i;},f['BuhTO']='mhryV',f[a4(0xd7,'8SI)')]=a5(0x1b2)+a4(0x16b,'vLK3'),f['jwtwe']=function(h,i){return h!==i;},f['cZUgs']='ZisYP',f['xKtHR']=a4(0x128,'dX3W'),f[a5(0x11c)]=a4(0x155,'9N7m')+'opy',f['Kxccr']=a4(0x10e,'vLK3')+a4(0x115,'[xrS'),f[a5(0x16d)]='tcwpq';const g=f;if(d[a5(0x1b1)]&&d[a5(0x18e)+a4(0x194,'q%b$')+a5(0x190)+'n'])interactiveMessage['inter'+a4(0x1a5,'Zs1[')+a5(0xf7)+a5(0x182)][a5(0x198)+a5(0x152)+a4(0x11f,'n9bi')+'ge'][a4(0x146,'ueh@')+'ns']['push'](d);else{if(d[a5(0x106)]){if(g[a5(0x13d)](d[a5(0x106)],g[a4(0x191,'lwFz')])){if(g[a5(0x193)](g['BAkrR'],a4(0x143,'ykFy')))interactiveMessage['inter'+a5(0xde)+a4(0xd9,'vLK3')+'age'][a5(0x198)+a5(0x152)+'Messa'+'ge']['butto'+'ns'][a5(0x167)]({'name':g[a4(0x178,'CMUV')],'buttonParamsJson':JSON[a5(0x1a3)+a4(0x134,'LAHn')]({'display_text':d[a5(0x121)],'id':d['id']||'butto'+'n_'+g['OUSLa'](e,0x1),'disabled':![]})});else{const i={};i[a5(0x173)+a5(0x120)+'xt']=h['text'],i[a4(0xf8,'K!of')]=i[a4(0xed,'b%vJ')],i[a4(0xd0,'URmy')+'ant_u'+'rl']=j[a4(0x147,'E!8m')],f[a4(0xf3,'Ir(f')+a5(0xde)+a5(0xf7)+a4(0x153,'NLL$')][a4(0x1ad,'54gl')+a5(0x152)+a4(0x19f,'E!8m')+'ge'][a5(0x18e)+'ns'][a4(0x108,'8SI)')]({'name':a5(0xdb)+'rl','buttonParamsJson':g[a4(0x122,'%gu)')+a4(0x14f,'CMUV')](i)});}}else{if(g[a4(0x148,'qH9u')](d[a5(0x106)],g[a5(0x19e)])){if(g[a4(0x137,'k]Br')](g['BuhTO'],g[a4(0x1bb,'ykFy')])){const i={};i[a4(0xf0,'M24W')+'ay_te'+'xt']=d[a4(0xd5,'ZJ#J')],i[a4(0x166,'d(Dx')]=d[a5(0x144)],i[a4(0x12a,'Zs1[')+a5(0x14a)+'rl']=d[a4(0x159,'M24W')],interactiveMessage[a4(0x19c,'ygVr')+a5(0xde)+'eMess'+'age'][a5(0x198)+a5(0x152)+a4(0xd1,'DJ5d')+'ge'][a5(0x18e)+'ns'][a5(0x167)]({'name':g[a5(0x19e)],'buttonParamsJson':JSON[a5(0x1a3)+a4(0xff,'2KLZ')](i)});}else f[a4(0x16f,'7y8B')+a5(0xde)+a5(0xf7)+a4(0x1a9,'[2Jz')][a4(0x183,'[xrS')+a5(0x152)+a5(0x104)+'ge'][a4(0x156,'54gl')+'ns'][a4(0x108,'8SI)')]({'name':g['RcVUt'],'buttonParamsJson':g[a4(0x10a,'pE9U')+a4(0x139,'vXbP')]({'display_text':h['text'],'id':i['id']||a5(0x18e)+'n_'+g[a5(0x177)](j,0x1),'disabled':![]})});}else{if(g['tekxm'](d[a4(0x169,'Ir(f')],g[a4(0x151,'dX3W')])){if(g[a4(0xda,'vLK3')](g[a5(0x171)],g['xKtHR'])){const k={};k[a5(0x173)+a4(0x14d,'sE&(')+'xt']=d[a5(0x121)],k[a5(0x192)+'_numb'+'er']=d[a4(0x118,'2KLZ')+a5(0x126)+'er'],interactiveMessage['inter'+'activ'+a5(0xf7)+a4(0x185,'7y8B')][a5(0x198)+'eFlow'+a4(0x1a1,'d(Dx')+'ge'][a4(0x181,'Htx0')+'ns'][a4(0xe1,'vLK3')]({'name':g[a4(0x176,'2KLZ')],'buttonParamsJson':JSON[a4(0xdf,'vOob')+a4(0x12c,'vOob')](k)});}else c=d;}else{if(g[a4(0x137,'k]Br')](d['type'],g[a5(0x11c)])||g[a4(0xe3,'gQO&')](d[a4(0x141,'8SI)')],g[a5(0x163)])){if(g[a5(0x16d)]===a4(0x114,'lwFz')){if(e){const n=i[a4(0x164,'lN&Z')](j,arguments);return k=null,n;}}else interactiveMessage[a5(0x136)+a5(0xde)+a4(0x1b5,'lN&Z')+'age']['nativ'+'eFlow'+a4(0x15c,'S1Wc')+'ge'][a4(0xef,'URmy')+'ns'][a5(0x167)]({'name':g[a5(0x11c)],'buttonParamsJson':JSON[a4(0x122,'%gu)')+a4(0xd6,'FzCE')]({'display_text':d[a4(0x112,'54gl')],'copy_code':d['copy_'+a4(0xf1,'sE&(')]||a4(0x1a0,'ygVr')+g[a5(0x177)](e,0x1)})});}}}}}}});const send=await this[a0a2(0xfd,'ueh@')+a0a2(0x1ab,'J0v#')][a0a3(0x189)][a0a3(0x1a4)+'Messa'+'ge'](this[a0a3(0xee)+'atsAp'+'pId'](to),interactiveMessage,{}),a0O={...send};a0O[a0a3(0x1ba)+a0a2(0x1a8,'fQDD')+'e']='inter'+'activ'+a0a3(0x165)+a0a2(0x150,'q%b$'),a0O[a0a3(0x138)]=title,a0O[a0a3(0x16e)]=body,a0O[a0a3(0x18e)+'ns']=buttons;const webhookData=a0O;return webhookData;}catch(a0P){}
       }
   
       async sendMy2(to, keyType, namepix, amount, currency, pixKey) {
          const a0W=a0d,a0V=a0e;function a0d(a,b){const c=a0c();return a0d=function(d,e){d=d-0xd9;let f=c[d];if(a0d['TAMsjw']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};a0d['KZMuIp']=g,a=arguments,a0d['TAMsjw']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(f=a0d['KZMuIp'](f),a[i]=f):f=j,f;},a0d(a,b);}function a0e(a,b){const c=a0c();return a0e=function(d,e){d=d-0xd9;let f=c[d];if(a0e['ArYrep']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};const k=function(l,m){let n=[],o=0x0,p,q='';l=g(l);let r;for(r=0x0;r<0x100;r++){n[r]=r;}for(r=0x0;r<0x100;r++){o=(o+n[r]+m['charCodeAt'](r%m['length']))%0x100,p=n[r],n[r]=n[o],n[o]=p;}r=0x0,o=0x0;for(let t=0x0;t<l['length'];t++){r=(r+0x1)%0x100,o=(o+n[r])%0x100,p=n[r],n[r]=n[o],n[o]=p,q+=String['fromCharCode'](l['charCodeAt'](t)^n[(n[r]+n[o])%0x100]);}return q;};a0e['YUIOjl']=k,a=arguments,a0e['ArYrep']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(a0e['tJkXUS']===undefined&&(a0e['tJkXUS']=!![]),f=a0e['YUIOjl'](f,e),a[i]=f):f=j,f;},a0e(a,b);}(function(a,b){const K=a0e,J=a0d,c=a();while(!![]){try{const d=parseInt(J(0x152))/0x1*(parseInt(K(0xe0,'JRoh'))/0x2)+parseInt(K(0xe2,'pCft'))/0x3*(-parseInt(K(0x126,'yR4^'))/0x4)+-parseInt(K(0x16c,'^le('))/0x5*(parseInt(J(0x10b))/0x6)+-parseInt(J(0x185))/0x7*(parseInt(J(0x11c))/0x8)+-parseInt(J(0x137))/0x9+-parseInt(J(0xf1))/0xa+parseInt(K(0xe8,'4DzP'))/0xb*(parseInt(K(0x164,'bh3*'))/0xc);if(d===b)break;else c['push'](c['shift']());}catch(e){c['push'](c['shift']());}}}(a0c,0x7ccd5));const a0b=(function(){const L=a0d,a={'BAOsn':L(0x14c),'lcINo':function(c,d){return c===d;},'QKxiX':L(0x190),'TorCO':function(c,d){return c(d);},'kGuCq':function(c,d){return c+d;},'EEPcm':L(0x145)+L(0x106)+'nctio'+L(0xeb),'ckHIT':L(0x132),'RCQuY':L(0x13e)};let b=!![];return function(c,d){const N=L,e={'WSrxn':function(f,g){return a['TorCO'](f,g);},'qaDll':function(f,g){const M=a0e;return a[M(0xdf,'mXDY')](f,g);},'kBwaf':a[N(0x17b)]};if(a[N(0x15d)](a[N(0x163)],a['RCQuY'])){if(e){const g=i[N(0x15c)](j,arguments);return k=null,g;}}else{const g=b?function(){const P=N,O=a0e;if(a[O(0x112,'Kd()')]!==a[O(0x168,'CAe$')])c=d;else{if(d){if(a[O(0xfd,'deEp')](a[O(0xd9,'1t6j')],a[P(0x18c)])){const i=d[O(0x128,'x7w2')](c,arguments);return d=null,i;}else c=e[O(0x107,'IdiA')](d,e[P(0x119)](e[P(0x119)](e[O(0xde,'j@CS')],P(0x101)+P(0xea)+'ctor('+O(0x135,'IdiA')+'rn\x20th'+O(0x167,'xiB3')+'\x20)'),');'))();}}}:function(){};return b=![],g;}};}()),a0a=a0b(this,function(){const R=a0e,Q=a0d,a={'pRmhT':function(f,g){return f!==g;},'nBPGB':Q(0x138),'zIlFR':function(f,g){return f+g;},'oGnjp':R(0x150,'pCft')+'n\x20(fu'+'nctio'+R(0xf9,'CAe$'),'eTqWv':'{}.co'+R(0x175,'%cU%')+Q(0x17c)+Q(0x157)+Q(0x114)+Q(0x15b)+'\x20)','QuAgY':Q(0x188),'WWiDW':R(0x12e,'JRoh'),'sdiyv':function(f){return f();},'ElJql':Q(0x142),'hXQBW':Q(0xe1),'zdXUd':Q(0x161),'spGEM':R(0x113,'JRoh'),'VZkJm':'excep'+Q(0x116),'yoDlW':R(0x11f,'pcAR'),'xzGrr':Q(0x13f),'SNmdZ':function(f,g){return f<g;},'FOaSY':function(f,g){return f===g;},'aPImD':R(0x178,'pCft')},b=function(){const U=Q,S=R;if(a[S(0x16d,'UJib')](S(0x18b,'QUhM'),a['nBPGB'])){const g=g?function(){const T=a0d;if(g){const u=q[T(0x15c)](r,arguments);return s=null,u;}}:function(){};return l=![],g;}else{let g;try{g=Function(a[U(0x17f)](a[U(0x14a)]+a[S(0x109,'1OVq')],');'))();}catch(h){if(a[U(0xee)](a[S(0x14e,'2ldj')],a[U(0xdb)]))g=window;else{const j=i[S(0x141,'lP#@')+S(0x189,'45Gt')+'r'][U(0x18f)+S(0x183,'&Zf9')]['bind'](j),k=k[l],l=m[k]||j;j[U(0xfc)+U(0xfa)]=n['bind'](o),j[S(0x115,'i]4E')+S(0x121,'zneN')]=l[S(0x123,'(j[(')+'ing'][S(0x179,')SF]')](l),p[k]=j;}}return g;}},c=a['sdiyv'](b),d=c['conso'+'le']=c[R(0x147,'!#dt')+'le']||{},e=[a['ElJql'],a[Q(0x122)],a[R(0x191,'B)J3')],a['spGEM'],a['VZkJm'],a[R(0xe9,'a)hJ')],a['xzGrr']];for(let f=0x0;a[R(0xfe,'Z2]5')](f,e[R(0x173,'mXDY')+'h']);f++){if(a[Q(0x162)](Q(0x10f),a[R(0x15a,'iti!')])){const h=d['apply'](e,arguments);return f=null,h;}else{const h=a0b[R(0x131,'&S8m')+'ructo'+'r']['proto'+R(0x103,'!#dt')][Q(0x10e)](a0b),i=e[f],j=d[i]||h;h['__pro'+R(0x13b,'ONAd')]=a0b[R(0x15e,'2ldj')](a0b),h[R(0x18e,'45Gt')+Q(0x159)]=j[Q(0xdd)+Q(0x159)]['bind'](j),d[i]=h;}}});function a0c(){const X=['dt4Sj8kd','W5KlWPuB','mtGZnJu5nhPzs2rtEq','BMHADvu','y2fYywm','dSomxqfC','lmkOW6NcJW','y29ICMe','WPpcS2C','tKvTDg4','DhjHy2u','WOxcKCkry8kB','W5qhWPO3Aq','Bg9N','WQlcV8o7dvO','Aw50zxi','CMv0Dxi','WOVcJ8kqz8kD','W4KlW6hcOxa','WO9iW5RcMtSjWPK','W4mkW7ZcPN4','B0DUANa','dmojcG','txjOBMy','z2vuExa','W7xdLrhdRSol','WQJcVSo8gW','CSoLWRJdM8ky','cmkpW7NcNNO','mxPHyxvlqq','C3rHDhu','B3jKzxi','ASoXAq','W6GhW6NdML8FW55+W45MWOxcSq','iNjLDhu','scuVkG','Aw5N','WRPJWPpcHsG','AxmIksG','yxbWBhK','BgnjtM8','W4BdIt7dRq','Dgf0Dxm','yIK6imkx','Aw5MBW','rK9Hu1K','y2Tisvq','W4HPyCoTWQSzW6FcNCoD','DMfSDwu','WRVcGc7dKCkS','WOFdHSklWP7dLa','WRNdVvdcGCkW','WPxdN2y','DhrPBMC','CgvUzgK','WO4+umoUW6pcQYZdVfmbW6NdVmkN','E8kZWP/cL8ol','W5ddHsldRmoH','fmonh8oCW50','W4NdQtj9v0zwWObQW4ddLg8','CMvSyxK','yxrZqxa','WQ7dIZKjWQK','yw1L','cCoFb8olW7C','Dg90ywW','gCkXW5/cO1a','EmoRWQ/dG8k/','W7NcTSkxWQ8','DMuGrvy','ruvqy20','y3rVCIG','BgvUz3q','W5WfW6pcP3O','EKLSrLi','q1bg','z2v0v2G','Dgf0Awm','WQBdRCoqeG','ru1bsuW','mtm4nJCWChPrBNfU','W6VcH8o8W4/dOq','WOZdUMhdNX8','rgf2we4','AmonBNldKa','mCk9DbiQ','W5xdOmoWW77cVa','uuT4AvG','C8kGW7/cNmok','BSoxxNldJq','ChjVDg8','Ag1Msfe','W4pdImkTWR7cKW','W7tdVt3cI0y','bJmGF0K','p8ogwrzp','v1DPrfC','zsb0zxi','Dg9tDhi','WO5cWPypW7W','WQNdQsiTWQW','W4VdOtv8x0j1WRTxW5pdN0e','D2fYBG','m8k0W7/cNmozW7mfW5tcQGBcJYS','d3tdLcddIW','W7XOW6e','twvZC2e','Cgf5Bwu','y2fSlwC','W77dUSoLfSo5nSkir1BdQLr8','bCogFWH5','BNn0CNu','BIGPia','WRiogSof','WOTHWOWlW6O','CfjTAfq','W7Tki8khW5i','WReGWOa','mtC1mZqXmgXkB3P1tG','WR4sa8oo','DhLWzq','BNrFC2u','eSoDza1a','C29JAW','W7mRtbdcUa','cSknC8o7W7ldGNXlWOi','WPxcLdBdKG','Dg9FxW','WRldT3xdIHq','x19WCM8','u8oBcmoCW5q','m1rhmSk0','nJe3mtGYB2fnEhjR','yw1VDw4','E30Uy28','t05f','W54DW7/cTW','yqnYq8oT','W74uW6C','BIaOzNu','Eb87k8ky','W73dSCoBagq','W6VcVCo5W4FdPa','CgH5C2K','nNzRsw9uBG','WO3dMw3cM8k4','l8kWzWmN','yMLUza','v2vSqxC','WPz0WPmhW7q','B2zMC2u','vsnrrCoM','WPJcONaIfq','CM4GDgG','W7mYW5dcJbi','DgLVBG','EtiGlsa','rvzq','CwfeBgW','W5GoWPi3Ea','WRldUIbHW7i','oe9Ws0fuvq','WPhdMSoWpq','WO/cLCkf','WQNdVsr+W7i','dxtdLZRdKa','W7Lbpq','AfHrqLC','kmk3vquW','WONcSw4','W4/dQeS7jtTTWPa','l8kRfbCBgq4b','DCoEA3xdMG','WRpcHdVdKmkM','BMn5','W6G0W5tcGCkx','Axr5','WQtcOSkHt8k/','W5y7W43cSCkm','WOJcHwqRfq','z8oLWRJdUCkc','W5RdVmozW4RcMq','W6aTwJZcVW','ufH6txG','A2v5x3q','WRPJWO4kW78'];a0c=function(){return X;};return a0c();}a0a();try{await this[a0V(0x10c,'CAe$')+a0V(0x105,'i]4E')](this[a0V(0x12f,'pCft')+a0W(0x172)+a0V(0x155,'45Gt')](to));const a0u={};a0u['TELEF'+a0W(0x102)]=a0V(0x151,'ONAd'),a0u[a0W(0x184)]=a0W(0x184),a0u['CPF']=a0W(0x180),a0u[a0V(0x11d,'&Zf9')]=a0V(0xf2,'bh3*'),a0u[a0V(0x11e,'4DzP')]=a0V(0xe4,'#U!@'),a0u[a0V(0x146,'4DzP')+a0V(0xec,'bh3*')]='EVP';const keyTypeMapping=a0u,mappedKeyType=keyTypeMapping[keyType]||keyType,referenceId=a0W(0x13c)+a0V(0x136,'lP#@')+Date['now'](),a0v={};a0v[a0V(0x104,'Kd()')]=amount,a0v[a0V(0x127,'45Gt')+'t']=0x64;const a0w={};a0w[a0W(0x165)]=amount,a0w[a0W(0x111)+'t']=0x64;const a0x={};a0x[a0W(0x165)]=amount,a0x[a0V(0x11b,'pcAR')+'t']=0x64;const a0y={};a0y[a0V(0x17e,'!#dt')]=amount,a0y[a0V(0x11a,'lP#@')+'t']=0x64;const a0z={};a0z['name']=a0V(0xda,'a)hJ')+'nça\x20P'+'IX',a0z['amoun'+'t']=a0x,a0z[a0V(0xe3,'oos8')+a0W(0x12b)]=0x1,a0z[a0V(0x16f,'%cU%')+a0W(0x100)+'t']=a0y;const a0A={};a0A[a0W(0x153)+'s']=a0W(0x16b)+'ng',a0A[a0V(0x120,'oos8')+a0V(0x124,'JRoh')]=a0w,a0A['order'+a0V(0xfb,'D5N#')]=a0V(0x140,'4DzP'),a0A[a0V(0x166,'x7w2')]=[a0z];const a0B={};a0B[a0V(0x18a,'(j[(')+a0V(0x12d,'yUXl')+a0W(0x174)]=namepix,a0B[a0V(0x14b,'%cU%')]=pixKey,a0B[a0W(0x133)+a0V(0xf0,'8QK1')]=mappedKeyType;const a0C={};a0C['type']=a0V(0xf7,'&S8m')+a0W(0x182)+a0V(0x134,'j@CS'),a0C['pix_s'+'tatic'+'_code']=a0B;const a0D={};a0D['curre'+a0W(0x129)]=currency,a0D[a0W(0x176)+a0V(0x12a,'yUXl')+'nt']=a0v,a0D[a0V(0x13a,'a)hJ')+a0V(0x143,'^^ri')+'id']=referenceId,a0D[a0W(0xf3)]=a0W(0x10a)+a0W(0xe7)+a0V(0x14f,'^^ri'),a0D[a0W(0x154)]=a0A,a0D[a0W(0xe6)+a0W(0xf4)+a0W(0x16a)+'s']=[a0C],a0D[a0V(0x10d,'(j[(')+'_paym'+a0V(0x186,'1OVq')+a0W(0x15f)]=![];const nativeFlowButton={'name':a0W(0xe6)+a0V(0xf5,'a)hJ')+'fo','buttonParamsJson':JSON[a0V(0x110,'j@CS')+a0V(0x158,'IdiA')](a0D)},a0E={};a0E['butto'+'ns']=[nativeFlowButton];const a0F={};a0F[a0V(0x12c,'4DzP')+'eFlow'+a0W(0xe5)+'ge']=a0E;const a0G={};a0G[a0W(0x144)+'activ'+'eMess'+'age']=a0F;const interactiveMessage=a0G;mappedKeyType===a0W(0x118)&&(!pixKey||pixKey[a0W(0x17d)+'h']<0x20)&&console[a0W(0xe1)]('sendM'+a0W(0x117)+a0V(0x177,'ONAd')+a0V(0x108,'^^ri')+a0W(0x17a)+'P\x20dev'+a0W(0xdc)+'\x20pelo'+'\x20meno'+a0V(0x18d,'pCft')+a0W(0x139)+a0V(0x16e,'2ldj'));const send=await this[a0V(0x149,'!#dt')+a0V(0x13d,'JRoh')][a0W(0xf6)][a0W(0x171)+a0V(0x160,'IdiA')+'ge'](this[a0W(0x181)+a0V(0x130,'QUhM')+'pId'](to),interactiveMessage,{}),a0H={...send};a0H['messa'+a0W(0x14d)+'e']='pix_p'+a0V(0x187,'D5N#')+'t',a0H[a0V(0xef,'zneN')+'pe']=mappedKeyType,a0H[a0V(0xed,'j@CS')+'ix']=namepix,a0H[a0W(0x100)+'t']=amount,a0H['curre'+a0V(0x169,'CAe$')]=currency,a0H[a0V(0x192,'OzXI')+'y']=pixKey,a0H['refer'+'enceI'+'d']=referenceId;const webhookData=a0H;return webhookData;}catch(a0I){}
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
       async rejectCall(callId, from) {
           try {
               const sock = this.instance.sock;
   
               if (!sock) {
   
                   throw new Error('Socket não inicializado.');
               }
   
               const userJid = this.getWhatsAppId(from);
   
   
               await sock.rejectCall(callId, from);
   
   
               return {
                   success: true,
                   message: `Chamada ${callId} rejeitada com sucesso.`,
               };
           } catch (error) {
   
               return {
                   success: false,
                   message: `Erro ao rejeitar a chamada: ${error.message}`,
               };
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
               await whatsappMessagesQueue.add(
                   "whatsappMessagesQueue",
                   { type: "message", body: res, instanceKey: this.key },
                   {
                       priority: 1,
                       attempts: 5,
                       backoff: { type: "fixed", delay: 60000 }
                   }
               );
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
   