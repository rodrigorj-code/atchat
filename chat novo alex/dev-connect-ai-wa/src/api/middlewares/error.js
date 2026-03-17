
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

/* eslint-disable no-unused-vars */
const APIError = require('../../api/errors/api.error')

const handler = (err, req, res, next) => {
    const statusCode = err.statusCode ? err.statusCode : 500

    res.setHeader('Content-Type', 'application/json')
    res.status(statusCode)
    res.json({
        error: true,
        code: statusCode,
        message: err.message,
    })
}

exports.handler = handler

exports.notFound = (req, res, next) => {
    const err = new APIError({
        message: 'Not found',
        status: 404,
    })
    return handler(err, req, res)
}


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
