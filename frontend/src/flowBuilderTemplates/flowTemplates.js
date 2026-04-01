/**
 * Templates prontos de fluxo (V1) — estrutura compatível com nodes/connections atuais.
 * IDs de fila, lista, atendente e telefone de notificação são placeholders: o usuário deve ajustar no editor.
 */

export const TEMPLATE_META = [
  {
    id: "comercial",
    name: "Atendimento Comercial",
    shortDescription:
      "Boas-vindas, menu com opções, captura de nome, direcionamento à vendas e opção de atendente humano.",
    suggestedFlowName: "Comercial — template",
    setupHints: [
      "Nó Setor: escolha a fila de vendas (ou equivalente) em todos os caminhos que terminam em setor.",
      "Nó Atendente: selecione o usuário para a opção “Falar com um atendente”.",
      "Revise as mensagens e o menu; a captura de nome usa a variável {{nome_cliente}}.",
    ],
  },
  {
    id: "financeiro",
    name: "Financeiro",
    shortDescription:
      "Boas-vindas, menu (boleto, pagamento, suporte), alerta interno e transferência para o setor financeiro.",
    suggestedFlowName: "Financeiro — template",
    setupHints: [
      "Nós Notificação: altere o telefone para o número interno (WhatsApp) que deve receber os alertas.",
      "Nó Setor: vincule à fila do financeiro.",
      "Ajuste os textos das notificações conforme o protocolo da sua empresa.",
    ],
  },
  {
    id: "suporte",
    name: "Suporte",
    shortDescription:
      "Boas-vindas, menu de suporte, coleta da descrição do problema e transferência para o setor de suporte.",
    suggestedFlowName: "Suporte — template",
    setupHints: [
      "Nó Setor: escolha a fila de suporte técnico.",
      "A pergunta grava a variável {{descricao_problema}} — use nas mensagens internas se precisar.",
      "As três opções do menu levam ao mesmo fluxo de descrição; personalize se quiser separar filas.",
    ],
  },
  {
    id: "captacao_lead",
    name: "Captação de Lead",
    shortDescription:
      "Pergunta nome e interesse, variáveis no fluxo, FlowUp para lista de leads e mensagem final.",
    suggestedFlowName: "Leads — template",
    setupHints: [
      "Nó FlowUp: selecione a lista de contatos (remarketing/leads) onde os contatos serão incluídos.",
      "Variáveis {{lead_nome}} e {{lead_interesse}} aparecem na mensagem final — confira os textos das perguntas.",
      "Garanta que as chaves das perguntas não entrem em conflito com outras do fluxo.",
    ],
  },
  {
    id: "remarketing",
    name: "Reativação / Remarketing",
    shortDescription:
      "Mensagem inicial, condição simples, FlowUp ou notificação e opção de menu para atendimento.",
    suggestedFlowName: "Remarketing — template",
    setupHints: [
      "Nó FlowUp: configure a lista de remarketing; nó Notificação: telefone interno para alertas.",
      "Nó Atendente: escolha o usuário para quem vai a opção de atendimento humano.",
      "A condição usa “primeira interação”: ajuste as regras se quiser outro critério (ex.: variável de campanha).",
    ],
  },
];

function randomId(len = 30) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i += 1) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return s;
}

function edge(id, source, target, sourceHandle = "a") {
  return {
    id,
    source,
    target,
    sourceHandle,
    type: "buttonedge",
  };
}

function pos(x, y) {
  return { x, y };
}

/** Placeholders exibidos no card — usuário configura nos modais. */
const PLACEHOLDER = {
  queue: { id: 0, name: "— Configurar fila —" },
  user: { id: 0, name: "— Configurar atendente —" },
  list: { id: 0, name: "— Configurar lista —" },
  phoneNotify: "5511999999999",
};

