#!/usr/bin/env bash
###############################################################################
# Script para atualizar o IP do servidor após migração
# Uso: ./update-server-ip.sh           (detecta IP automaticamente)
#      ./update-server-ip.sh 1.2.3.4   (usa IP informado)
###############################################################################

PROJETO_DIR="${PROJETO_DIR:-/var/www/atendechat}"

if [ -n "$1" ]; then
  NEW_IP="$1"
else
  echo "==> Detectando IP do servidor..."
  NEW_IP=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || curl -s --max-time 3 icanhazip.com 2>/dev/null)
  if [ -z "$NEW_IP" ]; then
    NEW_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  if [ -z "$NEW_IP" ]; then
    NEW_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
  fi
  if [ -z "$NEW_IP" ]; then
    echo ">> ERRO: Não foi possível detectar o IP. Use: ./update-server-ip.sh SEU_IP"
    exit 1
  fi
  echo "    IP detectado: ${NEW_IP}"
fi

echo "==> Atualizando IP do servidor para: ${NEW_IP}"
echo "==> Pasta do projeto: ${PROJETO_DIR}"
echo ""

# Backend .env
BACKEND_ENV="${PROJETO_DIR}/backend/.env"
if [ -f "$BACKEND_ENV" ]; then
  echo ">> Atualizando backend/.env"
  sed -i "s|BACKEND_URL=.*|BACKEND_URL=http://${NEW_IP}:8080|" "$BACKEND_ENV"
  sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=http://${NEW_IP}|" "$BACKEND_ENV"
  echo "   BACKEND_URL=http://${NEW_IP}:8080"
  echo "   FRONTEND_URL=http://${NEW_IP}"
else
  echo ">> AVISO: ${BACKEND_ENV} não encontrado"
fi

# Frontend .env
FRONTEND_ENV="${PROJETO_DIR}/frontend/.env"
if [ -f "$FRONTEND_ENV" ]; then
  echo ""
  echo ">> Atualizando frontend/.env"
  sed -i "s|REACT_APP_BACKEND_URL=.*|REACT_APP_BACKEND_URL=http://${NEW_IP}:8080|" "$FRONTEND_ENV"
  echo "   REACT_APP_BACKEND_URL=http://${NEW_IP}:8080"
else
  echo ""
  echo ">> AVISO: ${FRONTEND_ENV} não encontrado"
fi

# Rebuild do frontend (REACT_APP_* é embutido no build)
echo ""
echo ">> Reconstruindo frontend (isso pode demorar alguns minutos)..."
cd "${PROJETO_DIR}/frontend" && npm run build

# Reiniciar backend
echo ""
echo ">> Reiniciando backend..."
systemctl restart atendechat-backend 2>/dev/null || systemctl restart backend 2>/dev/null || echo "   Reinicie o backend manualmente"

echo ""
echo "==> Concluído! Acesse: http://${NEW_IP}"
echo "==> Se ainda não funcionar, reinicie o Nginx: systemctl restart nginx"
