
/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Este arquivo é propriedade da DevConnectAi e está protegido pelas
   leis de copyright. Alterações devem ser feitas com cautela.
   =================================================================== */

const express = require('express')
const router = express.Router()
const instanceRoutes = require('./instance.route')
const messageRoutes = require('./message.route')
const miscRoutes = require('./misc.route')
const groupRoutes = require('./group.route')

router.get('/status', (req, res) => res.send('OK'))
router.use('/instance', instanceRoutes)
router.use('/message', messageRoutes) 
router.use('/group', groupRoutes)
router.use('/misc', miscRoutes)

module.exports = router


/* ===================================================================
   TODOS OS DIREITOS RESERVADOS A DevConnectAi.
   Contato: WhatsApp 55 51 9957-9150.
   Obrigado por usar os serviços da DevConnectAi.
   =================================================================== */
