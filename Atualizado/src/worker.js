const Queue = require("bull");

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


sendMessageProcessingQueue.process("sendMessageProcessingJob", CONCURRENT_JOBS, async (job) => {
  console.log(`🔥 Processando job ID ${job.id} do tipo processMessage...`);
  try {
    const { key, payload } = job.data;
    const instance = WhatsAppInstances[key];
    if (!instance) {
      throw new Error(`Instância de WhatsApp com chave ${key} não encontrada.`);
    }
    await instance.sendTextMessage(payload);
    console.log("✅ Mensagem enviada com sucesso:");

  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    throw error;
  }


});

sendMediaProcessingQueue.process("sendMediaProcessingJob", CONCURRENT_JOBS, async (job) => {
  console.log(`🔥 Processando job ID ${job.id} do tipo processMessage...`);
  try {
    const { key, payload } = job.data;
    const instance = WhatsAppInstances[key];
    if (!instance) {
      throw new Error(`Instância de WhatsApp com chave ${key} não encontrada.`);
    }
    await instance.sendMediaFile(payload, "url");


  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);
    throw error;
  }

});

orderedMessageProcessingQueue.process("orderedMessageProcessingJob", CONCURRENT_JOBS, async (job) => {
  const { key, payload, type = "text" } = job.data;

  if (type === "media") {

    try {
      const { key, payload } = job.data;
      const instance = WhatsAppInstances[key];
      if (!instance) {
        throw new Error(`Instância de WhatsApp com chave ${key} não encontrada.`);
      }
      await instance.sendMediaFile(payload, "url");


    } catch (error) {
      console.error("❌ Erro ao processar mensagem:", error);
      throw error;
    }

  } else {

    try {

      const instance = WhatsAppInstances[key];
      if (!instance) {
        throw new Error(`Instância de WhatsApp com chave ${key} não encontrada.`);
      }
      await instance.sendTextMessage(payload);
      console.log("✅ Mensagem enviada com sucesso:");

    } catch (error) {
      console.error("❌ Erro ao processar mensagem:", error);
      throw error;
    }

  }
});

