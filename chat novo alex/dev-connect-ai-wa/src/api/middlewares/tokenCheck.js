
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

const config = require('../../config/config')

function tokenVerification(req, res, next) {
    const bearer = req.headers.authorization
    const token = bearer?.slice(7)?.toString()

    if (!token) {
        return res.status(403).send({
            error: true,
            message: 'Acesso negado: token de autenticação ausente no cabeçalho "Authorization".',
        })
    }

    if (config.token !== token) {
        return res
            .status(403)
            .send({ error: true, message: 'Acesso negado: token de autenticação inválido' })
    }
    next()
}

module.exports = tokenVerification


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
