
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

const fs = require('fs').promises;
const path = require('path');
exports.Text = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendTextMessage(
        req.body
    )
    return res.status(201).json({ error: false, data: data })
}



exports.Image = async (req, res) => {
    try {
        const { key } = req.query;
        const { id, caption } = req.body;
        const file = req.file;
        const mimetype = file?.mimetype;


        if (!key || !WhatsAppInstances[key]) {
            return res.status(403).json({
                error: true,
                message: 'Chave inválida ou não fornecida.'
            });
        }

        const instance = WhatsAppInstances[key];


        if (!instance.instance?.online) {
            return res.status(401).json({
                error: true,
                message: 'A instância não está online. Conecte o dispositivo.'
            });
        }


        if (!id) {
            return res.status(400).json({
                error: true,
                message: 'O campo "id" é obrigatório.'
            });
        }


        if (!file) {
            return res.status(400).json({
                error: true,
                message: 'O arquivo de imagem é obrigatório.'
            });
        }

        if (!mimetype.startsWith('image/')) {
            return res.status(400).json({
                error: true,
                message: 'O arquivo fornecido não é uma imagem válida.'
            });
        }


        const data = await instance.sendMediaFile(id, file, 'image', mimetype, caption);


        return res.status(201).json({
            error: false,
            data
        });
    } catch (error) {
        console.error('Erro ao enviar imagem:', error);


        return res.status(500).json({
            error: true,
            message: 'Ocorreu um erro ao enviar a imagem.'
        });
    }
};

exports.sendurlfile = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaFile(
        req.body,
        'url'
    )
    return res.status(201).json({ error: false, data: data })
}

exports.sendbase64file = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaFile(
        req.body,
        'base64'
    )
    return res.status(201).json({ error: false, data: data })
}
exports.imageFile = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMedia(
        req.body.id,
        req.body.userType,
        req.file,
        'image',
        req.body?.caption,
        req.body?.replyFrom,
        req.body?.caption,
        req.body?.replyFrom,
        req.body?.delay
    )
    return res.status(201).json({ error: false, data: data })
}
exports.audioFile = async (req, res) => {

    const data = await WhatsAppInstances[req.query.key].sendMedia(
        req.body.id,
        req.body.userType,
        req.file,
        'audio',
        req.body?.caption,
        req.body?.replyFrom,
        req.body?.delay
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Video = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMedia(
        req.body.id,
        req.body.userType,
        req.file,
        'video',
        req.body?.caption,
        req.body?.replyFrom,
        req.body?.delay
    )
    return res.status(201).json({ error: false, data: data })
}


exports.Audio = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaFile(
        req.body.id,
        req.file,
        req.mimetype,
        'audio'
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Document = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMedia(
        req.body.id,
        req.body.userType,
        req.file,
        'document',
        req.body?.caption,
        req.body?.replyFrom,
        req.body?.delay
    )
    return res.status(201).json({ error: false, data: data })
}
exports.Mediaurl = async (req, res) => {

    const data = await WhatsAppInstances[req.query.key].sendUrlMediaFile(
        req.body.id,
        req.body.url,
        req.body.type,
        req.body.mimetype,
        req.body.caption
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Button = async (req, res) => {

    const data = await WhatsAppInstances[req.query.key].sendButtonMessage(
        req.body.id,
        req.body.btndata
    )
    return res.status(201).json({ error: false, data: data })
}

exports.Contact = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendContactMessage(
        req.body.id,
        req.body.vcard
    )
    return res.status(201).json({ error: false, data: data })
}



exports.List = async (req, res) => {
    try {
        const { key } = req.query;
        const { id, type, options, groupOptions, msgdata } = req.body;


        if (!key || !WhatsAppInstances[key]) {
            return res.status(403).json({
                error: true,
                message: 'Chave inválida ou não fornecida.'
            });
        }

        const instance = WhatsAppInstances[key];


        if (!instance.instance?.online) {
            return res.status(401).json({
                error: true,
                message: 'A instância não está online. Conecte o dispositivo.'
            });
        }


        if (!id) {
            return res.status(400).json({
                error: true,
                message: 'O campo "id" é obrigatório.'
            });
        }

        if (!type || !['user', 'group'].includes(type)) {
            return res.status(400).json({
                error: true,
                message: 'O campo "type" é obrigatório e deve ser "user" ou "group".'
            });
        }

        if (!msgdata || typeof msgdata !== 'object') {
            return res.status(400).json({
                error: true,
                message: 'O campo "msgdata" é obrigatório e deve ser um objeto válido.'
            });
        }

        if (!msgdata.sections || !Array.isArray(msgdata.sections)) {
            return res.status(400).json({
                error: true,
                message: 'O campo "msgdata.sections" é obrigatório e deve ser uma lista de seções.'
            });
        }



        const data = await instance.sendListMessage(id, type, options, groupOptions, msgdata);


        return res.status(201).json({
            error: false,
            data
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem de lista:', error);


        return res.status(500).json({
            error: true,
            message: 'Ocorreu um erro ao enviar a mensagem de lista.'
        });
    }
};


exports.DeleteMessage = async (req, res) => {
    try {
        const data = await WhatsAppInstances[req.query.key].deleteMessage(req.body.id, req.body.key);
        return res.status(200).json({ error: false, data: data });
    } catch (error) {
        return res.status(500).json({ error: true, message: error.message });
    }
}

exports.MediaButton = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].sendMediaButtonMessage(
        req.body.id,
        req.body.btndata
    )
    return res.status(201).json({ error: false, data: data })
}

exports.SetStatus = async (req, res) => {
    const presenceList = [
        'unavailable',
        'available',
        'composing',
        'recording',
        'paused',
    ]
    if (presenceList.indexOf(req.body.status) === -1) {
        return res.status(400).json({
            error: true,
            message:
                'status parameter must be one of ' + presenceList.join(', '),
        })
    }

    const data = await WhatsAppInstances[req.query.key]?.setStatus(
        req.body.status,
        req.body.id,
        req.body.type,
        req.body.delay

    )
    return res.status(201).json({ error: false, data: data })
}

exports.Read = async (req, res) => {
    try {
        const { key } = req.query;
        const msgObjs = req.body;

        if (!msgObjs || !Array.isArray(msgObjs)) {
            return res.status(400).json({
                error: true,
                message: "O corpo da requisição deve ser um array de mensagens."
            });
        }

        const instance = WhatsAppInstances[key];
        if (!instance) {
            return res.status(404).json({
                error: true,
                message: "Instância do WhatsApp não encontrada."
            });
        }

        const data = await instance.readMessage(msgObjs);

        return res.status(201).json({ error: false, data });
    } catch (error) {
        console.error("Erro ao processar leitura de mensagens:", error.message);
        return res.status(500).json({
            error: true,
            message: "Erro interno ao marcar mensagens como lidas."
        });
    }
};

exports.React = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].reactMessage(req.body.id, req.body.key, req.body.emoji)
    return res.status(201).json({ error: false, data: data })
}



exports.deleteMessage = async (req, res) => {
    try {

        const { id, remoteJid, participant, fromMe } = req.body;
        if (!id || !remoteJid) {
            return res.status(400).json({
                error: true,
                message: "Os campos 'id' e 'remoteJid' são obrigatórios",
            });
        }


        const data = await WhatsAppInstances[req.query.key].deleteMessage({
            id,
            remoteJid,
            participant,
            fromMe,
        });


        return res.status(200).json({ error: false, data });
    } catch (error) {
        console.error("Erro ao deletar mensagem:", error.message);
        return res.status(500).json({
            error: true,
            message: "Erro ao deletar mensagem",
            details: error.message,
        });
    }
};

exports.editMessage = async (req, res) => {
    try {

        const { body, text = body, edit, remoteJid } = req.body;

        if (!text || !edit || !remoteJid) {
            return res.status(400).json({
                error: true,
                message: "Os campos 'text', 'edit' e 'remoteJid' são obrigatórios",
            });
        }

        const instance = WhatsAppInstances[req.query.key];
        if (!instance) {
            return res.status(404).json({
                error: true,
                message: "Instância do WhatsApp não encontrada",
            });
        }

        const data = await instance.editMessage({
            body,
            edit,
            remoteJid,
        });

        return res.status(200).json({ error: false, data });
    } catch (error) {
        console.error("Erro ao editar mensagem:", error.message);
        return res.status(500).json({
            error: true,
            message: "Erro ao editar mensagem",
            details: error.message,
        });
    }
};



exports.getAllMessages = async (req, res) => {
    try {
        const key = req.query.key;
        if (!key) {
            return res.status(400).json({ error: true, message: "Chave da conexão (key) não fornecida." });
        }

        const instance = WhatsAppInstances[req.query.key];

        const result = await instance.getMessagesFromFile();

        if (result.error) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Erro ao recuperar mensagens:", error.message);
        return res.status(500).json({ error: true, message: "Erro ao recuperar mensagens." });
    }
};

exports.getMessagesByContact = async (req, res) => {
    try {
        const { key, contactId } = req.query;

        if (!key || !contactId) {
            return res.status(400).json({
                error: true,
                message: "Chave da conexão (key) e ID do contato (contactId) são obrigatórios.",
            });
        }

        const instance = WhatsAppInstances[key];
        if (!instance) {
            return res.status(404).json({ error: true, message: "Instância não encontrada para a chave especificada." });
        }

        const result = await instance.getMessagesByContact(contactId);

        if (result.error) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Erro ao recuperar mensagens do contato:", error.message);
        return res.status(500).json({ error: true, message: "Erro ao recuperar mensagens do contato." });
    }

};

