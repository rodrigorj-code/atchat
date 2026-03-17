
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */


const PORT = process.env.PORT || '9898';
const TOKEN = 'ss94soj4rc4aK1g8-n7irHnfDipMrgssO2exV12Oo-U';

const PROTECT_ROUTES = true;

const RESTORE_SESSIONS_ON_START_UP = true;

const videoMimeTypes =
    process.env.videoMimeTypes?.split(',') || [

        'video/mp4',
        'video/avi',
        'video/mkv',
        'video/mov',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',


        'video/webm',
        'video/ogg',


        'video/3gpp',
        'video/3gpp2',

        'video/x-flv',
        'video/h264',
        'video/x-h264',
        'video/hevc',

        'video/mp2t',
        'application/x-mpegURL',
        'video/x-ms-wmv',
        'video/mpeg',

        'video/x-dv',
        'video/x-sgi-movie',
    ];

const audioMimeTypes =
    process.env.audioMimeTypes?.split(',') || [

        'audio/mp3',
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/flac',
        'audio/x-m4a',
        'audio/m4a',
        'audio/x-wav',


        'audio/webm',
        'audio/x-ms-wma',
        'audio/3gpp',
        'audio/3gpp2',


        'audio/amr',
        'audio/aiff',
        'audio/x-aiff',
    ];

const documentMimeTypes =
    process.env.documentMimeTypes?.split(',') || [

        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/csv',
        'text/tab-separated-values',

        'application/x-rar-compressed',
        'application/zip',
        'application/x-7z-compressed',
        'application/gzip',

        'application/sql',
        'application/javascript',
        'application/json',
        'application/xml',
        'text/html',


        'text/markdown',
        'application/x-latex',


        'application/font-woff',
        'application/font-woff2',
        'application/vnd.ms-fontobject',
        'application/x-font-ttf',

        'image/svg+xml',
        'application/vnd.adobe.photoshop',


        'application/x-tar',
        'application/x-bzip',
        'application/x-bzip2',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',

        'application/vnd.oasis.opendocument.presentation',
        'application/x-msdownload',
        'text/css',
        'application/x-pkcs12',
        'image/vnd.dxf',
        'application/octet-stream',
    ];
const imageMimeTypes =
    process.env.imageMimeTypes?.split(',') || [

        'image/png',
        'image/gif',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
        'image/tiff',


        'image/vnd.microsoft.icon',
        'image/x-icon',
        'image/heic',
        'image/heif',



        'image/x-citrix-png',
        'image/x-citrix-jpeg',
        'image/x-png',
        'image/x-jpeg',
        'image/jpeg',
    ];

const IGNORE_GROUPS = process.env.IGNORE_GROUPS;
const APP_URL = process.env.APP_URL || false;

const LOG_LEVEL = "silent";

const INSTANCE_MAX_RETRY_QR = process.env.INSTANCE_MAX_RETRY_QR || 2;

const CLIENT_PLATFORM = process.env.CLIENT_PLATFORM || 'Whatsapp MD';
const CLIENT_BROWSER = process.env.CLIENT_BROWSER || 'Chrome';
const CLIENT_VERSION = process.env.CLIENT_VERSION || '4.1.1';

const MONGODB_ENABLED = !!(
    process.env.MONGODB_ENABLED && process.env.MONGODB_ENABLED === 'true'
);

const MONGODB_URL =
    process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/WhatsAppInstance';

const WEBHOOK_ENABLED = !!(
    process.env.WEBHOOK_ENABLED && process.env.WEBHOOK_ENABLED === 'true'
);

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const WEBHOOK_BASE64 = !!(
    process.env.WEBHOOK_BASE64 && process.env.WEBHOOK_BASE64 === 'true'
);

const WEBHOOK_ALLOWED_EVENTS = process.env.WEBHOOK_ALLOWED_EVENTS?.split(',') || ['all'];

const MARK_MESSAGES_READ = !!(
    process.env.MARK_MESSAGES_READ && process.env.MARK_MESSAGES_READ === 'true'
);

module.exports = {
    port: PORT,
    token: TOKEN,
    restoreSessionsOnStartup: RESTORE_SESSIONS_ON_START_UP,
    appUrl: APP_URL,
    log: {
        level: LOG_LEVEL,
    },
    instance: {
        maxRetryQr: INSTANCE_MAX_RETRY_QR,
    },
    mongoose: {
        enabled: MONGODB_ENABLED,
        url: MONGODB_URL,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    browser: {
        platform: CLIENT_PLATFORM,
        browser: CLIENT_BROWSER,
        version: CLIENT_VERSION,
    },
    webhookEnabled: WEBHOOK_ENABLED,
    webhookUrl: WEBHOOK_URL,
    webhookBase64: WEBHOOK_BASE64,
    protectRoutes: PROTECT_ROUTES,
    markMessagesRead: MARK_MESSAGES_READ,
    webhookAllowedEvents: WEBHOOK_ALLOWED_EVENTS,
    IGNORE_GROUPS: IGNORE_GROUPS,
    videoMimeTypes: videoMimeTypes,
    audioMimeTypes: audioMimeTypes,
    documentMimeTypes: documentMimeTypes,
    imageMimeTypes: imageMimeTypes,
};


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