function buildComercial() {
  const msgWelcome = randomId();
  const menu = randomId();
  const qNome = randomId();
  const wait1 = randomId();
  const msgVendas = randomId();
  const msgOrc = randomId();
  const sector = randomId();
  const att = randomId();

  const nodes = [
    {
      id: "1",
      type: "start",
      position: pos(80, 120),
      data: { label: "Inicio do fluxo" },
    },
    {
      id: msgWelcome,
      type: "message",
      position: pos(360, 120),
      data: {
        label:
          "Olá! Bem-vindo(a) ao nosso atendimento comercial. Escolha uma opção no menu abaixo.",
      },
    },
    {
      id: menu,
      type: "menu",
      position: pos(640, 120),
      data: {
        message: "Digite o número da opção desejada:",
        arrayOption: [
          { number: 1, value: "Vendas e orçamentos" },
          { number: 2, value: "Informações rápidas" },
          { number: 3, value: "Falar com um atendente" },
        ],
      },
    },
    {
      id: qNome,
      type: "question",
      position: pos(920, 40),
      data: {
        typebotIntegration: {
          message: "Para continuar, qual é o seu nome?",
          answerKey: "nome_cliente",
        },
      },
    },
    {
      id: wait1,
      type: "waitForInteraction",
      position: pos(1200, 40),
      data: {},
    },
    {
      id: msgVendas,
      type: "message",
      position: pos(1480, 40),
      data: {
        label:
          "Obrigado, {{nome_cliente}}! Vamos direcionar você para a equipe de vendas.",
      },
    },
    {
      id: msgOrc,
      type: "message",
      position: pos(920, 220),
      data: {
        label:
          "Certo! Encaminhando para um consultor com as informações que você precisa.",
      },
    },
    {
      id: sector,
      type: "sector",
      position: pos(1760, 120),
      data: { queue: { ...PLACEHOLDER.queue } },
    },
    {
      id: att,
      type: "attendant",
      position: pos(920, 380),
      data: { user: { ...PLACEHOLDER.user } },
    },
  ];

  const connections = [
    edge(`e_${"1"}_${msgWelcome}`, "1", msgWelcome),
    edge(`e_${msgWelcome}_${menu}`, msgWelcome, menu),
    edge(`e_${menu}_${qNome}_a1`, menu, qNome, "a1"),
    edge(`e_${menu}_${msgOrc}_a2`, menu, msgOrc, "a2"),
    edge(`e_${menu}_${att}_a3`, menu, att, "a3"),
    edge(`e_${qNome}_${wait1}`, qNome, wait1),
    edge(`e_${wait1}_${msgVendas}`, wait1, msgVendas),
    edge(`e_${msgVendas}_${sector}`, msgVendas, sector),
    edge(`e_${msgOrc}_${sector}`, msgOrc, sector),
  ];

  return { nodes, connections };
}

function buildFinanceiro() {
  const msgWelcome = randomId();
  const menu = randomId();
  const nBoleto = randomId();
  const nPag = randomId();
  const nFin = randomId();
  const sector = randomId();

  const nodes = [
    {
      id: "1",
      type: "start",
      position: pos(80, 120),
      data: { label: "Inicio do fluxo" },
    },
    {
      id: msgWelcome,
      type: "message",
      position: pos(360, 120),
      data: {
        label:
          "Olá! Setor financeiro. Como podemos ajudar? Escolha uma opção no menu.",
      },
    },
    {
      id: menu,
      type: "menu",
      position: pos(640, 120),
      data: {
        message: "Selecione o assunto:",
        arrayOption: [
          { number: 1, value: "Boleto / segunda via" },
          { number: 2, value: "Pagamento e faturas" },
          { number: 3, value: "Falar com o financeiro" },
        ],
      },
    },
    {
      id: nBoleto,
      type: "notification",
      position: pos(920, 20),
      data: {
        phone: PLACEHOLDER.phoneNotify,
        message:
          "[Financeiro] Cliente pediu boleto/2ª via. Protocolo {{protocol}} — {{name}}",
      },
    },
    {
      id: nPag,
      type: "notification",
      position: pos(920, 160),
      data: {
        phone: PLACEHOLDER.phoneNotify,
        message:
          "[Financeiro] Cliente com dúvida sobre pagamento/faturas. Protocolo {{protocol}}",
      },
    },
    {
      id: nFin,
      type: "notification",
      position: pos(920, 300),
      data: {
        phone: PLACEHOLDER.phoneNotify,
        message:
          "[Financeiro] Cliente solicitou atendimento humano do financeiro. Protocolo {{protocol}}",
      },
    },
    {
      id: sector,
      type: "sector",
      position: pos(1200, 160),
      data: { queue: { ...PLACEHOLDER.queue } },
    },
  ];

  const connections = [
    edge(`e_${"1"}_${msgWelcome}`, "1", msgWelcome),
    edge(`e_${msgWelcome}_${menu}`, msgWelcome, menu),
    edge(`e_${menu}_${nBoleto}_a1`, menu, nBoleto, "a1"),
    edge(`e_${menu}_${nPag}_a2`, menu, nPag, "a2"),
    edge(`e_${menu}_${nFin}_a3`, menu, nFin, "a3"),
    edge(`e_${nBoleto}_${sector}`, nBoleto, sector),
    edge(`e_${nPag}_${sector}`, nPag, sector),
    edge(`e_${nFin}_${sector}`, nFin, sector),
  ];

  return { nodes, connections };
}

