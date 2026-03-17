#!/usr/bin/env bash
set -e

###############################################################################
# DevConnectAI – Instalação Ubuntu 20.04
# Redis local | Sem PostgreSQL | Nginx como proxy reverso
# Ajuste SERVER_IP e, se quiser, DOMAIN/API_DOMAIN
###############################################################################

PROJETO_DIR="/var/www/devconnectai"
LINUX_USER="root"
SERVER_IP="217.216.64.80"

# Porta da API (padrão do DevConnectAI)
APP_PORT="9898"

# Token para proteger as rotas da API (gere um forte em produção)
TOKEN_ADMIN_API="DevConnectAI-Token-$(openssl rand -hex 16 2>/dev/null || echo 'troque-me')"

REDIS_PASS=""

# Para usar domínio depois, preencha e rode o script de novo:
DOMAIN=""
API_DOMAIN=""

###############################################################################
echo "==> Atualizando sistema"
apt update && apt upgrade -y

echo "==> Instalando Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs build-essential

echo "==> Instalando Redis"
apt install -y redis-server
systemctl enable redis-server
systemctl start redis-server

if [ -n "$REDIS_PASS" ]; then
  echo "==> Configurando senha no Redis"
  sed -i "s/^# *requirepass .*/requirepass ${REDIS_PASS}/" /etc/redis/redis.conf
  systemctl restart redis-server
  REDIS_URI="redis://:${REDIS_PASS}@127.0.0.1:6379"
else
  REDIS_URI="redis://127.0.0.1:6379"
fi

echo "==> Instalando Nginx"
apt install -y nginx
systemctl enable nginx
systemctl start nginx

###############################################################################
# PASTA DO PROJETO
###############################################################################
echo "==> Preparando pasta do projeto em ${PROJETO_DIR}"
mkdir -p "${PROJETO_DIR}"

if [ ! -f "${PROJETO_DIR}/server.js" ] || [ ! -f "${PROJETO_DIR}/package.json" ]; then
  echo ">> ERRO: server.js ou package.json não encontrados em ${PROJETO_DIR}."
  echo "   Copie o conteúdo da pasta Atualizado (DevConnectAI) para ${PROJETO_DIR} e rode: ./install.sh"
  exit 1
fi

###############################################################################
# .ENV
###############################################################################
echo "==> Configurando .env"
cd "${PROJETO_DIR}"

if [ -n "$DOMAIN" ] && [ -n "$API_DOMAIN" ]; then
  APP_URL_VALUE="https://${API_DOMAIN}"
else
  # Acesso pela porta 80 via Nginx (sem porta na URL)
  APP_URL_VALUE="http://${SERVER_IP}"
fi

if [ ! -f ".env" ]; then
  [ -f .env.example ] && cp .env.example .env || touch .env
fi

# Remove linhas antigas das variáveis que vamos definir
for key in PORT APP_URL TOKEN_ADMIN_API REDIS_URI; do
  sed -i "/^${key}=/d" .env 2>/dev/null || true
done

cat >> .env << EOF

PORT=${APP_PORT}
APP_URL=${APP_URL_VALUE}
TOKEN_ADMIN_API=${TOKEN_ADMIN_API}
REDIS_URI=${REDIS_URI}
EOF

echo "==> Instalando dependências"
npm install --production

###############################################################################
# SYSTEMD
###############################################################################
echo "==> Criando serviço systemd (devconnectai)"
cat > /etc/systemd/system/devconnectai.service << EOF
[Unit]
Description=DevConnectAI - API WhatsApp
After=network.target redis-server.service

[Service]
Type=simple
User=${LINUX_USER}
WorkingDirectory=${PROJETO_DIR}
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable devconnectai
systemctl restart devconnectai

###############################################################################
# NGINX
###############################################################################
if [ -n "$DOMAIN" ] && [ -n "$API_DOMAIN" ]; then
  echo "==> Configurando Nginx (domínio)"
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  cat > /etc/nginx/sites-available/devconnectai << EOF
server {
    listen 80;
    server_name ${API_DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  ln -sf /etc/nginx/sites-available/devconnectai /etc/nginx/sites-enabled/
else
  echo "==> Configurando Nginx (acesso por IP ${SERVER_IP})"
  rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
  cat > /etc/nginx/sites-available/devconnectai << EOF
server {
    listen 80 default_server;
    server_name _;
    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  ln -sf /etc/nginx/sites-available/devconnectai /etc/nginx/sites-enabled/
fi

echo "==> Testando e reiniciando Nginx"
nginx -t && systemctl restart nginx || {
  echo ">> AVISO: Nginx não reiniciou. Verifique: systemctl status nginx; journalctl -u nginx -n 30"
}

###############################################################################
echo ""
echo "=============================================="
echo "  DevConnectAI – Instalação concluída"
echo "=============================================="
echo "  API:        http://${SERVER_IP} (proxy na porta 80)"
echo "  Direto:     http://${SERVER_IP}:${APP_PORT}"
echo "  Status:     curl http://127.0.0.1:${APP_PORT}/status"
echo ""
echo "  Serviço:    systemctl status devconnectai"
echo "  Logs:       journalctl -u devconnectai -f"
echo ""
echo "  TOKEN_ADMIN_API (guarde para as requisições):"
echo "  ${TOKEN_ADMIN_API}"
echo ""
echo "  Firewall (se usar ufw):"
echo "    ufw allow 22 && ufw allow 80 && ufw enable"
echo "=============================================="
