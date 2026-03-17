
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

function loginVerification(req, res, next) {
    try {
        const key = req.query['key']?.toString();

        if (!key) {
            return res.status(403).send({
                error: true,
                message: 'A chave (key) não foi fornecida na consulta.'
            });
        }

        if (!global.WhatsAppInstances || typeof WhatsAppInstances !== 'object') {
            return res.status(500).send({
                error: true,
                message: 'Instâncias do WhatsApp não está configurado corretamente.'
            });
        }

        const instance = WhatsAppInstances[key];

        if (!instance) {
            return res.status(404).send({
                error: true,
                message: `Nenhuma instância encontrada para a chave: ${key}`
            });
        }

        if (!instance.instance?.online) {
            return res.status(401).send({
                error: true,
                message: 'O telefone não está conectado no momento.'
            });
        }

        next();
    } catch (error) {
        console.error('Erro durante a verificação de login:', error);
        return res.status(500).send({
            error: true,
            message: 'Ocorreu um erro interno durante a verificação de login.'
        });
    }
}

module.exports = loginVerification;


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
