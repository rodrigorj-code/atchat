
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

function keyVerification(req, res, next) {
    try {

        const key = req.query['key']?.toString();

        if (!key) {
            return res.status(403).send({
                error: true,
                message: 'Nenhuma chave foi fornecida na consulta.'
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
            return res.status(403).send({
                error: true,
                message: `Chave inválida fornecida: ${key}`
            });
        }

        next();
    } catch (error) {
        console.error('Erro durante a verificação da chave:', error);
        return res.status(500).send({
            error: true,
            message: 'Erro interno ao verificar a chave.'
        });
    }
}

module.exports = keyVerification;


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
