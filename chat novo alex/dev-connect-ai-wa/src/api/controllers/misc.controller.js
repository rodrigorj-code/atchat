
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

exports.onWhatsapp = async (req, res) => {
    try {
        const { key } = req.query;
        const { id } = req.body;

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

        const data = await instance.verifyId(instance.getWhatsAppId(id));



        return res.status(201).json({
            error: false,
            data
        });
    } catch (error) {
        console.error('Erro ao verificar ID no WhatsApp:', error);

        return res.status(500).json({
            error: true,
            message: 'Ocorreu um erro ao verificar o ID no WhatsApp.'
        });
    }
};


exports.downProfile = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.DownloadProfile(
        req.body.id
    )
    return res.status(201).json({ error: false, data: data })
}

exports.getStatus = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.getUserStatus(
        req.body.id
    )
    return res.status(201).json({ error: false, data: data })
}
exports.contacts = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.contacts(
        req.query.key
    )
    return res.status(201).json({ data })
}
exports.mystatus = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.mystatus(
        req.body.status
    )
    return res.status(201).json({ data })
}
exports.chats = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.chats(
        req.body.id
    )
    return res.status(201).json({ error: false, data: data })
}

exports.blockUser = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key]?.blockUnblock(
        req.body.id,
        req.body.block_status
    )
    if (req.query.block_status == 'block') {
        return res
            .status(201)
            .json({ error: false, message: 'Contact Blocked' })
    } else
        return res
            .status(201)
            .json({ error: false, message: 'Contact Unblocked' })
}

exports.updateProfilePicture = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].updateProfilePicture(
        req.body.id,
        req.body.url,
        req.body.type
    )
    return res.status(201).json({ error: false, data: data })
}

exports.getUserOrGroupById = async (req, res) => {
    const data = await WhatsAppInstances[req.query.key].getUserOrGroupById(
        req.body.id
    )
    return res.status(201).json({ error: false, data: data })
}


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
