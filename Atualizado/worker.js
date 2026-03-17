const Queue = require("bull");
const { WhatsAppInstance } = require('./api/class/instance');
const fs = require('fs').promises;
const path = require('path');

const redisUri = process.env.REDIS_URI;
const queueOptions = {
  redis: redisUri
};
const APP_URL = process.env.APP_URL
const sanitizedBaseUrl = APP_URL.replace(/[^a-zA-Z0-9_-]/g, "_");
const queueName = `sendMessageProcessingQueue_${sanitizedBaseUrl}`;
const queueMediaName = `sendMediaProcessingQueue_${sanitizedBaseUrl}`;
const orderedQueueName = `orderedMessageProcessingQueue_${sanitizedBaseUrl}`;
const sendMessageProcessingQueue = new Queue(queueName, queueOptions);
const sendMediaProcessingQueue = new Queue(queueMediaName, queueOptions);
const orderedMessageProcessingQueue = new Queue(orderedQueueName, queueOptions);

const CONCURRENT_JOBS = 500;
 
async function createInstanceIfNotExists(key) {
  try {
 
    const keyString = String(key);
     
    if (WhatsAppInstances[keyString]) {
      return WhatsAppInstances[keyString];
    }
 
    const sessionsPath = path.join(process.cwd(), 'sessions.json');
    let sessions = [];
    
    try {
      const sessionsData = await fs.readFile(sessionsPath, 'utf-8');
      sessions = JSON.parse(sessionsData);
    } catch (error) {
 
      await fs.writeFile(sessionsPath, '[]', 'utf-8');
    }
 
    const existingSession = sessions.find(session => String(session.key) === keyString);
    
    if (!existingSession) {
 
      const templateSession = sessions.find(session => String(session.key) !== keyString);
 
      const newSession = {
        key: keyString, 
        ignoreGroups: templateSession ? templateSession.ignoreGroups : false,
        webhook: templateSession ? templateSession.webhook : false,
        base64: templateSession ? templateSession.base64 : false,
        webhookUrl: templateSession ? templateSession.webhookUrl : "",
        browser: templateSession ? templateSession.browser : "Api",
        webhookEvents: templateSession ? [...templateSession.webhookEvents] : [],
        messagesRead: templateSession ? templateSession.messagesRead : false,
        importOldMessages: templateSession ? templateSession.importOldMessages : null,
        importOldMessagesGroups: templateSession ? templateSession.importOldMessagesGroups : false,
        dateRecentLimit: templateSession ? templateSession.dateRecentLimit : null
      };
 
      sessions.push(newSession);
      await fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2), 'utf-8');
     
    }
 
    const sessionConfig = sessions.find(session => String(session.key) === keyString);
     
    const instance = new WhatsAppInstance(keyString, sessionConfig.webhook, sessionConfig.webhookUrl);
    await instance.init();
    WhatsAppInstances[keyString] = instance;
 
    return instance;

  } catch (error) {
 
    throw error;
  }
}

sendMessageProcessingQueue.process("sendMessageProcessingJob", CONCURRENT_JOBS, async (job) => {
 
  try {
    const { key, payload } = job.data;
    const keyString = String(key);  
   
    let instance = WhatsAppInstances[keyString];
    if (!instance) {
      instance = await createInstanceIfNotExists(keyString);
    }
    
    // Verifica se a instância está conectada
    const instanceDetail = await instance.getInstanceDetail(keyString);
    if (!instanceDetail.phone_connected) {
    
      throw new Error(`Instância ${keyString} não está conectada ao WhatsApp. É necessário escanear o QR Code primeiro.`);
    }
    
    await instance.sendTextMessage(payload);
  
  } catch (error) {
  
    if (error.message.includes('Connection Closed') || error.message.includes('não está conectada')) {
 
      try {
        const { key } = job.data;
        const keyString = String(key);
        const instance = WhatsAppInstances[keyString];
        if (instance) {
          await instance.init();
 
        }
      } catch (reconnectError) {
 
      }
    }
    
    throw error;
  }
});

sendMediaProcessingQueue.process("sendMediaProcessingJob", CONCURRENT_JOBS, async (job) => {
 
  try {
    const { key, payload } = job.data;
    const keyString = String(key);  
    
    let instance = WhatsAppInstances[keyString];
    if (!instance) {
      instance = await createInstanceIfNotExists(keyString);
    }
     
    const instanceDetail = await instance.getInstanceDetail(keyString);
    if (!instanceDetail.phone_connected) {
 
      throw new Error(`Instância ${keyString} não está conectada ao WhatsApp. É necessário escanear o QR Code primeiro.`);
    }
    
    await instance.sendMediaFile(payload, "url");

  } catch (error) {
 
    if (error.message.includes('Connection Closed') || error.message.includes('não está conectada')) {
 
      try {
        const { key } = job.data;
        const keyString = String(key);
        const instance = WhatsAppInstances[keyString];
        if (instance) {
          await instance.init();
  
        }
      } catch (reconnectError) {
     
      }
    }
    
    throw error;
  }
});

orderedMessageProcessingQueue.process("orderedMessageProcessingJob", CONCURRENT_JOBS, async (job) => {
  const { key, payload, type = "text" } = job.data;
  const keyString = String(key);  

  if (type === "media") {
    try {
    
      let instance = WhatsAppInstances[keyString];
      if (!instance) {
        instance = await createInstanceIfNotExists(keyString);
      }
 
      const instanceDetail = await instance.getInstanceDetail(keyString);
      if (!instanceDetail.phone_connected) {
  
        throw new Error(`Instância ${keyString} não está conectada ao WhatsApp. É necessário escanear o QR Code primeiro.`);
      }
      
      await instance.sendMediaFile(payload, "url");

    } catch (error) {
    
      if (error.message.includes('Connection Closed') || error.message.includes('não está conectada')) {
  
        try {
          const instance = WhatsAppInstances[keyString];
          if (instance) {
            await instance.init();
        
          }
        } catch (reconnectError) {
   
        }
      }
      
      throw error;
    }

  } else {
    try {
 
      let instance = WhatsAppInstances[keyString];
      if (!instance) {
        instance = await createInstanceIfNotExists(keyString);
      }
 
      const instanceDetail = await instance.getInstanceDetail(keyString);
      if (!instanceDetail.phone_connected) {
 
        throw new Error(`Instância ${keyString} não está conectada ao WhatsApp. É necessário escanear o QR Code primeiro.`);
      }
      
      await instance.sendTextMessage(payload);
  
    } catch (error) {
     
      if (error.message.includes('Connection Closed') || error.message.includes('não está conectada')) {
 
        try {
          const instance = WhatsAppInstances[keyString];
          if (instance) {
            await instance.init();
            
          }
        } catch (reconnectError) {
       
        }
      }
      
      throw error;
    }
  }
});

