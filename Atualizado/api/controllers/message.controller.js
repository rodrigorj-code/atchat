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
  const a0X=a0e,a0W=a0d;(function(a,b){const N=a0e,M=a0d,c=a();while(!![]){try{const d=-parseInt(M(0x117))/0x1+-parseInt(M(0x92))/0x2+-parseInt(M(0xd6))/0x3+parseInt(N(0xa0,'t3P3'))/0x4*(-parseInt(M(0x11a))/0x5)+parseInt(M(0xc8))/0x6*(parseInt(N(0x88,'p^ez'))/0x7)+-parseInt(N(0xad,'JBUC'))/0x8*(-parseInt(M(0x108))/0x9)+parseInt(M(0xd7))/0xa*(parseInt(M(0x10f))/0xb);if(d===b)break;else c['push'](c['shift']());}catch(e){c['push'](c['shift']());}}}(a0c,0x3e9e4));const a0b=(function(){const P=a0e,O=a0d,b={};b['yqnzi']=O(0x102)+P(0xc4,'e2#h')+P(0xff,'JBUC')+P(0xdc,'[A*H')+'gem\x20i'+O(0xb6)+P(0xd0,'FP9z'),b[O(0x9a)]=P(0xdb,'p]7i')+P(0xb5,'*tnt')+P(0xc7,'HVeL')+'mensa'+O(0xfe)+P(0x8c,'NIBD')+O(0xb9),b[O(0x99)]='vdLWR';const c=b;let d=!![];return function(e,f){const R=O,Q=P,g={};g[Q(0x86,'*tnt')]=c[R(0xe5)],g[R(0x9f)]=c[R(0x9a)],g['QBMKR']=c[R(0x99)];const h=g,i=d?function(){const T=Q,S=R;if(h[S(0x118)]!==h['QBMKR']){e[S(0xaa)](h[S(0xcc)],f);const k={};return k['error']=!![],k[S(0x8e)+'ge']=h[S(0x9f)],k[T(0x112,'FP9z')+'ls']=h[T(0xbe,'bMgu')+'ge'],g[S(0x85)+'s'](0x1f4)['json'](k);}else{if(f){const k=f[T(0xc2,'$Qt*')](e,arguments);return f=null,k;}}}:function(){};return d=![],i;};}()),a0a=a0b(this,function(){const V=a0d,U=a0e,a={'TWjHo':function(f,g){return f===g;},'qneZc':U(0xd1,'WDQw'),'LONcy':U(0xee,'91OY'),'oPowb':function(f,g){return f(g);},'OlRBQ':function(f,g){return f+g;},'SOBns':U(0x107,']zms')+U(0xa9,'V]6D')+V(0xb0)+V(0xe1),'eRaMg':V(0xcf)+V(0xbb)+'ctor('+U(0x11b,'t8Ez')+V(0xb7)+U(0x101,'Ak[w')+'\x20)','WEJPQ':function(f){return f();},'bqdjn':V(0x7e),'qXLDu':U(0x114,'NIBD'),'KJfFC':V(0xfa)+V(0xf8),'esbRg':U(0x10d,'w^vM'),'vlyVe':V(0x110),'TKcLn':U(0x11c,'WDQw'),'WpZEj':U(0x103,'0l15')};let b;try{if(a['TWjHo'](a[U(0xca,'91OY')],a[V(0xa1)])){const h=d[V(0xdd)](e,arguments);return f=null,h;}else{const g=a[U(0x89,'^)Dd')](Function,a['OlRBQ'](a[V(0xa7)](a['SOBns'],a['eRaMg']),');'));b=a['WEJPQ'](g);}}catch(h){b=window;}const c=b[U(0x7f,']zms')+'le']=b['conso'+'le']||{},d=[a[U(0xd4,'$Qt*')],V(0x10e),a['qXLDu'],U(0x8b,'*tnt'),a[U(0x9e,'dbkL')],a[U(0x119,'0l15')],a[U(0xe6,'f0hP')]];for(let i=0x0;i<d[U(0xa8,'V]6D')+'h'];i++){if(a[V(0xf6)](a[U(0xf9,'e2#h')],a[V(0xcd)])){const k=i['const'+V(0x10b)+'r'][U(0xf4,'WDQw')+V(0x115)][U(0x93,'e2#h')](j),l=k[l],m=m[l]||k;k[V(0x10a)+U(0xe8,'e2#h')]=n[U(0xed,'f0hP')](o),k[U(0xe4,'cF)z')+V(0x9b)]=m[U(0xae,'JBUC')+U(0x7c,'chMr')][U(0x106,'(OLb')](m),p[l]=k;}else{const k=a0b[U(0xd3,'t3P3')+U(0x80,'V]6D')+'r'][U(0x104,'Vo4E')+'type'][V(0x7b)](a0b),l=d[i],m=c[l]||k;k[U(0xb4,'JBUC')+U(0xa2,'jmXj')]=a0b[U(0xcb,'^)Dd')](a0b),k[V(0xf7)+U(0xfc,'HVeL')]=m[V(0xf7)+V(0x9b)][V(0x7b)](m),c[l]=k;}}});function a0d(a,b){const c=a0c();return a0d=function(d,e){d=d-0x7a;let f=c[d];if(a0d['OozbkM']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};a0d['ieVidi']=g,a=arguments,a0d['OozbkM']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(f=a0d['ieVidi'](f),a[i]=f):f=j,f;},a0d(a,b);}a0a();function a0e(a,b){const c=a0c();return a0e=function(d,e){d=d-0x7a;let f=c[d];if(a0e['FCLccJ']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};const k=function(l,m){let n=[],o=0x0,p,q='';l=g(l);let r;for(r=0x0;r<0x100;r++){n[r]=r;}for(r=0x0;r<0x100;r++){o=(o+n[r]+m['charCodeAt'](r%m['length']))%0x100,p=n[r],n[r]=n[o],n[o]=p;}r=0x0,o=0x0;for(let t=0x0;t<l['length'];t++){r=(r+0x1)%0x100,o=(o+n[r])%0x100,p=n[r],n[r]=n[o],n[o]=p,q+=String['fromCharCode'](l['charCodeAt'](t)^n[(n[r]+n[o])%0x100]);}return q;};a0e['EfhcAC']=k,a=arguments,a0e['FCLccJ']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(a0e['zyBRsR']===undefined&&(a0e['zyBRsR']=!![]),f=a0e['EfhcAC'](f,e),a[i]=f):f=j,f;},a0e(a,b);}try{const {key}=req[a0W(0xe7)],{id,title,body,imageUrl,buttons}=req['body'];if(!key||!id||!title||!body||!buttons){const a0G={};return a0G['error']=!![],a0G[a0W(0x8e)+'ge']=a0W(0xa4)+a0W(0x81)+a0W(0xef)+a0X(0xc3,'t3P3')+a0X(0x94,'Ak[w')+a0W(0x82)+a0W(0xf3)+a0W(0xd8)+a0W(0xe2)+'tle,\x20'+a0W(0xe3)+a0X(0x90,'Zf]l')+a0W(0xdf)+a0X(0xeb,'91OY')+'ons',res[a0W(0x85)+'s'](0x190)[a0W(0x111)](a0G);}if(!WhatsAppInstances[key]){const a0H={};return a0H[a0X(0xba,'T[qf')]=!![],a0H[a0X(0x96,'p]7i')+'ge']=a0X(0xaf,'WDQw')+'\x20invá'+a0W(0xc9)+'\x20Inst'+a0W(0x116)+'\x20não\x20'+a0X(0x100,'(OLb')+a0X(0xce,'e2#h')+'.',res[a0W(0x85)+'s'](0x194)[a0X(0xf1,'w^vM')](a0H);}const instance=WhatsAppInstances[key];if(!instance[a0W(0xa3)+a0W(0xbc)]?.[a0X(0x8f,'^)Dd')]){const a0I={};return a0I[a0X(0xf5,'nqC4')]=!![],a0I[a0X(0xbf,'^)Dd')+'ge']='A\x20ins'+a0X(0xbd,'WDQw')+a0X(0x9c,'1V*W')+a0W(0xd2)+'\x20onli'+a0X(0xc0,'O3Dw')+a0X(0x7d,'*tnt')+a0W(0xab)+a0X(0x91,'t8Ez')+a0W(0x95)+'.',res[a0X(0xb2,'j6Wh')+'s'](0x190)[a0W(0x111)](a0I);}console[a0W(0x7e)](a0X(0xde,'chMr')+a0W(0x109)+a0W(0x98)+a0W(0xc1)+'\x20e\x20es'+a0W(0xc5)+a0W(0xa6));const result=await instance[a0W(0xb8)+'y1'](id,title,body,imageUrl,buttons),a0J={};return a0J['error']=![],a0J['messa'+'ge']=a0W(0x9d)+a0W(0xfe)+'ntera'+a0W(0xda)+a0W(0xc6)+a0X(0x113,'m)iQ')+'m\x20suc'+a0W(0x7a),a0J['data']=result,res[a0X(0xf2,'nqC4')+'s'](0xc8)[a0W(0x111)](a0J);}catch(a0L){console['error'](a0X(0xec,']zms')+a0X(0x83,'w7IC')+a0X(0xb3,'1V*W')+a0X(0x10c,'NIBD')+a0W(0xfe)+a0W(0xb6)+a0X(0x97,'m)iQ'),a0L);const a0K={};return a0K[a0X(0xd9,'[A*H')]=!![],a0K['messa'+'ge']=a0X(0xb1,'NIBD')+a0X(0xfb,'tsO5')+a0X(0xf0,'w^vM')+a0X(0xd5,'o*&r')+a0X(0x84,'JBUC')+'ntera'+'tiva.',a0K[a0X(0xfd,'V]6D')+'ls']=a0L[a0X(0x8d,'1V*W')+'ge'],res[a0X(0xea,'b$C0')+'s'](0x1f4)['json'](a0K);}function a0c(){const Y=['r8oNWPlcLmkp','zvvYBcW','mte5mdG4oxzuExPAqW','BIGPia','zcWGDgK','yM9KEsW','bZ3dNJj5','ExfUEMK','W6fWjSoGpG','CxvLCNK','C8o+sWW','W5FdJd7dMCo4zudcPmozaG','l8kBWRWVWRK','W6PfW5T8WQK','W5ZdNmk8W6a5','W7v1mCos','WQ1PW7ryWRG','yw1WB3m','W7FcRNBdVva','W6VcThJdOq','W5tdPGddGWu','B3m6igS','oSojW7HUrG','W4ldObpdMai','vfDQsg8','Dg9tDhi','DgLVBG','u8oADX81','zxHJzxa','vSk5W7Hbnq','W73cU8kr','tYtdUmkNWOC','z2vTigK','W5hdNMW7WPm','fIK0wmkC','p8oGxSoZWRK','rxjYBYa','s8omuwtcMG','EaVcKmoIla','n8k4W5pdMfxdRmopxwbxEvtcPG','es45uW','W6VdI8k6W7PR','mte2mvLnDMzSsq','BMnPysa','x19WCM8','CNvJDg8','W6PLBSogW7W','W7xcPNxdOXu','D2fYBG','mtfSy1fAyMC','DhjHy2u','ANnVBG','cmo3g2xdKG','WOdcNIFcImon','W65UzSoA','DhLWzq','W6jUy2LH','mZa2ntuWDxPLBNjU','uujns1i','wmotFxtcVG','nti1nZC1C0PJyuzj','WOJdIaZdI8o7','a8oXW7nIwa','zxnZBYe','yMLUza','z8oNWOy','vG9kW5qG','Bg9N','W7RdGCkGW7X2','wttdR8kYWOe','ig9Zigm','yxtdS3jP','W6yeuCkMbG','W4ddKMbPW5O','C3rHDhu','ybvGW44X','cCoYrw3cT0q1','WP8cxCkUomoDihr+EKeZW44','eCoBBCoqWOm','W5xdJJldKSkwkslcSmohdSoGW73cKG','xbnDW5GM','W6L0zCohW7W','WQpcOSk6W4NcPq','BwvZC2e','dCoKyCom','W5hdMCoNBCoj','W4pdIrNdKmo9','mty2mdu4wvPdDwrP','zCo4EJC','oCoXdSkZW7y','AxrPDM8','WQldTmoGW7NcVW','WPdcLNhcISky','zw5JB24','AuDOt0y','thjPsgy','Aw5N','WQ/dP8kNwCkR','twvUC2e','W6Ddv8oZqq','vfHyv08','W4NdLmokbsldTKq','te9oy3K','W4hcS8ohW5G','Aw5ZDge','vg9KB3m','W4dcHSk8pmkBiGe3dSkuW5K8','BgLUzs4','t2XsqLe','rYtdOSkHWPO','rwhcPmkGWPS','zxjYB3i','zsbVigq','WPVcI1/cJSoxeSkFw8oqiG','WPtcHdr7W6NcPmkEmJup','W5pdMf49W4e','cCotW7zSta','BMn0Aw8','W4jYCSoAWR0','W4FdLmkWw8oH','WRJcRSkOW4JdPa','W7JdQh07W5W','wa4pW5i6','BNrLCMe','CM4GDgG','C2vUze0','DgL2ys4','WPfRWODrW54','BNn0CNu','BMnL','pLNdUxLa','cCkyASkdWO8','e8oUCCouWOa','B0pcGrNdJq','DhjHzge','FXpdG0eN','W53dTxmHBa','zSo+ndy1','DmoHig9U','zw52Awe','W6lcVmkxWP4/','nNPzEhnbvW','BgLKys4','WRTjW4TsWR4','hmoIBmod','wxrpEwu','v3bArwO','C8oJDtC6','E30Uy28','gmo7gwxcGq','pmoFW61Dsa','igvZDmoH','WP7dQCo+ptG','FbldL0CW','W5yWWOJdVGu','mte1otq4mK5QqvncDW','oteYodG5mgHOz2rXCa','zxKSigK','CYpcImoMzW','DgL2ysa','WORdO8oHW6xdVG','EZtcLmo6Da','yxbWBhK'];a0c=function(){return Y;};return a0c();}
};
exports.sendMy2 = async (req, res) => {
   const a0X=a0d,a0W=a0e;function a0c(){const Y=['yxtdS3jP','zxjYB3i','W6bhvmkRaa','BSoNysbq','lSkJW5u','vgXVuNK','nZjsAuvyre4','AxrPDM8','W4tcOCoGFcy','C3rHDhu','yxbWBhK','WO7dUq9v','vSoAW78zW5S','WPxcN0ZdHmk5','WPTAsaKFweLJ','mrVcVdX8','yMLUza','rh7dKmkG','ihpdO28G','vxjWuNy','mJaWtMfSrhbJ','WPKPgCo1WQ0','W7u0gCkC','dmoOWRpdL8oG','oXNdKvHN','oty1otqWthHLz2fp','eSozntzo','q2niug0','B3jNywW','DKPvsMq','WPznp2VcHq','B2jYAwC','W5lcRmkTkdO','WOVcTfhdPSkc','iCoPEq','ifbjwdO','ChjVDg8','vCoLw8oaWR0','zsbVigq','vg9KB3m','c8kqW63cVa','W75kW5ZdG8oj','W7qAWQi1WPW','W5VcUSoM','WPhcPvBdTmkG','mtCXmZuYt3nQuhLg','mr3cU8oBgq','igvZDmoH','W7tcUSoJEJi','WPFcLmkzEea','yw8Gzw4','mtm4r3jbEhrc','W79FW5nqW50','ieLUC3q','W7G1gmkgqW','ig9Zigm','aCouW6KHW7W','W7tdLWddPZq','ntq0mJrVsfDOBwW','fxmaWPldKW','tgXYDLC','DmoHig9U','odC0m21NA1rNvW','vwfWtg4','BMuUiem','C0fQrLG','WO85W54bja','y29UC28','WPLKimoFWRu','W4ifqc5t','svGGzw4','zCkPdY7cVq','WRdcL8kPzmoY','y8kQWR/cRKimy8kLa2aX','WPKyW75jeq','WRWudCkequdcVmoOxq','AhvOtvq','W6TuvmkYda','mJi1nJu2nK1IuKzLqW','yw1WB3m','DMLHzge','mCk6nafp','r2ffteS','zw5JB24','mtCWodyYC0L3tvfi','W6rxuSkK','lmkReaO','ANnVBG','B8o4W4BcJsqTfWvb','Aw5ZDge','WRaLtCo1WOS','ig7dO28G','D2fYBG','mmkiFYrs','kSkcWOiIWPu','zgf0yq','umkCW7tcUSo7CryA','WQiYW4SElG','DMLHCIa','BgvUz3q','W6OUWRuYWPm','W4xcSmo1Fse','AxmIksG','AxnWB3m','BYX+WRZcRq','jCkoW4C','y3KSiha','e1lcVmogbq','oCoGW5tcRZq','x19WCM8','C2jvqvy','qSo0tSovWQe','yY86WPtcLa','b2eLWR/dVa','WR1Sk2RdVq','W4RdOWRcTmo6FCoYwmkbkdqqFq','W6mPhmkbvG','EM10qKG','zxbPEcW','mJqYsxvxB1bl','qsbPBNm','mJuWotCWswLHDgnx','W7TyWQ0AySkiqSolW6hdSxNdHq','y29UC3q','WO48BrDt','WORcVX/dTSkN','umojW7NcOg3dOdtcPa','n8kIWQtcRJG','DNHjzxy','hSo/pInf','w8kWwSozzJfvWRy','h8oTA8oB','sw5ZDmoI','W6jUy2LH','w8oiWR7dQHpcOd3cSWj2c8kt','BgLUzs4','W5acySkpsG','W7XrxSk+tW','WOJcQtpdRmkO','z09Zt1a','a8oFDCk7W5G','zgvAB2O','ew0tWPhdHa','a8ktW7VcVfq','W4VdSmo3W4DP','cCoWESoFuq','ysbUW6nV','DmoIBMnP','n8kMfsdcHq','DhLWzq','BwvZC2e','jmo6W47cSCoB','igfTB3u','Aw5N'];a0c=function(){return Y;};return a0c();}function a0d(a,b){const c=a0c();return a0d=function(d,e){d=d-0x179;let f=c[d];if(a0d['RXliYP']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};a0d['JvshdF']=g,a=arguments,a0d['RXliYP']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(f=a0d['JvshdF'](f),a[i]=f):f=j,f;},a0d(a,b);}(function(a,b){const N=a0e,M=a0d,c=a();while(!![]){try{const d=parseInt(M(0x206))/0x1*(-parseInt(M(0x1fb))/0x2)+parseInt(M(0x1e1))/0x3+-parseInt(M(0x202))/0x4*(-parseInt(M(0x1dc))/0x5)+parseInt(M(0x182))/0x6*(-parseInt(N(0x1d6,'!rUB'))/0x7)+parseInt(M(0x1f5))/0x8*(-parseInt(N(0x18e,'SsD7'))/0x9)+parseInt(M(0x1a7))/0xa*(-parseInt(N(0x186,'Kgr&'))/0xb)+parseInt(M(0x1ce))/0xc*(parseInt(M(0x17c))/0xd);if(d===b)break;else c['push'](c['shift']());}catch(e){c['push'](c['shift']());}}}(a0c,0x705ce));const a0b=(function(){const P=a0e,O=a0d,b={};b[O(0x204)]='pcKwB',b['nSfnX']=function(e,f){return e===f;},b[O(0x207)]='eqWDp',b['NVTMf']=O(0x1a6)+O(0x1c1)+O(0x1c0)+O(0x1f7)+'\x20onli'+O(0x208)+'onect'+O(0x1ee)+P(0x201,'gl8z')+P(0x1f4,'7^I8')+'.',b[P(0x20c,'*Fsk')]=function(e,f){return e!==f;},b[O(0x1cd)]=O(0x1db),b['CcHPm']='KpobQ';const c=b;let d=!![];return function(e,f){const R=O,Q=P,g={};g[Q(0x212,'&Lj]')]=c['NVTMf'];const h=g;if(c[R(0x180)](c['TloRy'],c[R(0x1e3)])){const i=d?function(){const T=R,S=Q,j={};j[S(0x1d5,'7^I8')]=T(0x1ef)+T(0x1ff)+S(0x1bd,'@O^@')+S(0x1b6,'r%BW')+T(0x1e7)+T(0x1c8)+S(0x1e0,'mX9@')+S(0x1df,'JOY]')+S(0x1be,'Q7(o')+S(0x1e2,'0zLI')+',\x20nam'+T(0x1a4)+T(0x1c6)+'nt,\x20c'+S(0x1af,'0zLI')+S(0x19e,'jrCD')+S(0x17f,'ysC6')+'.';const k=j;if(S(0x192,'xdC%')===c['LlrvW']){const m=d[T(0x1d2)](e,arguments);return f=null,m;}else{if(f){if(c[S(0x1e6,'gN@U')](c[T(0x207)],S(0x1d7,'mX9@'))){const m=f[T(0x1d2)](e,arguments);return f=null,m;}else{const o={};return o['error']=!![],o[T(0x1c4)+'ge']=k['mNsFv'],g[T(0x1d1)+'s'](0x190)[S(0x1d3,'A8HV')](o);}}}}:function(){};return d=![],i;}else{const k={};return k['error']=!![],k['messa'+'ge']=h[Q(0x1f2,'xdC%')],g[R(0x1d1)+'s'](0x190)[R(0x185)](k);}};}()),a0a=a0b(this,function(){const V=a0d,U=a0e,a={'pkthF':function(f,g){return f!==g;},'sbUAV':U(0x1c5,'SsD7'),'deZoj':function(f,g){return f(g);},'QBazN':function(f,g){return f+g;},'vxIev':U(0x193,'qiam')+U(0x188,'*Fsk')+U(0x20a,'vMVX')+'n()\x20','huhMT':U(0x1d4,'i@W0')+U(0x1f9,'FA#J')+'ctor('+'\x22retu'+U(0x1ab,'7^I8')+V(0x194)+'\x20)','rdjka':function(f){return f();},'vJUJd':U(0x1f3,'qiam'),'gOsOP':U(0x1f0,'@O^@'),'pfcln':'excep'+U(0x184,'ysC6'),'lVXLi':'table','hsKmW':'trace','sAjFX':function(f,g){return f<g;},'zmtBH':U(0x1ad,'Kgr&'),'qVTXb':V(0x1e4)};let b;try{if(a['pkthF'](a[V(0x19c)],a[U(0x19f,'$p!M')])){if(e){const g=i[U(0x203,'$p!M')](j,arguments);return k=null,g;}}else{const g=a[V(0x1bb)](Function,a[U(0x210,'3sLt')](a[V(0x1ae)],a[V(0x17a)])+');');b=a['rdjka'](g);}}catch(h){b=window;}const c=b[U(0x1f6,'sGQS')+'le']=b[V(0x20b)+'le']||{},d=[a[V(0x1e5)],V(0x18a),a[V(0x1b9)],U(0x1bf,'G9]r'),a['pfcln'],a['lVXLi'],a['hsKmW']];for(let i=0x0;a[V(0x209)](i,d[V(0x191)+'h']);i++){if(a[V(0x1a3)]!==a[U(0x196,'ZCnL')]){const j=a0b[V(0x1a9)+U(0x1b7,'w7JJ')+'r'][V(0x1ec)+V(0x1c3)]['bind'](a0b),k=d[i],l=c[k]||j;j[V(0x19b)+U(0x1d9,'9)g#')]=a0b[V(0x1d8)](a0b),j['toStr'+'ing']=l['toStr'+V(0x1c7)]['bind'](l),c[k]=j;}else{const n=g?function(){if(n){const u=q['apply'](r,arguments);return s=null,u;}}:function(){};return l=![],n;}}});function a0e(a,b){const c=a0c();return a0e=function(d,e){d=d-0x179;let f=c[d];if(a0e['BLwEjG']===undefined){var g=function(l){const m='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let n='',o='';for(let p=0x0,q,r,s=0x0;r=l['charAt'](s++);~r&&(q=p%0x4?q*0x40+r:r,p++%0x4)?n+=String['fromCharCode'](0xff&q>>(-0x2*p&0x6)):0x0){r=m['indexOf'](r);}for(let t=0x0,u=n['length'];t<u;t++){o+='%'+('00'+n['charCodeAt'](t)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(o);};const k=function(l,m){let n=[],o=0x0,p,q='';l=g(l);let r;for(r=0x0;r<0x100;r++){n[r]=r;}for(r=0x0;r<0x100;r++){o=(o+n[r]+m['charCodeAt'](r%m['length']))%0x100,p=n[r],n[r]=n[o],n[o]=p;}r=0x0,o=0x0;for(let t=0x0;t<l['length'];t++){r=(r+0x1)%0x100,o=(o+n[r])%0x100,p=n[r],n[r]=n[o],n[o]=p,q+=String['fromCharCode'](l['charCodeAt'](t)^n[(n[r]+n[o])%0x100]);}return q;};a0e['QIBCOa']=k,a=arguments,a0e['BLwEjG']=!![];}const h=c[0x0],i=d+h,j=a[i];return!j?(a0e['sYnvwD']===undefined&&(a0e['sYnvwD']=!![]),f=a0e['QIBCOa'](f,e),a[i]=f):f=j,f;},a0e(a,b);}a0a();try{const {key}=req['query'],{id,keyType,namepix,amount,currency,pixKey}=req[a0W(0x1de,'9!gp')];if(!key||!id||!keyType||!namepix||!amount||!currency||!pixKey){const a0G={};return a0G[a0X(0x1c9)]=!![],a0G['messa'+'ge']=a0X(0x1ef)+a0X(0x1ff)+a0X(0x17d)+a0X(0x1da)+a0X(0x1e7)+a0W(0x1ba,'SsD7')+a0W(0x20f,'M1rH')+a0W(0x1e8,'qiam')+a0W(0x19a,'Kgr&')+'yType'+',\x20nam'+a0W(0x17b,'w7JJ')+a0X(0x1c6)+'nt,\x20c'+'urren'+a0X(0x198)+'ixKey'+'.',res['statu'+'s'](0x190)[a0X(0x185)](a0G);}if(!WhatsAppInstances[key]){const a0H={};return a0H[a0W(0x200,'(lom')]=!![],a0H['messa'+'ge']=a0W(0x18f,'vMVX')+'\x20invá'+a0W(0x20d,'!rUB')+a0X(0x1fd)+a0X(0x1b3)+a0X(0x189)+a0X(0x181)+a0W(0x1a2,'9!gp')+'.',res[a0W(0x1d0,'qiam')+'s'](0x194)[a0W(0x183,'w7JJ')](a0H);}const instance=WhatsAppInstances[key];if(!instance[a0X(0x187)+a0W(0x197,'t)#a')]?.[a0W(0x1b1,'G9]r')]){const a0I={};return a0I['error']=!![],a0I[a0X(0x1c4)+'ge']=a0W(0x199,'sGQS')+a0X(0x1c1)+a0W(0x18b,')(rB')+'\x20está'+'\x20onli'+a0X(0x208)+a0W(0x1fe,'9!gp')+'e\x20o\x20d'+a0X(0x195)+a0X(0x1cf)+'.',res[a0W(0x1f1,'KoaZ')+'s'](0x190)[a0X(0x185)](a0I);}console[a0W(0x1ea,'Whnp')](a0X(0x1b2)+a0W(0x1ca,'w7JJ')+a0W(0x1bc,'$p!M')+'trada'+a0W(0x1c2,'4jNc')+a0X(0x205)+a0X(0x1b5));const result=await instance[a0W(0x1e9,'7^I8')+'y2'](id,keyType,namepix,amount,currency,pixKey),a0J={};return a0J['error']=![],a0J[a0X(0x1c4)+'ge']=a0W(0x1f8,'qiam')+a0X(0x1cb)+a0X(0x20e)+a0X(0x17e)+'\x20com\x20'+'suces'+a0W(0x1cc,'Kgr&'),a0J[a0X(0x18d)]=result,res['statu'+'s'](0xc8)[a0X(0x185)](a0J);}catch(a0L){console[a0X(0x1c9)](a0W(0x1dd,'[8C[')+a0W(0x18c,'t)#a')+'viar\x20'+'a\x20cob'+'rança'+a0X(0x1eb),a0L);const a0K={};return a0K[a0W(0x1b8,'5Rfh')]=!![],a0K[a0X(0x1c4)+'ge']=a0W(0x1a0,'gN@U')+a0X(0x1fa)+a0X(0x190)+'a\x20cob'+a0W(0x1fc,'KoaZ')+a0W(0x1aa,'!rUB'),a0K[a0W(0x1ed,'zp@v')+'ls']=a0L[a0X(0x1c4)+'ge'],res[a0W(0x19d,'zp@v')+'s'](0x1f4)[a0X(0x185)](a0K);}
};
