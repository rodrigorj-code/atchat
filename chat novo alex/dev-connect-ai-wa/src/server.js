
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

const dotenv = require('dotenv')
const logger = require('pino')()
dotenv.config()
const fs = require('fs');
const cron = require("node-cron");

const path = require('path');
const express = require('express');
const app = require('./config/express')
const config = require('./config/config')
const cliTable = require('cli-table3');
const chalk = require('chalk');
const figlet = require('figlet');
const { Session } = require('./api/class/session')
const version = "2.0.4"
require("./worker");

const messagesFilePath = path.join(__dirname, '..', "db", "messages.json");
app.use('/media', express.static(path.join(__dirname, '..', 'media'), {
    setHeaders: (res, filePath) => {
        console.log(`Serving file: ${filePath}`);
    }
}));
app.get("/api/version", (req, res) => {
    res.status(200).json({
        success: true,
        version: version,
        message: "API DevConnectAi está funcionando corretamente."
    });
});
let server

server = app.listen(config.port, async () => {
    logger.info(`Listening on port ${config.port}`)

    if (config.restoreSessionsOnStartup) {
        logger.info(`Restaurando sessions`)
        const session = new Session()
        let restoreSessions = await session.restoreSessions()
        logger.info(`Sessions restauradas`)
    }
})

const formatBytes = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

const formatCpuTime = (cpuTime) => (cpuTime / 1000).toFixed(2) + ' ms';

const showBanner = () => {
    console.clear();
    console.log(
        chalk.blue(
            figlet.textSync('DevConnectAI', {
                font: 'Standard',
                horizontalLayout: 'default',
                verticalLayout: 'default',
            })
        )
    );
    console.log(chalk.green('🚀 Server is running...'));
    console.log(chalk.yellow(`📡 Listening on port: ${config.port}`));
    console.log(chalk.cyan(`💻 Visit: http://localhost:${config.port}`));
};

const displayMetrics = () => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const table = new cliTable({
        head: [chalk.bold('Metric'), chalk.bold('Value')],
        colWidths: [20, 50],
    });

    table.push(
        [chalk.blue('Memory RSS'), chalk.cyan(formatBytes(memoryUsage.rss))],
        [chalk.blue('Heap Total'), chalk.cyan(formatBytes(memoryUsage.heapTotal))],
        [chalk.blue('Heap Used'), chalk.cyan(formatBytes(memoryUsage.heapUsed))],
        [chalk.magenta('CPU User'), chalk.cyan(formatCpuTime(cpuUsage.user))],
        [chalk.magenta('CPU System'), chalk.cyan(formatCpuTime(cpuUsage.system))]
    );

    console.log(table.toString());
};


//setInterval(() => {
///    showBanner();
//   displayMetrics();
//}, 5000);
const deleteOldFiles = (dir, ageInMilliseconds) => {
    const now = Date.now();

    const deleteRecursively = (currentPath) => {
        fs.readdir(currentPath, (err, files) => {
            if (err) {
                console.error(`Erro ao ler o diretório ${currentPath}:`, err);
                return;
            }

            files.forEach((file) => {
                const filePath = path.join(currentPath, file);

                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        console.error(`Erro ao obter informações do arquivo ${filePath}:`, err);
                        return;
                    }

                    if (stats.isDirectory()) {

                        deleteRecursively(filePath);
                    } else {

                        if (now - stats.mtimeMs > ageInMilliseconds) {
                            fs.unlink(filePath, (err) => {
                                if (err) {
                                    console.error(`Erro ao deletar o arquivo ${filePath}:`, err);
                                } else {
                                    console.log(`Arquivo deletado: ${filePath}`);
                                }
                            });
                        }
                    }
                });
            });
        });
    };

    deleteRecursively(dir);
};


cron.schedule('0 0 * * *', () => {
    const mediaDir = path.join(__dirname, '..', 'media');
    console.log("Executando limpeza de arquivos antigos à meia-noite...");
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    deleteOldFiles(mediaDir, oneDayInMilliseconds);
});

const deleteMessagesFile = () => {
    fs.unlink(messagesFilePath, (err) => {
        if (err) {
            if (err.code === "ENOENT") {
                console.log(`Arquivo ${messagesFilePath} já foi deletado ou não existe.`);
            } else {
                console.error(`Erro ao deletar o arquivo ${messagesFilePath}:`, err);
            }
        } else {
            console.log(`Arquivo ${messagesFilePath} deletado com sucesso.`);
        }
    });
};

cron.schedule("0 0 * * *", () => {
    console.log("Executando a exclusão do arquivo messages.json...");
    deleteMessagesFile();
});
const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed')
            process.exit(1)
        })
    } else {
        process.exit(1)
    }
}

const unexpectedErrorHandler = (error) => {
    logger.error(error)
    exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', () => {
    logger.info('SIGTERM received')
    if (server) {
        server.close()
    }
})

module.exports = server


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
