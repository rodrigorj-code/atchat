
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

/* eslint-disable no-unsafe-optional-chaining */
const { WhatsAppInstance } = require('../class/instance');
const logger = require('pino')();
const config = require('../../config/config');
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const fs = require('fs').promises;

class Session {
    async restoreSessions() {
        const restoredSessions = [];
        let allSessions = [];

        try {
            const filePath = 'sessions.json';


            const fileExists = await fs.access(filePath).then(() => true).catch(() => false);

            if (fileExists) {
                const data = await fs.readFile(filePath, 'utf-8');
                allSessions = JSON.parse(data);
            } else {
                await fs.writeFile(filePath, '[]', 'utf-8');
            }


            for (const sessionData of allSessions) {
                const { key, webhook, webhookUrl } = sessionData;

                try {
                    const instance = new WhatsAppInstance(key, webhook, webhookUrl);
                    await instance.init(); 
                    WhatsAppInstances[key] = instance;
                    restoredSessions.push(key);
                    logger.info(`Sessão ${key} restaurada com sucesso.`);
                } catch (err) {
                    logger.error(`Erro ao restaurar a sessão ${sessionData.key}:`, err.message);
                }

                await sleep(250);
            }
        } catch (e) {
            logger.error('Erro ao restaurar sessões');
            logger.error(e);
        }

        return restoredSessions;
    }
}

exports.Session = Session;


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