function buildSuporte() {
  const msgWelcome = randomId();
  const menu = randomId();
  const qDesc = randomId();
  const wait1 = randomId();
  const sector = randomId();

  const nodes = [
    {
      id: "1",
      type: "start",
      position: pos(80, 120),
      data: { label: "Inicio do fluxo" },
    },
    {
      id: msgWelcome,
      type: "message",
      position: pos(360, 120),
      data: {
        label:
          "Olá! Suporte técnico. Vamos te ajudar — escolha uma opção no menu.",
      },
    },
    {
      id: menu,
      type: "menu",
      position: pos(640, 120),
      data: {
        message: "Qual tipo de atendimento você precisa?",
        arrayOption: [
          { number: 1, value: "Problema técnico / erro" },
          { number: 2, value: "Dúvida sobre uso do sistema" },
          { number: 3, value: "Outros assuntos" },
        ],
      },
    },
    {
      id: qDesc,
      type: "question",
      position: pos(920, 120),
      data: {
        typebotIntegration: {
          message:
            "Descreva em uma linha o que está acontecendo. Nossa equipe vai analisar.",
          answerKey: "descricao_problema",
        },
      },
    },
    {
      id: wait1,
      type: "waitForInteraction",
      position: pos(1200, 120),
      data: {},
    },
    {
      id: sector,
      type: "sector",
      position: pos(1480, 120),
      data: { queue: { ...PLACEHOLDER.queue } },
    },
  ];

  const connections = [
    edge(`e_${"1"}_${msgWelcome}`, "1", msgWelcome),
    edge(`e_${msgWelcome}_${menu}`, msgWelcome, menu),
    edge(`e_${menu}_${qDesc}_a1`, menu, qDesc, "a1"),
    edge(`e_${menu}_${qDesc}_a2`, menu, qDesc, "a2"),
    edge(`e_${menu}_${qDesc}_a3`, menu, qDesc, "a3"),
    edge(`e_${qDesc}_${wait1}`, qDesc, wait1),
    edge(`e_${wait1}_${sector}`, wait1, sector),
  ];

  return { nodes, connections };
}

function buildCaptacaoLead() {
  const msgWelcome = randomId();
  const qNome = randomId();
  const wait1 = randomId();
  const qInt = randomId();
  const wait2 = randomId();
  const flowUp = randomId();
  const msgFim = randomId();

  const nodes = [
    {
      id: "1",
      type: "start",
      position: pos(80, 120),
      data: { label: "Inicio do fluxo" },
    },
    {
      id: msgWelcome,
      type: "message",
      position: pos(360, 120),
      data: {
        label:
          "Olá! Que bom ter você aqui. Vamos registrar seu interesse em poucos passos.",
      },
    },
    {
      id: qNome,
      type: "question",
      position: pos(640, 120),
      data: {
        typebotIntegration: {
          message: "Qual é o seu nome completo?",
          answerKey: "lead_nome",
        },
      },
    },
    {
      id: wait1,
      type: "waitForInteraction",
      position: pos(920, 120),
      data: {},
    },
    {
      id: qInt,
      type: "question",
      position: pos(1200, 120),
      data: {
        typebotIntegration: {
          message:
            "Descreva seu interesse (produto, serviço ou dúvida principal):",
          answerKey: "lead_interesse",
        },
      },
    },
    {
      id: wait2,
      type: "waitForInteraction",
      position: pos(1480, 120),
      data: {},
    },
    {
      id: flowUp,
      type: "flowUp",
      position: pos(1760, 120),
      data: { contactList: { ...PLACEHOLDER.list } },
    },
    {
      id: msgFim,
      type: "message",
      position: pos(2040, 120),
      data: {
        label:
          "Obrigado, {{lead_nome}}! Registramos seu interesse: {{lead_interesse}}. Em breve entraremos em contato.",
      },
    },
  ];

  const connections = [
    edge(`e_${"1"}_${msgWelcome}`, "1", msgWelcome),
    edge(`e_${msgWelcome}_${qNome}`, msgWelcome, qNome),
    edge(`e_${qNome}_${wait1}`, qNome, wait1),
    edge(`e_${wait1}_${qInt}`, wait1, qInt),
    edge(`e_${qInt}_${wait2}`, qInt, wait2),
    edge(`e_${wait2}_${flowUp}`, wait2, flowUp),
    edge(`e_${flowUp}_${msgFim}`, flowUp, msgFim),
  ];

  return { nodes, connections };
}

