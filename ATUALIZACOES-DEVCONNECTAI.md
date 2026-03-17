# Atualizações do Atendechat baseadas no DevConnectAI (Atualizado)

Este documento descreve as mudanças aplicadas no **Atendechat** (backend na raiz) inspiradas no código do **DevConnectAI** (pasta `Atualizado`), para manter compatibilidade e estabilidade com o WhatsApp.

---

## Já aplicado (primeira leva)

### 1. **`backend/src/libs/wbot.ts`**

- **Conexão – tratamento de desconexão (connection.close)**
  - Códigos **402** e **405** passam a ser tratados como sessão inválida (igual ao 403 e `DisconnectReason.loggedOut`): limpa sessão, remove Baileys, emite evento e agenda nova tentativa após 2s.
  - Lógica unificada: um único bloco para “logout/inválido” e um único `setTimeout` para reconectar.

- **Retorno antecipado em `connection.update`**
  - Se `connection === "connecting"`, o handler retorna logo, evitando processamento desnecessário (como no DevConnectAI).

- **`patchMessageBeforeSending`**
  - **Listas (listMessage):** conversão de `PRODUCT_LIST` para `SINGLE_SELECT` (em `message` e em `deviceSentMessage`), quando o `proto` do Baileys expõe `ListType`, para evitar erro ao enviar listas.
  - **Botões/listas/template:** mensagens do tipo `buttonsMessage`, `listMessage` ou `templateMessage` passam a ser enviadas dentro de `viewOnceMessage` com `messageContextInfo` (deviceListMetadataVersion: 2, deviceListMetadata: {}), alinhado ao que o DevConnectAI usa para maior compatibilidade com o app.

---

## Segunda leva (aplicada)

### 1. **Pacote Baileys**

- **`baileys`** foi trocado por **`@whiskeysockets/baileys`** ^6.7.18 em `backend/package.json`.
- Todos os imports de `"baileys"` no backend passaram a usar `"@whiskeysockets/baileys"` (libs, helpers, services).

### 2. **`backend/src/libs/wbot.ts`**

- **Logger:** o uso de `MAIN_LOGGER` do Baileys foi substituído por **pino** direto: `P({ level: "error" })`, para não depender de caminho interno do pacote.
- **Reconexão – código 440:** quando `connection === "close"` e `statusCode === 440`, o handler **retorna sem** limpar sessão e sem agendar reconexão (comportamento alinhado ao DevConnectAI).
- **Opções do socket:** em `makeWASocket` foram adicionadas **`markOnlineOnConnect: true`** e **`syncFullHistory: true`**.

---

## Possíveis próximas levas (não aplicadas)

- **Baileys 7.x:** no futuro avaliar migração para `@whiskeysockets/baileys` 7.x (ver guia em https://whiskey.so/migrate-latest).
- **Envio de mídia / download:** comparar `SendWhatsAppMedia` e helpers de download do Atendechat com o DevConnectAI para possíveis melhorias (thumb de vídeo, formatos, etc.).

---

## Como testar

1. Subir o backend do Atendechat e conectar um WhatsApp por QR.
2. Enviar mensagem com **botões** ou **lista** (bot/listas) e conferir se chega sem erro.
3. Forçar desconexão (logout no celular ou sessão inválida) e verificar se o status vai para “PENDING” e se uma nova sessão é iniciada após ~2s.
4. Conferir logs em `connection.update` (incluindo `connecting`) para garantir que não há erros ou loops.

Se quiser, na próxima etapa podemos focar em mais alguma parte (ex.: apenas Baileys, apenas envio de mídia ou apenas reconexão).