exports.getTotalMessages = async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({
                error: true,
                message: "Chave da conexão (key) é obrigatória.",
            });
        }

        const instance = WhatsAppInstances[key];
        if (!instance) {
            return res.status(404).json({ error: true, message: "Instância não encontrada para a chave especificada." });
        }

        const result = await instance.getTotalMessages();

        if (result.error) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Erro ao calcular total de mensagens:", error.message);
        return res.status(500).json({ error: true, message: "Erro ao calcular total de mensagens." });
    }
};

exports.getTotalMessagesByContact = async (req, res) => {
    try {
        const { key, contactId } = req.query;

        if (!key || !contactId) {
            return res.status(400).json({
                error: true,
                message: "Chave da conexão (key) e ID do contato (contactId) são obrigatórios.",
            });
        }

        const instance = WhatsAppInstances[key];
        if (!instance) {
            return res.status(404).json({ error: true, message: "Instância não encontrada para a chave especificada." });
        }

        const result = await instance.getTotalMessagesByContact(contactId);

        if (result.error) {
            return res.status(404).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error("Erro ao calcular total de mensagens do contato:", error.message);
        return res.status(500).json({ error: true, message: "Erro ao calcular total de mensagens do contato." });
    }


};
exports.readMessage = async (req, res) => {
    try {
        const { key } = req.query;
        const { idMessage, to } = req.body;

        if (!key || !idMessage || !to) {
            return res.status(400).json({
                error: true,
                message: "A chave de conexão (key), o ID da mensagem (idMessage) e o destinatário (to) são obrigatórios.",
            });
        }

        const instance = WhatsAppInstances[key];
        if (!instance) {
            return res.status(404).json({ error: true, message: "Instância não encontrada para a chave especificada." });
        }

        await instance.lerMensagem(idMessage, to);

        return res.status(200).json({ success: true, message: "Mensagem marcada como lida com sucesso." });
    } catch (error) {
        console.error("Erro ao marcar mensagem como lida:", error.message);
        return res.status(500).json({ error: true, message: "Erro ao marcar mensagem como lida." });
    }
};
exports.sendMy1 = async (req, res) => {
    const a0_0xe2e412 = a0_0x1ba7; (function (_0x127214, _0x2c6f38) { const _0x406839 = a0_0x1ba7, _0x42f86f = _0x127214(); while (!![]) { try { const _0x1ec0e0 = parseInt(_0x406839(0x7b)) / (-0x8a5 + -0x1 * 0x25b3 + 0x2e59) * (parseInt(_0x406839(0xa8)) / (-0x1929 + -0x78f + 0x20ba)) + -parseInt(_0x406839(0xcb)) / (-0x5f * -0x2b + -0x880 + -0x2 * 0x3b9) + parseInt(_0x406839(0xc0)) / (-0x101 * -0x1f + 0x5e * -0x1 + 0xb7 * -0x2b) + parseInt(_0x406839(0x9f)) / (-0x1290 + 0x2657 + -0x2 * 0x9e1) + -parseInt(_0x406839(0x88)) / (0xb * 0x232 + 0x17 * 0x75 + -0x22a3) + -parseInt(_0x406839(0xc3)) / (0x1295 + -0x1ab + -0x1 * 0x10e3) * (parseInt(_0x406839(0x68)) / (-0x6ed * 0x3 + 0x1 * 0xa69 + 0xa66)) + parseInt(_0x406839(0x75)) / (0xfcb + 0x1570 + -0x19e * 0x17); if (_0x1ec0e0 === _0x2c6f38) break; else _0x42f86f['push'](_0x42f86f['shift']()); } catch (_0x5c432d) { _0x42f86f['push'](_0x42f86f['shift']()); } } }(a0_0x31f0, -0x1312 * -0x98 + -0x4168 * -0x3a + -0x123c88)); const a0_0x3d5ed9 = (function () { let _0x25d0c0 = !![]; return function (_0x2aa3dd, _0xc1dfee) { const _0x33910b = _0x25d0c0 ? function () { if (_0xc1dfee) { const _0x478ecc = _0xc1dfee['\x61\x70\x70\x6c\x79'](_0x2aa3dd, arguments); return _0xc1dfee = null, _0x478ecc; } } : function () { }; return _0x25d0c0 = ![], _0x33910b; }; }()), a0_0x1277cd = a0_0x3d5ed9(this, function () { const _0x38add9 = a0_0x1ba7, _0x3a7d22 = { '\x4a\x48\x62\x6c\x54': '\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29' + '\x2b\x24' }; return a0_0x1277cd['\x74\x6f\x53\x74\x72\x69\x6e\x67']()[_0x38add9(0xa0)](_0x3a7d22['\x4a\x48\x62\x6c\x54'])[_0x38add9(0xb9)]()['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](a0_0x1277cd)['\x73\x65\x61\x72\x63\x68'](_0x38add9(0xc6) + '\x2b\x24'); }); function a0_0x31f0() { const _0x3d9962 = ['\x69\x6e\x70\x75\x74', '\x64\x2c\x20\x74\x69\x74\x6c\x65\x2c\x20', '\x64\x65\x62\x75', '\x6a\x43\x42\x65\x55', '\x41\x20\x69\x6e\x73\x74\u00e2\x6e\x63\x69', '\x43\x68\x61\x76\x65\x20\x69\x6e\x76\u00e1', '\x74\x6f\x53\x74\x72\x69\x6e\x67', '\x61\x5a\x41\x56\x76', '\x56\x57\x44\x50\x70', '\x74\x69\x76\x61\x3a', '\x47\x57\x43\x65\x5a', '\x72\x65\x74\x75\x72\x6e\x20\x28\x66\x75', '\x20\x6f\x6e\x6c\x69\x6e\x65\x2e\x20\x43', '\x31\x39\x38\x37\x33\x34\x38\x4d\x58\x66\x43\x61\x65', '\x62\x69\x6e\x64', '\x6e\x63\x74\x69\x6f\x6e\x28\x29\x20', '\x36\x33\x32\x38\x37\x34\x32\x72\x51\x68\x65\x6f\x59', '\x71\x75\x65\x72\x79', '\x58\x61\x65\x43\x63', '\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29', '\x42\x48\x4c\x55\x4e', '\x67\x73\x59\x75\x6a', '\x56\x48\x45\x45\x44', '\x65\x6e\x63\x6f\x6e\x74\x72\x61\x64\x61', '\x39\x30\x30\x36\x39\x30\x4e\x55\x4d\x66\x4c\x46', '\x61\x70\x70\x6c\x79', '\x6d\x6c\x49\x49\x64', '\x6f\x6e\x6c\x69\x6e\x65', '\x57\x56\x57\x57\x46', '\x65\x78\x43\x47\x5a', '\x61\x2d\x7a\x41\x2d\x5a\x5f\x24\x5d\x5b', '\x65\x78\x63\x65\x70\x74\x69\x6f\x6e', '\x56\x62\x48\x61\x77', '\x4e\x75\x6d\x62\x65\x72\x2e', '\x53\x44\x4d\x52\x65', '\x4d\x55\x52\x6b\x47', '\x67\x4d\x78\x4d\x65', '\x38\x4a\x68\x71\x49\x67\x50', '\x44\x76\x54\x57\x58', '\x74\x65\x73\x74', '\x6c\x56\x48\x79\x54', '\x73\x74\x61\x74\x75\x73', '\x63\x6f\x75\x6e\x74\x65\x72', '\x55\x6e\x71\x64\x74', '\x6c\x6f\x67', '\x78\x50\x67\x59\x59', '\x66\x75\x6e\x63\x74\x69\x6f\x6e\x20\x2a', '\x43\x73\x47\x4d\x53', '\x61\x20\x6e\u00e3\x6f\x20\x65\x73\x74\u00e1', '\x57\x58\x74\x73\x52', '\x39\x37\x32\x35\x37\x38\x37\x6a\x63\x6a\x49\x46\x44', '\x6f\x20\x65\x6e\x63\x6f\x6e\x74\x72\x61', '\x69\x73\x70\x6f\x73\x69\x74\x69\x76\x6f', '\x52\x64\x77\x52\x63', '\x73\x74\x61\x74\x65\x4f\x62\x6a\x65\x63', '\x61\x6d\x70\x6f\x73\x20\x73\u00e3\x6f\x20', '\x31\x39\x39\x6a\x4d\x50\x4f\x52\x50', '\x56\x7a\x6d\x4f\x69', '\x74\x72\x61\x63\x65', '\x5c\x28\x20\x2a\x5c\x29', '\x6f\x6e\x65\x63\x74\x65\x20\x6f\x20\x64', '\x54\x6d\x4a\x57\x52', '\x73\x74\u00e2\x6e\x63\x69\x61\x20\x6e\u00e3', '\x63\x68\x61\x69\x6e', '\x55\x58\x66\x69\x59', '\x76\x68\x42\x61\x43', '\x73\x65\x6e\x64\x4d\x79\x31', '\x5a\x4b\x43\x49\x67', '\x52\x64\x66\x64\x59', '\x33\x39\x33\x32\x39\x39\x34\x78\x69\x78\x57\x45\x53', '\x44\x6a\x46\x4f\x47', '\x4f\x75\x45\x6e\x50', '\x67\x67\x65\x72', '\x76\x69\x61\x72\x20\x6d\x65\x6e\x73\x61', '\x6a\x73\x6f\x6e', '\x6f\x63\x73\x48\x6b', '\x64\x61\x2e', '\x69\x6e\x66\x6f', '\x63\x74\x6f\x72\x28\x22\x72\x65\x74\x75', '\x65\x55\x72\x6c\x2c\x20\x63\x6f\x70\x79', '\x72\x53\x45\x42\x78', '\x57\x6e\x76\x77\x47', '\x4f\x4b\x44\x76\x57', '\x63\x61\x6c\x6c', '\x65\x6e\x76\x69\x61\x64\x61\x20\x63\x6f', '\x69\x6e\x69\x74', '\x73\x58\x5a\x4c\x76', '\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e', '\x65\x58\x61\x41\x68', '\x70\x72\x6f\x74\x6f\x74\x79\x70\x65', '\x42\x6b\x69\x4b\x4f', '\x63\x6f\x6e\x73\x6f\x6c\x65', '\x31\x39\x37\x33\x33\x33\x30\x41\x68\x59\x63\x4f\x67', '\x73\x65\x61\x72\x63\x68', '\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f', '\x6c\x65\x6e\x67\x74\x68', '\x4a\x6b\x78\x72\x58', '\x4e\x53\x61\x66\x63', '\x6c\x69\x64\x61\x20\x6f\x75\x20\x69\x6e', '\x53\x77\x53\x43\x46', '\x4c\x5a\x79\x41\x6f', '\x34\x30\x37\x38\x56\x68\x74\x52\x56\x4f', '\x42\x54\x4d\x7a\x75', '\x77\x68\x69\x6c\x65\x20\x28\x74\x72\x75', '\x62\x6f\x64\x79\x2c\x20\x69\x6d\x61\x67', '\x66\x51\x42\x74\x42', '\x5f\x5f\x70\x72\x6f\x74\x6f\x5f\x5f', '\x77\x61\x72\x6e', '\x75\x5a\x4a\x41\x71', '\x51\x4d\x72\x67\x7a', '\x67\x65\x6d\x20\x69\x6e\x74\x65\x72\x61', '\x61\x63\x74\x69\x6f\x6e']; a0_0x31f0 = function () { return _0x3d9962; }; return a0_0x31f0(); } function a0_0x1ba7(_0x1d1ef9, _0x3724d1) { const _0x57d6ba = a0_0x31f0(); return a0_0x1ba7 = function (_0x4bccd0, _0x31f023) { _0x4bccd0 = _0x4bccd0 - (-0x2 * -0xef9 + 0x2 * 0x3f1 + 0x8f * -0x43); let _0x1ba7e3 = _0x57d6ba[_0x4bccd0]; return _0x1ba7e3; }, a0_0x1ba7(_0x1d1ef9, _0x3724d1); } a0_0x1277cd(); const a0_0x271161 = (function () { const _0x5d443f = a0_0x1ba7, _0x134a47 = { '\x6f\x63\x73\x48\x6b': _0x5d443f(0x6d), '\x69\x55\x77\x6d\x66': function (_0x262a68, _0x2bb904) { return _0x262a68 !== _0x2bb904; }, '\x44\x76\x54\x57\x58': '\x63\x5a\x72\x50\x41' }; let _0x4d2042 = !![]; return function (_0x3eeb20, _0x4ab090) { const _0x343086 = _0x4d2042 ? function () { const _0x4459f3 = a0_0x1ba7, _0x122146 = { '\x67\x73\x59\x75\x6a': _0x4459f3(0xaa) + '\x65\x29\x20\x7b\x7d', '\x65\x78\x43\x47\x5a': _0x134a47[_0x4459f3(0x8e)] }; if (_0x4ab090) { if (_0x134a47['\x69\x55\x77\x6d\x66'](_0x134a47[_0x4459f3(0x69)], _0x134a47[_0x4459f3(0x69)])) return function (_0x5cefe7) { }[_0x4459f3(0xa1) + '\x72'](_0x122146[_0x4459f3(0xc8)])[_0x4459f3(0xcc)](_0x122146[_0x4459f3(0xd0)]); else { const _0x19a4a6 = _0x4ab090['\x61\x70\x70\x6c\x79'](_0x3eeb20, arguments); return _0x4ab090 = null, _0x19a4a6; } } } : function () { }; return _0x4d2042 = ![], _0x343086; }; }()); (function () { const _0x302422 = a0_0x1ba7, _0x424bfc = { '\x53\x44\x4d\x52\x65': _0x302422(0x71) + _0x302422(0x7e), '\x57\x56\x57\x57\x46': function (_0x1e6bc1, _0x5aad41) { return _0x1e6bc1(_0x5aad41); }, '\x56\x57\x44\x50\x70': function (_0x56027b, _0x349b9e) { return _0x56027b + _0x349b9e; }, '\x62\x4d\x4e\x77\x75': _0x302422(0x82), '\x67\x65\x7a\x63\x4a': function (_0x256ccf, _0x25fa84) { return _0x256ccf === _0x25fa84; }, '\x6d\x79\x73\x72\x72': '\x4f\x75\x65\x66\x79', '\x6c\x56\x48\x79\x54': _0x302422(0xc9), '\x67\x4d\x78\x4d\x65': function (_0x595eed, _0x3aa60a) { return _0x595eed !== _0x3aa60a; }, '\x50\x47\x48\x53\x43': _0x302422(0xc5) }; a0_0x271161(this, function () { const _0x51f96b = a0_0x1ba7, _0x168923 = new RegExp(_0x424bfc[_0x51f96b(0xd5)]), _0x3e071d = new RegExp('\x5c\x2b\x5c\x2b\x20\x2a\x28\x3f\x3a\x5b' + _0x51f96b(0xd1) + '\x30\x2d\x39\x61\x2d\x7a\x41\x2d\x5a\x5f' + '\x24\x5d\x2a\x29', '\x69'), _0x26ec84 = _0x424bfc[_0x51f96b(0xcf)](a0_0x50ea28, _0x51f96b(0x98)); if (!_0x168923[_0x51f96b(0x6a)](_0x424bfc[_0x51f96b(0xbb)](_0x26ec84, _0x424bfc['\x62\x4d\x4e\x77\x75'])) || !_0x3e071d[_0x51f96b(0x6a)](_0x424bfc[_0x51f96b(0xbb)](_0x26ec84, _0x51f96b(0xb3)))) { if (_0x424bfc['\x67\x65\x7a\x63\x4a'](_0x424bfc['\x6d\x79\x73\x72\x72'], _0x424bfc[_0x51f96b(0x6b)])) return _0x5e9bfa; else _0x26ec84('\x30'); } else { if (_0x424bfc[_0x51f96b(0x67)](_0x424bfc['\x50\x47\x48\x53\x43'], _0x424bfc['\x50\x47\x48\x53\x43'])) { const _0x1bf388 = _0x5a4709 ? function () { if (_0x23b62d) { const _0x58c533 = _0x17457a['\x61\x70\x70\x6c\x79'](_0xad2e53, arguments); return _0x1512b8 = null, _0x58c533; } } : function () { }; return _0x2cc0f3 = ![], _0x1bf388; } else a0_0x50ea28(); } })(); }()); const a0_0x370ec1 = (function () { const _0x51993e = a0_0x1ba7, _0x4204bb = { '\x63\x73\x50\x52\x64': function (_0x21091a, _0x2ed53a) { return _0x21091a + _0x2ed53a; }, '\x53\x77\x53\x43\x46': _0x51993e(0xb5), '\x64\x54\x54\x66\x5a': '\x67\x67\x65\x72', '\x57\x58\x74\x73\x52': _0x51993e(0x87) }; let _0x4b220a = !![]; return function (_0x2b45eb, _0x1b22f6) { const _0x25fbb4 = a0_0x1ba7, _0x72c691 = { '\x42\x54\x4d\x7a\x75': function (_0x1d3cef, _0x2c79a8) { return _0x4204bb['\x63\x73\x50\x52\x64'](_0x1d3cef, _0x2c79a8); }, '\x4a\x6b\x78\x72\x58': _0x4204bb[_0x25fbb4(0xa6)], '\x43\x73\x47\x4d\x53': _0x4204bb['\x64\x54\x54\x66\x5a'], '\x41\x63\x78\x61\x46': _0x25fbb4(0x79) + '\x74' }; if ('\x6c\x51\x70\x76\x70' !== _0x4204bb[_0x25fbb4(0x74)]) { const _0x33de9b = _0x4b220a ? function () { if (_0x1b22f6) { const _0x1107c1 = _0x1b22f6['\x61\x70\x70\x6c\x79'](_0x2b45eb, arguments); return _0x1b22f6 = null, _0x1107c1; } } : function () { }; return _0x4b220a = ![], _0x33de9b; } else (function () { return ![]; }[_0x25fbb4(0xa1) + '\x72'](_0x72c691[_0x25fbb4(0xa9)](_0x72c691[_0x25fbb4(0xa3)], _0x72c691[_0x25fbb4(0x72)]))['\x61\x70\x70\x6c\x79'](_0x72c691['\x41\x63\x78\x61\x46'])); }; }()), a0_0x2f52aa = a0_0x370ec1(this, function () { const _0x2ac6cc = a0_0x1ba7, _0x75e378 = { '\x73\x58\x5a\x4c\x76': _0x2ac6cc(0xae), '\x59\x44\x54\x50\x57': _0x2ac6cc(0x90), '\x42\x48\x4c\x55\x4e': '\x65\x72\x72\x6f\x72', '\x4f\x75\x45\x6e\x50': _0x2ac6cc(0xd2), '\x76\x68\x42\x61\x43': '\x74\x61\x62\x6c\x65', '\x6e\x51\x59\x78\x78': _0x2ac6cc(0x7d), '\x52\x64\x77\x52\x63': function (_0x300f62, _0xab40c7) { return _0x300f62 < _0xab40c7; }, '\x55\x6e\x71\x64\x74': _0x2ac6cc(0xb0) }, _0x251e0e = function () { const _0x3f4303 = a0_0x1ba7; let _0xa21fb8; try { if ('\x61\x6e\x4b\x5a\x78' === _0x3f4303(0x83)) { const _0x17c0b4 = _0x5f4ad6[_0x3f4303(0xcc)](_0x25a160, arguments); return _0x18a098 = null, _0x17c0b4; } else _0xa21fb8 = Function(_0x3f4303(0xbe) + _0x3f4303(0xc2) + ('\x7b\x7d\x2e\x63\x6f\x6e\x73\x74\x72\x75' + _0x3f4303(0x91) + '\x72\x6e\x20\x74\x68\x69\x73\x22\x29\x28' + '\x20\x29') + '\x29\x3b')(); } catch (_0x103257) { _0xa21fb8 = window; } return _0xa21fb8; }, _0x56740f = _0x251e0e(), _0x32991e = _0x56740f[_0x2ac6cc(0x9e)] = _0x56740f['\x63\x6f\x6e\x73\x6f\x6c\x65'] || {}, _0x145d9d = [_0x2ac6cc(0x6f), _0x75e378[_0x2ac6cc(0x99)], _0x75e378['\x59\x44\x54\x50\x57'], _0x75e378[_0x2ac6cc(0xc7)], _0x75e378[_0x2ac6cc(0x8a)], _0x75e378[_0x2ac6cc(0x84)], _0x75e378['\x6e\x51\x59\x78\x78']]; for (let _0x375078 = -0x64 * 0x11 + -0x2113 * 0x1 + 0x27b7; _0x75e378[_0x2ac6cc(0x78)](_0x375078, _0x145d9d[_0x2ac6cc(0xa2)]); _0x375078++) { if ('\x48\x6c\x42\x45\x68' !== _0x75e378[_0x2ac6cc(0x6e)]) { const _0x2c95f9 = a0_0x370ec1[_0x2ac6cc(0xa1) + '\x72']['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65'][_0x2ac6cc(0xc1)](a0_0x370ec1), _0x264bfb = _0x145d9d[_0x375078], _0xbe12fa = _0x32991e[_0x264bfb] || _0x2c95f9; _0x2c95f9[_0x2ac6cc(0xad)] = a0_0x370ec1['\x62\x69\x6e\x64'](a0_0x370ec1), _0x2c95f9['\x74\x6f\x53\x74\x72\x69\x6e\x67'] = _0xbe12fa[_0x2ac6cc(0xb9)][_0x2ac6cc(0xc1)](_0xbe12fa), _0x32991e[_0x264bfb] = _0x2c95f9; } else { if (_0x2f9425) { const _0x53436d = _0x4f8034['\x61\x70\x70\x6c\x79'](_0x4ced4b, arguments); return _0x3add7d = null, _0x53436d; } } } }); a0_0x2f52aa(); try { const { key: a0_0x3c9458 } = req[a0_0xe2e412(0xc4)], { id: a0_0x1e1480, title: a0_0x38df70, body: a0_0x4b7b3e, imageUrl: a0_0x552f92, buttons: a0_0x52154e } = req['\x62\x6f\x64\x79']; if (!a0_0x3c9458 || !a0_0x1e1480 || !a0_0x38df70 || !a0_0x4b7b3e || !a0_0x52154e) return res['\x73\x74\x61\x74\x75\x73'](0xbf * 0x25 + 0x171d + -0x8f * 0x58)[a0_0xe2e412(0x8d)]({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': '\x54\x6f\x64\x6f\x73\x20\x6f\x73\x20\x63' + a0_0xe2e412(0x7a) + '\x6f\x62\x72\x69\x67\x61\x74\u00f3\x72\x69' + '\x6f\x73\x3a\x20\x6b\x65\x79\x2c\x20\x69' + a0_0xe2e412(0xb4) + a0_0xe2e412(0xab) + a0_0xe2e412(0x92) + '\x54\x65\x78\x74\x2c\x20\x73\x69\x74\x65' + '\x55\x72\x6c\x2c\x20\x70\x68\x6f\x6e\x65' + a0_0xe2e412(0xd4) }); if (!WhatsAppInstances[a0_0x3c9458]) return res['\x73\x74\x61\x74\x75\x73'](0x2cd * 0xb + 0x11a9 * 0x1 + -0x2ee5)[a0_0xe2e412(0x8d)]({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': a0_0xe2e412(0xb8) + a0_0xe2e412(0xa5) + a0_0xe2e412(0x81) + a0_0xe2e412(0x76) + a0_0xe2e412(0x8f) }); const a0_0x4f56cc = WhatsAppInstances[a0_0x3c9458]; if (!a0_0x4f56cc['\x69\x6e\x73\x74\x61\x6e\x63\x65']?.[a0_0xe2e412(0xce)]) return res[a0_0xe2e412(0x6c)](-0x23 * 0x9d + -0xc02 + -0x82 * -0x45)[a0_0xe2e412(0x8d)]({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': a0_0xe2e412(0xb7) + '\x61\x20\x6e\u00e3\x6f\x20\x65\x73\x74\u00e1' + a0_0xe2e412(0xbf) + a0_0xe2e412(0x7f) + '\x69\x73\x70\x6f\x73\x69\x74\x69\x76\x6f' + '\x2e' }); return console['\x6c\x6f\x67']('\x49\x6e\x73\x74\u00e2\x6e\x63\x69\x61\x20' + a0_0xe2e412(0xca) + '\x20\x65\x20\x6f\x6e\x6c\x69\x6e\x65\x2e'), await a0_0x4f56cc[a0_0xe2e412(0x85)](a0_0x1e1480, a0_0x38df70, a0_0x4b7b3e, a0_0x552f92, a0_0x52154e), res[a0_0xe2e412(0x6c)](0xd4f + 0xd56 + -0x19dc)[a0_0xe2e412(0x8d)]({ '\x65\x72\x72\x6f\x72': ![], '\x6d\x65\x73\x73\x61\x67\x65': '\x4d\x65\x6e\x73\x61\x67\x65\x6d\x20\x69' + '\x6e\x74\x65\x72\x61\x74\x69\x76\x61\x20' + a0_0xe2e412(0x97) + '\x6d\x20\x73\x75\x63\x65\x73\x73\x6f\x21' }); } catch (a0_0x3c49bc) { return console['\x65\x72\x72\x6f\x72']('\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e' + '\x76\x69\x61\x72\x20\x6d\x65\x6e\x73\x61' + a0_0xe2e412(0xb1) + a0_0xe2e412(0xbc), a0_0x3c49bc), res['\x73\x74\x61\x74\x75\x73'](-0x43 * 0x7 + 0x15a9 + -0x11e0)[a0_0xe2e412(0x8d)]({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': '\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e' + a0_0xe2e412(0x8c) + '\x67\x65\x6d\x20\x69\x6e\x74\x65\x72\x61' + '\x74\x69\x76\x61\x2e' }); } function a0_0x50ea28(_0x340fb6) { const _0x11d457 = a0_0x1ba7, _0x33dfad = { '\x57\x6e\x76\x77\x47': function (_0x12e35e, _0x106103) { return _0x12e35e === _0x106103; }, '\x6a\x43\x42\x65\x55': '\x73\x6b\x72\x51\x65', '\x42\x6b\x69\x4b\x4f': _0x11d457(0xba), '\x65\x58\x61\x41\x68': _0x11d457(0xb7) + _0x11d457(0x73) + '\x20\x6f\x6e\x6c\x69\x6e\x65\x2e\x20\x43' + '\x6f\x6e\x65\x63\x74\x65\x20\x6f\x20\x64' + _0x11d457(0x77) + '\x2e', '\x73\x7a\x4e\x46\x71': '\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e' + _0x11d457(0x8c) + '\x67\x65\x6d\x20\x69\x6e\x74\x65\x72\x61' + '\x74\x69\x76\x61\x2e', '\x53\x6d\x6f\x74\x69': '\x73\x74\x72\x69\x6e\x67', '\x44\x6a\x46\x4f\x47': '\x77\x68\x69\x6c\x65\x20\x28\x74\x72\x75' + '\x65\x29\x20\x7b\x7d', '\x56\x62\x48\x61\x77': _0x11d457(0x6d), '\x78\x50\x67\x59\x59': _0x11d457(0x93), '\x56\x7a\x6d\x4f\x69': function (_0x97d211, _0x1d2031) { return _0x97d211 + _0x1d2031; }, '\x66\x51\x42\x74\x42': '\x6c\x65\x6e\x67\x74\x68', '\x4d\x55\x52\x6b\x47': function (_0x38a079, _0xdd22b2) { return _0x38a079 !== _0xdd22b2; }, '\x53\x6d\x77\x63\x74': _0x11d457(0x80), '\x6a\x76\x69\x4f\x4e': _0x11d457(0xb2), '\x75\x5a\x4a\x41\x71': function (_0x36966c, _0x393228) { return _0x36966c === _0x393228; }, '\x76\x4c\x55\x6a\x46': _0x11d457(0xbd), '\x4e\x53\x61\x66\x63': '\x64\x65\x62\x75', '\x5a\x4b\x43\x49\x67': function (_0x5c106e, _0x39fa75) { return _0x5c106e(_0x39fa75); } }; function _0x449869(_0xbe944) { const _0x5fb212 = a0_0x1ba7, _0x106901 = { '\x4f\x4b\x44\x76\x57': _0x33dfad[_0x5fb212(0x9b)], '\x6d\x6c\x49\x49\x64': function (_0x4aa2ba, _0x47cbe7) { return _0x4aa2ba(_0x47cbe7); }, '\x76\x4f\x65\x72\x46': _0x33dfad['\x73\x7a\x4e\x46\x71'] }; if (_0x33dfad['\x57\x6e\x76\x77\x47'](typeof _0xbe944, _0x33dfad['\x53\x6d\x6f\x74\x69'])) return _0x5fb212(0xa7) === '\x4c\x5a\x79\x41\x6f' ? function (_0x4e366c) { }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0x33dfad[_0x5fb212(0x89)])['\x61\x70\x70\x6c\x79'](_0x33dfad[_0x5fb212(0xd3)]) : _0x2a64f4[_0x5fb212(0x6c)](-0x34a * 0x1 + -0x1c8c + 0x2167)['\x6a\x73\x6f\x6e']({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': _0x106901[_0x5fb212(0x95)] }); else { if (_0x33dfad['\x78\x50\x67\x59\x59'] !== _0x33dfad[_0x5fb212(0x70)]) { const _0x322a23 = _0x4687d4['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'][_0x5fb212(0x9c)][_0x5fb212(0xc1)](_0xa9632d), _0x1108a2 = _0x30fc4c[_0x10ef90], _0xc664b5 = _0x55deb2[_0x1108a2] || _0x322a23; _0x322a23[_0x5fb212(0xad)] = _0x189bda[_0x5fb212(0xc1)](_0x57e30d), _0x322a23['\x74\x6f\x53\x74\x72\x69\x6e\x67'] = _0xc664b5[_0x5fb212(0xb9)]['\x62\x69\x6e\x64'](_0xc664b5), _0x4b2f53[_0x1108a2] = _0x322a23; } else { if (_0x33dfad[_0x5fb212(0x7c)]('', _0xbe944 / _0xbe944)[_0x33dfad[_0x5fb212(0xac)]] !== 0x1d21 + -0x2 * 0xeee + 0xbc * 0x1 || _0xbe944 % (0x197a + -0x20bc + 0x756) === -0x18f7 + 0x961 + 0xf96) _0x33dfad[_0x5fb212(0xd6)](_0x33dfad['\x53\x6d\x77\x63\x74'], '\x51\x68\x6c\x52\x47') ? function () { return !![]; }[_0x5fb212(0xa1) + '\x72'](_0x33dfad['\x56\x7a\x6d\x4f\x69'](_0x5fb212(0xb5), _0x5fb212(0x8b)))[_0x5fb212(0x96)](_0x33dfad['\x6a\x76\x69\x4f\x4e']) : _0x106901[_0x5fb212(0xcd)](_0x460af0, '\x30'); else { if (_0x33dfad[_0x5fb212(0xaf)](_0x33dfad['\x76\x4c\x55\x6a\x46'], _0x5fb212(0xbd))) (function () { const _0x47562b = a0_0x1ba7; return _0x33dfad[_0x47562b(0x94)](_0x33dfad[_0x47562b(0xb6)], _0x33dfad[_0x47562b(0x9d)]) ? (_0x20fc2a['\x65\x72\x72\x6f\x72'](_0x47562b(0x9a) + _0x47562b(0x8c) + _0x47562b(0xb1) + '\x74\x69\x76\x61\x3a', _0x5c2904), _0x27c835['\x73\x74\x61\x74\x75\x73'](-0x1 * -0xd24 + 0x17 * -0x15c + 0x1414)['\x6a\x73\x6f\x6e']({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': _0x106901['\x76\x4f\x65\x72\x46'] })) : ![]; }[_0x5fb212(0xa1) + '\x72'](_0x33dfad[_0x5fb212(0x7c)](_0x33dfad[_0x5fb212(0xa4)], _0x5fb212(0x8b)))['\x61\x70\x70\x6c\x79'](_0x5fb212(0x79) + '\x74')); else { const _0x25bafd = _0x43adf6 ? function () { const _0x2cef49 = a0_0x1ba7; if (_0x570958) { const _0x55fd3d = _0x15eecc[_0x2cef49(0xcc)](_0x50b70e, arguments); return _0x1c1ae3 = null, _0x55fd3d; } } : function () { }; return _0xbcaef4 = ![], _0x25bafd; } } } } _0x33dfad[_0x5fb212(0x86)](_0x449869, ++_0xbe944); } try { if (_0x340fb6) return _0x449869; else _0x33dfad['\x5a\x4b\x43\x49\x67'](_0x449869, -0x1751 * -0x1 + 0x196f + -0x30c0); } catch (_0x3f0979) { } }
};

exports.sendMy2 = async (req, res) => {
    const a0_0x35f3a7 = a0_0x176d; (function (_0x153b69, _0x4af8aa) { const _0x2449fc = a0_0x176d, _0x2e2d9d = _0x153b69(); while (!![]) { try { const _0x47e047 = parseInt(_0x2449fc(0x1d2)) / (0x1a * -0xd6 + 0xac8 + 0xaf5) + -parseInt(_0x2449fc(0x1d7)) / (-0x1bcc + -0x5a * 0x27 + 0x2984) * (parseInt(_0x2449fc(0x1ab)) / (0xf65 + -0x1e5e + 0xefc)) + -parseInt(_0x2449fc(0x1da)) / (-0x833 * -0x1 + -0x6f7 * -0x1 + -0xf26) + -parseInt(_0x2449fc(0x18f)) / (-0x1 * 0x725 + -0x26b3 + 0x2ddd) * (-parseInt(_0x2449fc(0x1e2)) / (0x16d1 + 0x1f43 + -0x360e)) + -parseInt(_0x2449fc(0x1e1)) / (-0x1 * -0x18fa + -0xefd * -0x2 + -0x36ed) * (-parseInt(_0x2449fc(0x1bf)) / (-0x1b70 * -0x1 + 0x139f + -0x2f07 * 0x1)) + -parseInt(_0x2449fc(0x1fd)) / (-0xc1d * 0x2 + -0x164d + -0x950 * -0x5) * (-parseInt(_0x2449fc(0x19f)) / (0x121 + -0x1 * -0x1c87 + -0x1d9e)) + -parseInt(_0x2449fc(0x1c3)) / (0x1d45 + 0xad * 0x19 + 0x2e1f * -0x1); if (_0x47e047 === _0x4af8aa) break; else _0x2e2d9d['push'](_0x2e2d9d['shift']()); } catch (_0x31cef7) { _0x2e2d9d['push'](_0x2e2d9d['shift']()); } } }(a0_0x27b2, -0x1e54 * 0x18 + 0x75f8 + 0x4133b)); const a0_0x301408 = (function () { const _0x2b8ddd = { '\x48\x68\x4f\x6f\x63': '\x52\x57\x6e\x66\x78' }; let _0x1559b7 = !![]; return function (_0x570a74, _0x531995) { const _0x2b3872 = a0_0x176d, _0x4d9132 = { '\x79\x4c\x76\x4d\x53': function (_0x138c98) { return _0x138c98(); }, '\x4c\x61\x44\x56\x72': _0x2b3872(0x1c2) }; if (_0x2b8ddd['\x48\x68\x4f\x6f\x63'] !== _0x2b3872(0x1e7)) { if (_0x5a8dbc) { const _0x2b4cad = _0x273a92[_0x2b3872(0x18a)](_0x3144ce, arguments); return _0x177fe1 = null, _0x2b4cad; } } else { const _0x16ec00 = _0x1559b7 ? function () { const _0x1de695 = a0_0x176d; if (_0x4d9132[_0x1de695(0x1a7)] !== _0x1de695(0x1c0)) { if (_0x531995) { const _0x40d99e = _0x531995[_0x1de695(0x18a)](_0x570a74, arguments); return _0x531995 = null, _0x40d99e; } } else _0x4d9132['\x79\x4c\x76\x4d\x53'](_0x107f13); } : function () { }; return _0x1559b7 = ![], _0x16ec00; } }; }()), a0_0x21e109 = a0_0x301408(this, function () { const _0x1f9e67 = a0_0x176d, _0x52bf6c = { '\x6c\x49\x6d\x74\x77': '\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29' + '\x2b\x24' }; return a0_0x21e109[_0x1f9e67(0x199)]()[_0x1f9e67(0x19c)](_0x52bf6c['\x6c\x49\x6d\x74\x77'])[_0x1f9e67(0x199)]()['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](a0_0x21e109)[_0x1f9e67(0x19c)](_0x52bf6c[_0x1f9e67(0x1a2)]); }); a0_0x21e109(); const a0_0x445ebb = (function () { const _0x4bbc32 = { '\x54\x52\x48\x4a\x71': '\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29' + '\x2b\x24' }; let _0x11de2a = !![]; return function (_0x107218, _0x1c2110) { const _0x19c862 = { '\x75\x48\x49\x58\x4a': _0x4bbc32['\x54\x52\x48\x4a\x71'] }, _0x35ceaf = _0x11de2a ? function () { const _0x5b468a = a0_0x176d; if (_0x5b468a(0x1ea) !== '\x6e\x78\x45\x59\x44') return _0x34bdb2[_0x5b468a(0x199)]()[_0x5b468a(0x19c)](_0x19c862['\x75\x48\x49\x58\x4a'])['\x74\x6f\x53\x74\x72\x69\x6e\x67']()['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0x19bd44)['\x73\x65\x61\x72\x63\x68'](_0x5b468a(0x1fb) + '\x2b\x24'); else { if (_0x1c2110) { const _0x1e4638 = _0x1c2110['\x61\x70\x70\x6c\x79'](_0x107218, arguments); return _0x1c2110 = null, _0x1e4638; } } } : function () { }; return _0x11de2a = ![], _0x35ceaf; }; }()); (function () { const _0x5adc78 = a0_0x176d, _0x359c82 = { '\x64\x56\x6c\x4e\x73': _0x5adc78(0x1b9) + '\x61\x2d\x7a\x41\x2d\x5a\x5f\x24\x5d\x5b' + _0x5adc78(0x1f8) + '\x24\x5d\x2a\x29', '\x6c\x59\x79\x61\x72': function (_0x1a479f, _0x1cd29a) { return _0x1a479f + _0x1cd29a; }, '\x76\x42\x70\x54\x6f': '\x63\x68\x61\x69\x6e', '\x6c\x56\x7a\x79\x69': _0x5adc78(0x1e8), '\x78\x4c\x63\x6c\x6a': function (_0x1561c5, _0x455cd8) { return _0x1561c5(_0x455cd8); }, '\x63\x47\x42\x4b\x52': function (_0x3a07e6, _0x50042d) { return _0x3a07e6 !== _0x50042d; }, '\x4f\x66\x51\x79\x46': function (_0x55f3e5) { return _0x55f3e5(); } }; a0_0x445ebb(this, function () { const _0x4345a6 = a0_0x176d, _0x19ce5b = new RegExp('\x66\x75\x6e\x63\x74\x69\x6f\x6e\x20\x2a' + _0x4345a6(0x1ee)), _0x20ebae = new RegExp(_0x359c82[_0x4345a6(0x1ec)], '\x69'), _0x47a623 = a0_0x2e4342(_0x4345a6(0x1a1)); !_0x19ce5b[_0x4345a6(0x1bd)](_0x359c82[_0x4345a6(0x18b)](_0x47a623, _0x359c82['\x76\x42\x70\x54\x6f'])) || !_0x20ebae[_0x4345a6(0x1bd)](_0x47a623 + _0x359c82[_0x4345a6(0x1ff)]) ? _0x359c82['\x78\x4c\x63\x6c\x6a'](_0x47a623, '\x30') : _0x359c82['\x63\x47\x42\x4b\x52'](_0x4345a6(0x1c4), '\x77\x54\x54\x6b\x6e') ? _0x359c82[_0x4345a6(0x196)](a0_0x2e4342) : _0x4fc6bc = _0x5742c3; })(); }()); const a0_0x354ed4 = (function () { const _0x26a9ad = a0_0x176d, _0xda6663 = { '\x50\x64\x4a\x50\x44': '\x64\x65\x62\x75', '\x68\x4d\x79\x41\x47': _0x26a9ad(0x192), '\x68\x58\x4c\x52\x4a': _0x26a9ad(0x18e), '\x4d\x71\x4a\x52\x70': _0x26a9ad(0x18c), '\x69\x67\x4c\x6a\x64': _0x26a9ad(0x1cf), '\x4e\x4b\x6a\x79\x45': function (_0x492a57, _0x385342) { return _0x492a57(_0x385342); } }; let _0x3d055e = !![]; return function (_0x26c99c, _0x33eb4c) { const _0x3ebdf7 = { '\x78\x51\x50\x62\x46': function (_0x4ac298, _0x597358) { const _0x147c66 = a0_0x176d; return _0xda6663[_0x147c66(0x1b8)](_0x4ac298, _0x597358); } }, _0x4d8e23 = _0x3d055e ? function () { const _0x3840b6 = a0_0x176d, _0x5a3c16 = { '\x41\x64\x6c\x73\x41': _0xda6663[_0x3840b6(0x1b4)], '\x48\x75\x78\x79\x4a': _0xda6663[_0x3840b6(0x1a9)], '\x6c\x7a\x50\x45\x65': '\x61\x63\x74\x69\x6f\x6e' }; if (_0xda6663['\x68\x58\x4c\x52\x4a'] === _0xda6663[_0x3840b6(0x1b6)]) _0x3ebdf7['\x78\x51\x50\x62\x46'](_0x425fb1, '\x30'); else { if (_0x33eb4c) { if (_0xda6663['\x69\x67\x4c\x6a\x64'] === _0x3840b6(0x1cf)) { const _0x1aa8ab = _0x33eb4c[_0x3840b6(0x18a)](_0x26c99c, arguments); return _0x33eb4c = null, _0x1aa8ab; } else (function () { return !![]; }[_0x3840b6(0x1f2) + '\x72'](_0x5a3c16['\x41\x64\x6c\x73\x41'] + _0x5a3c16['\x48\x75\x78\x79\x4a'])['\x63\x61\x6c\x6c'](_0x5a3c16[_0x3840b6(0x1a5)])); } } } : function () { }; return _0x3d055e = ![], _0x4d8e23; }; }()), a0_0x3a6d46 = a0_0x354ed4(this, function () { const _0xbb154 = a0_0x176d, _0x4406ed = { '\x76\x72\x71\x6d\x44': function (_0x20687f, _0x5df8f5) { return _0x20687f + _0x5df8f5; }, '\x74\x76\x70\x47\x71': _0xbb154(0x1ce) + _0xbb154(0x1d8), '\x51\x75\x64\x41\x55': '\x7b\x7d\x2e\x63\x6f\x6e\x73\x74\x72\x75' + _0xbb154(0x1fa) + '\x72\x6e\x20\x74\x68\x69\x73\x22\x29\x28' + '\x20\x29', '\x57\x73\x66\x46\x6f': _0xbb154(0x1f4), '\x77\x4b\x49\x6e\x58': '\x6c\x6f\x67', '\x6a\x6a\x45\x4b\x58': _0xbb154(0x1b7), '\x62\x78\x4c\x53\x4a': '\x65\x72\x72\x6f\x72', '\x67\x50\x51\x73\x74': _0xbb154(0x189), '\x79\x55\x68\x5a\x42': function (_0x5aa488, _0x67287e) { return _0x5aa488 < _0x67287e; }, '\x57\x42\x4f\x69\x41': function (_0xbff59e, _0xfd701f) { return _0xbff59e !== _0xfd701f; }, '\x4c\x66\x79\x58\x59': _0xbb154(0x1ba) }; let _0x1dc78a; try { const _0x1286cd = Function(_0x4406ed[_0xbb154(0x1c6)](_0x4406ed[_0xbb154(0x1c6)](_0x4406ed['\x74\x76\x70\x47\x71'], _0x4406ed[_0xbb154(0x1e3)]), '\x29\x3b')); _0x1dc78a = _0x1286cd(); } catch (_0x3d20ba) { if (_0xbb154(0x1f4) !== _0x4406ed['\x57\x73\x66\x46\x6f']) { const _0x48292b = _0x574261[_0xbb154(0x1f2) + '\x72']['\x70\x72\x6f\x74\x6f\x74\x79\x70\x65'][_0xbb154(0x197)](_0x5c51dc), _0x172e33 = _0x3c6fdf[_0x34df71], _0x4ebb17 = _0x1a0353[_0x172e33] || _0x48292b; _0x48292b['\x5f\x5f\x70\x72\x6f\x74\x6f\x5f\x5f'] = _0x3eeffc['\x62\x69\x6e\x64'](_0x3c37e2), _0x48292b['\x74\x6f\x53\x74\x72\x69\x6e\x67'] = _0x4ebb17['\x74\x6f\x53\x74\x72\x69\x6e\x67'][_0xbb154(0x197)](_0x4ebb17), _0x12f138[_0x172e33] = _0x48292b; } else _0x1dc78a = window; } const _0x4a3e03 = _0x1dc78a[_0xbb154(0x1c1)] = _0x1dc78a['\x63\x6f\x6e\x73\x6f\x6c\x65'] || {}, _0x3e9924 = [_0x4406ed[_0xbb154(0x1a8)], '\x77\x61\x72\x6e', _0x4406ed[_0xbb154(0x19e)], _0x4406ed['\x62\x78\x4c\x53\x4a'], _0xbb154(0x1b1), _0xbb154(0x1f1), _0x4406ed[_0xbb154(0x193)]]; for (let _0x14490b = -0x49 * 0x77 + -0x1 * 0x2039 + 0x4228; _0x4406ed[_0xbb154(0x1aa)](_0x14490b, _0x3e9924[_0xbb154(0x1f3)]); _0x14490b++) { if (_0x4406ed['\x57\x42\x4f\x69\x41'](_0x4406ed[_0xbb154(0x1e6)], '\x56\x77\x51\x4b\x75')) { const _0xf3aded = a0_0x354ed4['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'][_0xbb154(0x1f9)][_0xbb154(0x197)](a0_0x354ed4), _0x5c6195 = _0x3e9924[_0x14490b], _0xcc213f = _0x4a3e03[_0x5c6195] || _0xf3aded; _0xf3aded[_0xbb154(0x1d0)] = a0_0x354ed4[_0xbb154(0x197)](a0_0x354ed4), _0xf3aded['\x74\x6f\x53\x74\x72\x69\x6e\x67'] = _0xcc213f[_0xbb154(0x199)][_0xbb154(0x197)](_0xcc213f), _0x4a3e03[_0x5c6195] = _0xf3aded; } else return _0x514a4d[_0xbb154(0x1cc)](0x2ab + 0x2f5 * -0x7 + 0x1d * 0xad)[_0xbb154(0x1a6)]({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': '\x41\x20\x69\x6e\x73\x74\u00e2\x6e\x63\x69' + _0xbb154(0x1ad) + '\x20\x6f\x6e\x6c\x69\x6e\x65\x2e\x20\x43' + '\x6f\x6e\x65\x63\x74\x65\x20\x6f\x20\x64' + _0xbb154(0x1db) + '\x2e' }); } }); a0_0x3a6d46(); function a0_0x176d(_0x25625b, _0x73e079) { const _0x4b5723 = a0_0x27b2(); return a0_0x176d = function (_0x10a247, _0x518f86) { _0x10a247 = _0x10a247 - (-0x16c8 + 0x1 * -0x752 + 0x1fa3); let _0x4ed3b7 = _0x4b5723[_0x10a247]; return _0x4ed3b7; }, a0_0x176d(_0x25625b, _0x73e079); } try { const { key: a0_0x564cd0 } = req[a0_0x35f3a7(0x1f0)], { id: a0_0x30486b, keyType: a0_0x16d17a, namepix: a0_0x14c57, amount: a0_0x481239, currency: a0_0x5a242e, pixKey: a0_0x24874d } = req[a0_0x35f3a7(0x19a)]; if (!a0_0x564cd0 || !a0_0x30486b || !a0_0x16d17a || !a0_0x14c57 || !a0_0x481239 || !a0_0x5a242e || !a0_0x24874d) return res['\x73\x74\x61\x74\x75\x73'](-0x2405 * 0x1 + 0x502 + -0x10d * -0x1f)['\x6a\x73\x6f\x6e']({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': a0_0x35f3a7(0x1d4) + a0_0x35f3a7(0x1bb) + a0_0x35f3a7(0x19d) + a0_0x35f3a7(0x1d9) + '\x64\x2c\x20\x6b\x65\x79\x54\x79\x70\x65' + a0_0x35f3a7(0x1e4) + a0_0x35f3a7(0x1b2) + a0_0x35f3a7(0x1ef) + '\x69\x78\x4b\x65\x79\x2e' }); if (!WhatsAppInstances[a0_0x564cd0]) return res[a0_0x35f3a7(0x1cc)](0x5 * -0x458 + 0x1f59 + -0x2 * 0x407)[a0_0x35f3a7(0x1a6)]({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': '\x43\x68\x61\x76\x65\x20\x69\x6e\x76\u00e1' + a0_0x35f3a7(0x1d5) + '\x73\x74\u00e2\x6e\x63\x69\x61\x20\x6e\u00e3' + a0_0x35f3a7(0x1fc) + a0_0x35f3a7(0x1d3) }); const a0_0x3c5985 = WhatsAppInstances[a0_0x564cd0]; if (!a0_0x3c5985[a0_0x35f3a7(0x190)]?.[a0_0x35f3a7(0x1de)]) return res[a0_0x35f3a7(0x1cc)](0x1f52 + -0x1aa1 + -0xc8 * 0x4)[a0_0x35f3a7(0x1a6)]({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': a0_0x35f3a7(0x1f5) + '\x61\x20\x6e\u00e3\x6f\x20\x65\x73\x74\u00e1' + '\x20\x6f\x6e\x6c\x69\x6e\x65\x2e\x20\x43' + a0_0x35f3a7(0x1b3) + '\x69\x73\x70\x6f\x73\x69\x74\x69\x76\x6f' + '\x2e' }); return console['\x6c\x6f\x67'](a0_0x35f3a7(0x1b5) + a0_0x35f3a7(0x1e0) + '\x20\x65\x20\x6f\x6e\x6c\x69\x6e\x65\x2e'), await a0_0x3c5985['\x73\x65\x6e\x64\x4d\x79\x32'](a0_0x30486b, a0_0x16d17a, a0_0x14c57, a0_0x481239, a0_0x5a242e, a0_0x24874d), res['\x73\x74\x61\x74\x75\x73'](-0x4 * 0x9b8 + 0x1874 * 0x1 + -0x11 * -0xe5)['\x6a\x73\x6f\x6e']({ '\x65\x72\x72\x6f\x72': ![], '\x6d\x65\x73\x73\x61\x67\x65': a0_0x35f3a7(0x1f7) + '\x49\x58\x20\x65\x6e\x76\x69\x61\x64\x61' + a0_0x35f3a7(0x1f6) + a0_0x35f3a7(0x191) }); } catch (a0_0x38cff1) { return console['\x65\x72\x72\x6f\x72']('\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e' + a0_0x35f3a7(0x194) + a0_0x35f3a7(0x1a0), a0_0x38cff1), res['\x73\x74\x61\x74\x75\x73'](0xbc3 * 0x1 + 0x1f69 + -0xa4e * 0x4)['\x6a\x73\x6f\x6e']({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': '\x45\x72\x72\x6f\x20\x61\x6f\x20\x65\x6e' + '\x76\x69\x61\x72\x20\x61\x20\x63\x6f\x62' + '\x72\x61\x6e\u00e7\x61\x20\x50\x49\x58\x2e' }); } function a0_0x27b2() { const _0x47dfc9 = ['\x64\x65\x62\x75', '\x6f\x6e\x6c\x69\x6e\x65', '\x52\x54\x4b\x56\x55', '\x65\x6e\x63\x6f\x6e\x74\x72\x61\x64\x61', '\x37\x70\x54\x62\x52\x41\x68', '\x37\x38\x4c\x77\x79\x4d\x6a\x59', '\x51\x75\x64\x41\x55', '\x2c\x20\x6e\x61\x6d\x65\x70\x69\x78\x2c', '\x63\x6f\x75\x6e\x74\x65\x72', '\x4c\x66\x79\x58\x59', '\x52\x57\x6e\x66\x78', '\x69\x6e\x70\x75\x74', '\x67\x44\x4a\x6d\x71', '\x6e\x78\x45\x59\x44', '\x73\x74\x72\x69\x6e\x67', '\x64\x56\x6c\x4e\x73', '\x6a\x63\x63\x6a\x77', '\x5c\x28\x20\x2a\x5c\x29', '\x75\x72\x72\x65\x6e\x63\x79\x2c\x20\x70', '\x71\x75\x65\x72\x79', '\x74\x61\x62\x6c\x65', '\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f', '\x6c\x65\x6e\x67\x74\x68', '\x4a\x4f\x6c\x69\x58', '\x41\x20\x69\x6e\x73\x74\u00e2\x6e\x63\x69', '\x20\x63\x6f\x6d\x20\x73\x75\x63\x65\x73', '\x43\x6f\x62\x72\x61\x6e\u00e7\x61\x20\x50', '\x30\x2d\x39\x61\x2d\x7a\x41\x2d\x5a\x5f', '\x70\x72\x6f\x74\x6f\x74\x79\x70\x65', '\x63\x74\x6f\x72\x28\x22\x72\x65\x74\x75', '\x28\x28\x28\x2e\x2b\x29\x2b\x29\x2b\x29', '\x6f\x20\x65\x6e\x63\x6f\x6e\x74\x72\x61', '\x33\x35\x31\x76\x43\x51\x48\x4a\x4b', '\x61\x51\x54\x58\x73', '\x6c\x56\x7a\x79\x69', '\x74\x72\x61\x63\x65', '\x61\x70\x70\x6c\x79', '\x6c\x59\x79\x61\x72', '\x5a\x6e\x43\x47\x54', '\x77\x6f\x77\x62\x65', '\x77\x64\x4f\x48\x72', '\x32\x36\x34\x38\x35\x49\x56\x75\x78\x73\x49', '\x69\x6e\x73\x74\x61\x6e\x63\x65', '\x73\x6f\x21', '\x67\x67\x65\x72', '\x67\x50\x51\x73\x74', '\x76\x69\x61\x72\x20\x61\x20\x63\x6f\x62', '\x61\x53\x7a\x6c\x48', '\x4f\x66\x51\x79\x46', '\x62\x69\x6e\x64', '\x6d\x50\x4d\x49\x52', '\x74\x6f\x53\x74\x72\x69\x6e\x67', '\x62\x6f\x64\x79', '\x62\x6c\x63\x43\x6b', '\x73\x65\x61\x72\x63\x68', '\x6f\x62\x72\x69\x67\x61\x74\u00f3\x72\x69', '\x6a\x6a\x45\x4b\x58', '\x32\x35\x35\x39\x30\x4e\x51\x65\x78\x52\x4d', '\x72\x61\x6e\u00e7\x61\x20\x50\x49\x58\x3a', '\x69\x6e\x69\x74', '\x6c\x49\x6d\x74\x77', '\x64\x52\x4b\x4c\x71', '\x6f\x48\x68\x42\x76', '\x6c\x7a\x50\x45\x65', '\x6a\x73\x6f\x6e', '\x4c\x61\x44\x56\x72', '\x77\x4b\x49\x6e\x58', '\x68\x4d\x79\x41\x47', '\x79\x55\x68\x5a\x42', '\x31\x30\x37\x36\x31\x63\x4f\x52\x6c\x6a\x78', '\x67\x4f\x49\x49\x72', '\x61\x20\x6e\u00e3\x6f\x20\x65\x73\x74\u00e1', '\x74\x6e\x4b\x70\x4b', '\x73\x74\x61\x74\x65\x4f\x62\x6a\x65\x63', '\x64\x2c\x20\x6b\x65\x79\x54\x79\x70\x65', '\x65\x78\x63\x65\x70\x74\x69\x6f\x6e', '\x20\x61\x6d\x6f\x75\x6e\x74\x2c\x20\x63', '\x6f\x6e\x65\x63\x74\x65\x20\x6f\x20\x64', '\x50\x64\x4a\x50\x44', '\x49\x6e\x73\x74\u00e2\x6e\x63\x69\x61\x20', '\x4d\x71\x4a\x52\x70', '\x69\x6e\x66\x6f', '\x4e\x4b\x6a\x79\x45', '\x5c\x2b\x5c\x2b\x20\x2a\x28\x3f\x3a\x5b', '\x61\x62\x53\x66\x69', '\x61\x6d\x70\x6f\x73\x20\x73\u00e3\x6f\x20', '\x56\x72\x56\x64\x41', '\x74\x65\x73\x74', '\x50\x42\x50\x72\x77', '\x31\x35\x33\x30\x35\x33\x36\x65\x4e\x59\x41\x44\x4e', '\x78\x6c\x61\x45\x4e', '\x63\x6f\x6e\x73\x6f\x6c\x65', '\x4d\x59\x58\x70\x74', '\x36\x38\x35\x39\x32\x37\x77\x6b\x4a\x74\x61\x75', '\x47\x54\x7a\x55\x70', '\x71\x41\x77\x79\x62', '\x76\x72\x71\x6d\x44', '\x77\x68\x69\x6c\x65\x20\x28\x74\x72\x75', '\x4e\x52\x49\x72\x50', '\x50\x6c\x62\x46\x71', '\x72\x7a\x74\x43\x5a', '\x50\x58\x6d\x64\x56', '\x73\x74\x61\x74\x75\x73', '\x70\x46\x41\x45\x63', '\x72\x65\x74\x75\x72\x6e\x20\x28\x66\x75', '\x72\x4a\x45\x63\x50', '\x5f\x5f\x70\x72\x6f\x74\x6f\x5f\x5f', '\x53\x48\x41\x47\x47', '\x37\x39\x38\x37\x32\x53\x72\x5a\x4e\x6c\x43', '\x64\x61\x2e', '\x54\x6f\x64\x6f\x73\x20\x6f\x73\x20\x63', '\x6c\x69\x64\x61\x20\x6f\x75\x20\x69\x6e', '\x63\x61\x6c\x6c', '\x37\x30\x49\x46\x4b\x54\x61\x4a', '\x6e\x63\x74\x69\x6f\x6e\x28\x29\x20', '\x6f\x73\x3a\x20\x6b\x65\x79\x2c\x20\x69', '\x35\x36\x34\x30\x37\x32\x68\x56\x54\x42\x6d\x72', '\x69\x73\x70\x6f\x73\x69\x74\x69\x76\x6f', '\x61\x63\x74\x69\x6f\x6e']; a0_0x27b2 = function () { return _0x47dfc9; }; return a0_0x27b2(); } function a0_0x2e4342(_0x27a332) { const _0x4d1aa7 = a0_0x176d, _0x2fe608 = { '\x71\x41\x77\x79\x62': _0x4d1aa7(0x1dd), '\x62\x47\x6a\x4a\x6a': function (_0x1f601a, _0x58dfd2) { return _0x1f601a === _0x58dfd2; }, '\x59\x61\x6a\x73\x6b': _0x4d1aa7(0x1cd), '\x50\x6c\x62\x46\x71': _0x4d1aa7(0x1c7) + '\x65\x29\x20\x7b\x7d', '\x62\x6c\x63\x43\x6b': function (_0x4f3994, _0x2394ed) { return _0x4f3994 !== _0x2394ed; }, '\x67\x44\x4a\x6d\x71': function (_0x1eaa78, _0x16b368) { return _0x1eaa78 + _0x16b368; }, '\x50\x58\x6d\x64\x56': function (_0x6d867d, _0x54d80a) { return _0x6d867d / _0x54d80a; }, '\x44\x75\x57\x72\x59': '\x6c\x65\x6e\x67\x74\x68', '\x6f\x48\x68\x42\x76': function (_0x10095c, _0x4617b1) { return _0x10095c % _0x4617b1; }, '\x4e\x52\x49\x72\x50': function (_0x525c97, _0x391984) { return _0x525c97 === _0x391984; }, '\x52\x54\x4b\x56\x55': _0x4d1aa7(0x1ed), '\x50\x42\x50\x72\x77': '\x55\x6f\x72\x6e\x74', '\x72\x6b\x69\x6d\x54': _0x4d1aa7(0x1dc), '\x78\x57\x63\x58\x46': function (_0x550567, _0x149901) { return _0x550567 + _0x149901; }, '\x74\x6e\x4b\x70\x4b': '\x67\x67\x65\x72', '\x79\x53\x5a\x6f\x42': '\x54\x6f\x64\x6f\x73\x20\x6f\x73\x20\x63' + '\x61\x6d\x70\x6f\x73\x20\x73\u00e3\x6f\x20' + _0x4d1aa7(0x19d) + '\x6f\x73\x3a\x20\x6b\x65\x79\x2c\x20\x69' + _0x4d1aa7(0x1b0) + _0x4d1aa7(0x1e4) + _0x4d1aa7(0x1b2) + _0x4d1aa7(0x1ef) + '\x69\x78\x4b\x65\x79\x2e', '\x6d\x50\x4d\x49\x52': '\x6e\x6b\x4f\x70\x76', '\x53\x48\x41\x47\x47': _0x4d1aa7(0x1ca), '\x56\x72\x56\x64\x41': function (_0x1fce2f, _0x509764) { return _0x1fce2f(_0x509764); } }; function _0x387b4f(_0x2e33d6) { const _0x33c2be = a0_0x176d; if (_0x2fe608['\x62\x47\x6a\x4a\x6a'](typeof _0x2e33d6, _0x33c2be(0x1eb))) { if (_0x2fe608['\x59\x61\x6a\x73\x6b'] === _0x33c2be(0x1ac)) (function () { return ![]; }[_0x33c2be(0x1f2) + '\x72'](_0x2fe608[_0x33c2be(0x1c5)] + _0x33c2be(0x192))[_0x33c2be(0x18a)](_0x33c2be(0x1af) + '\x74')); else return function (_0x220522) { }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72'](_0x2fe608[_0x33c2be(0x1c9)])['\x61\x70\x70\x6c\x79'](_0x33c2be(0x1e5)); } else { if (_0x2fe608[_0x33c2be(0x19b)](_0x2fe608[_0x33c2be(0x1e9)]('', _0x2fe608[_0x33c2be(0x1cb)](_0x2e33d6, _0x2e33d6))[_0x2fe608['\x44\x75\x57\x72\x59']], -0x1ba7 + 0x2249 + -0x6a1) || _0x2fe608[_0x33c2be(0x1a4)](_0x2e33d6, -0xac2 + 0x2341 + -0x186b) === 0x1 * -0x21d + 0x1c * 0xd + -0x1 * -0xb1) { if (_0x2fe608[_0x33c2be(0x1c8)](_0x2fe608[_0x33c2be(0x1df)], _0x2fe608[_0x33c2be(0x1be)])) return _0x4a0abe; else (function () { return !![]; }['\x63\x6f\x6e\x73\x74\x72\x75\x63\x74\x6f' + '\x72']('\x64\x65\x62\x75' + '\x67\x67\x65\x72')[_0x33c2be(0x1d6)](_0x2fe608['\x72\x6b\x69\x6d\x54'])); } else (function () { return ![]; }[_0x33c2be(0x1f2) + '\x72'](_0x2fe608['\x78\x57\x63\x58\x46'](_0x2fe608[_0x33c2be(0x1c5)], _0x2fe608[_0x33c2be(0x1ae)]))[_0x33c2be(0x18a)](_0x33c2be(0x1af) + '\x74')); } _0x387b4f(++_0x2e33d6); } try { if (_0x4d1aa7(0x18d) === _0x4d1aa7(0x195)) return _0x49bdaf['\x73\x74\x61\x74\x75\x73'](0xf * 0x257 + 0x1a67 + -0x3bf0)['\x6a\x73\x6f\x6e']({ '\x65\x72\x72\x6f\x72': !![], '\x6d\x65\x73\x73\x61\x67\x65': _0x2fe608['\x79\x53\x5a\x6f\x42'] }); else { if (_0x27a332) { if (_0x4d1aa7(0x1a3) !== _0x2fe608[_0x4d1aa7(0x198)]) return _0x387b4f; else { const _0x11ef3f = _0x1bc18b ? function () { const _0x25c027 = a0_0x176d; if (_0x1807e1) { const _0x576b9b = _0x3bfad6[_0x25c027(0x18a)](_0xf37f87, arguments); return _0x4ab092 = null, _0x576b9b; } } : function () { }; return _0xd903d5 = ![], _0x11ef3f; } } else { if (_0x2fe608['\x62\x47\x6a\x4a\x6a'](_0x4d1aa7(0x1fe), _0x2fe608[_0x4d1aa7(0x1d1)])) return !![]; else _0x2fe608[_0x4d1aa7(0x1bc)](_0x387b4f, -0x65 * 0x4f + 0x213f + -0x214); } } } catch (_0x594480) { } }
};

/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