function buildRemarketing() {
  const msgIni = randomId();
  const cond = randomId();
  const flowUp = randomId();
  const notif = randomId();
  const wait1 = randomId();
  const menu = randomId();
  const att = randomId();
  const msgFim = randomId();

  const nodes = [
    {
      id: "1",
      type: "start",
      position: pos(80, 120),
      data: { label: "Inicio do fluxo" },
    },
    {
      id: msgIni,
      type: "message",
      position: pos(360, 120),
      data: {
        label:
          "Olá de novo! Temos novidades para você. Responda para continuar a conversa.",
      },
    },
    {
      id: cond,
      type: "condition",
      position: pos(640, 120),
      data: {
        mode: "all",
        rules: [
          {
            source: "context",
            field: "isFirstInteraction",
            operator: "isTrue",
            value: "",
          },
        ],
      },
    },
    {
      id: flowUp,
      type: "flowUp",
      position: pos(920, 40),
      data: { contactList: { ...PLACEHOLDER.list } },
    },
    {
      id: notif,
      type: "notification",
      position: pos(920, 200),
      data: {
        phone: PLACEHOLDER.phoneNotify,
        message:
          "[Remarketing] Contato retornou (não é primeira interação). Protocolo {{protocol}} — {{name}}",
      },
    },
    {
      id: wait1,
      type: "waitForInteraction",
      position: pos(1200, 120),
      data: {},
    },
    {
      id: menu,
      type: "menu",
      position: pos(1480, 120),
      data: {
        message: "Deseja falar com um atendente agora?",
        arrayOption: [
          { number: 1, value: "Sim, quero atendimento" },
          { number: 2, value: "Não, obrigado" },
        ],
      },
    },
    {
      id: att,
      type: "attendant",
      position: pos(1760, 60),
      data: { user: { ...PLACEHOLDER.user } },
    },
    {
      id: msgFim,
      type: "message",
      position: pos(1760, 200),
      data: {
        label: "Tudo certo! Qualquer dúvida, estamos por aqui.",
      },
    },
  ];

  const connections = [
    edge(`e_${"1"}_${msgIni}`, "1", msgIni),
    edge(`e_${msgIni}_${cond}`, msgIni, cond),
    edge(`e_${cond}_${flowUp}_true`, cond, flowUp, "true"),
    edge(`e_${cond}_${notif}_false`, cond, notif, "false"),
    edge(`e_${flowUp}_${wait1}`, flowUp, wait1),
    edge(`e_${notif}_${wait1}`, notif, wait1),
    edge(`e_${wait1}_${menu}`, wait1, menu),
    edge(`e_${menu}_${att}_a1`, menu, att, "a1"),
    edge(`e_${menu}_${msgFim}_a2`, menu, msgFim, "a2"),
  ];

  return { nodes, connections };
}

const builders = {
  comercial: buildComercial,
  financeiro: buildFinanceiro,
  suporte: buildSuporte,
  captacao_lead: buildCaptacaoLead,
  remarketing: buildRemarketing,
};

/**
 * @param {string} templateId
 * @returns {{ nodes: object[], connections: object[] }}
 */
export function buildFlowFromTemplate(templateId) {
  const fn = builders[templateId];
  if (!fn) {
    throw new Error(`Template desconhecido: ${templateId}`);
  }
  return fn();
}

export function getTemplateMeta(templateId) {
  return TEMPLATE_META.find((t) => t.id === templateId);
}
