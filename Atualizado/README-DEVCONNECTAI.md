# DevConnectAI – Como usar

Este é o projeto **DevConnectAI** (API WhatsApp com Baileys). Para rodar, use a pasta **Atualizado** como raiz do projeto.

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **Redis** (obrigatório para filas de mensagens)
- **npm** ou **yarn**

---

## Configuração rápida

### 1. Entrar na pasta do projeto

```bash
cd Atualizado
```

### 2. Variáveis de ambiente

Copie o exemplo e edite o `.env` na raiz da pasta **Atualizado**:

```bash
cp .env.example .env
```

Edite o `.env` e defina pelo menos:

| Variável | Obrigatório | Exemplo |
|----------|-------------|---------|
| `PORT` | Não (padrão 9898) | `9898` |
| `APP_URL` | Sim | `http://localhost:9898` |
| `TOKEN_ADMIN_API` | Sim (se rotas protegidas) | Um token secreto forte |
| `REDIS_URI` | Sim | `redis://127.0.0.1:6379` |

Sem `REDIS_URI` o servidor pode falhar ao iniciar (filas usam Redis).

### 3. Instalar dependências

```bash
npm install
```

### 4. Subir o Redis (se ainda não estiver rodando)

- **Windows:** instale Redis ou use WSL/Docker.
- **Linux/Mac:** por exemplo `redis-server` ou `sudo systemctl start redis`.

### 5. Iniciar o servidor

**Desenvolvimento (com nodemon):**

```bash
npm run dev
```

Isso executa `node src/server.js` e reinicia ao alterar arquivos em `src` e `.env`.

**Produção (direto):**

```bash
node server.js
```

Ou com PM2:

```bash
pm2 start src/server.js --name dev-connect-ai-wa
```

---

## Verificar se está rodando

- **Health:** `GET http://localhost:9898/status` → deve retornar `OK`.
- **Versão da API:** `GET http://localhost:9898/api/version` → retorna versão e mensagem.

As rotas da API (instância, mensagens, etc.) em geral exigem o header de autenticação com `TOKEN_ADMIN_API` quando `protectRoutes` está ativo no `config/config.js`.

---

## Principais rotas da API (resumo)

- **Instância:** `/instance/init`, `/instance/qr`, `/instance/list`, `/instance/logout`, etc.
- **Mensagens:** rotas em `/message`
- **Grupos:** rotas em `/group`
- **Outros:** `/misc`

Consulte os arquivos em `api/routes/` para a lista completa.

---

## Estrutura relevante (pasta Atualizado)

- `server.js` – entrada em produção (raiz).
- `src/server.js` – entrada usada no `npm run dev`.
- `config/` – configuração (porta, Redis, webhook, etc.).
- `api/` – rotas, controllers, classe de instância WhatsApp.
- `worker.js` – filas (Bull) para envio de mensagens; depende de Redis.
- `db/`, `media/` – dados e mídia.

---

## Observações

- O **token** (`TOKEN_ADMIN_API`) deve ser enviado nas requisições à API (ex.: header `Authorization: Bearer SEU_TOKEN` ou conforme o middleware em `api/middlewares/tokenCheck.js`).
- Sessões WhatsApp ficam em arquivos na raiz do projeto (ex.: `sessions.json` e pasta de sessão do Baileys); não é necessário banco para as sessões em si.
- MongoDB e webhook são opcionais; veja comentários no `.env.example` e em `config/config.js`.

---

## Deploy no Ubuntu Server 20.04 (script automático)

1. **Copie o conteúdo da pasta Atualizado** para o servidor em `/var/www/devconnectai` (ou o caminho que quiser). Exemplo no seu PC:
   ```bash
   rsync -avz --exclude node_modules ./Atualizado/ usuario@SEU_IP:/var/www/devconnectai/
   ```
   Ou, no servidor, clone/extraia o repositório e copie só a pasta Atualizado:
   ```bash
   sudo mkdir -p /var/www/devconnectai
   sudo cp -r /caminho/do/repo/Atualizado/* /var/www/devconnectai/
   ```

2. **Edite o script** `install.sh` no servidor (opcional):
   - `SERVER_IP` – IP do servidor (para exibir no final).
   - `TOKEN_ADMIN_API` – o script gera um com `openssl rand`; pode trocar por um token fixo.
   - `DOMAIN` e `API_DOMAIN` – se for usar domínio e proxy na porta 80, preencha e rode o script de novo.

3. **Execute o script** (como root):
   ```bash
   cd /var/www/devconnectai
   chmod +x install.sh
   sudo ./install.sh
   ```

4. O script instala: Node.js 20, Redis, Nginx, dependências do projeto, serviço systemd `devconnectai` e proxy Nginx na porta 80. No final ele mostra o **TOKEN_ADMIN_API**; use esse token no header das requisições à API.

5. **Comandos úteis:**
   - `systemctl status devconnectai` – status do serviço
   - `journalctl -u devconnectai -f` – logs em tempo real
   - `curl http://localhost:9898/status` – testar se a API responde

Se quiser, na próxima mensagem podemos configurar o `.env` para um caso concreto (local, VPS, etc.) ou debugar algum erro ao subir o servidor.
