#!/bin/sh

# Script para copiar certificados personalizados
# Autor: CoreFlow
# Versão: 2.0

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Caminhos
CERTS_DIR="/app/certs-temp"
CERT_TARGET="/app/certs/production-cert.p12"

echo -e "${YELLOW}🔐 Configurando certificados para: $STACK_NAME${NC}"

# Verifica se o diretório de certificados existe
if [ ! -d "$CERTS_DIR" ]; then
    echo -e "${YELLOW}⚠️  Diretório de certificados não encontrado: $CERTS_DIR${NC}"
    echo -e "${YELLOW}💡 Usando certificado padrão${NC}"
    exit 0
fi

# Arquivo personalizado do certificado
CERT_FILE="$CERTS_DIR/${STACK_NAME}-production-cert.p12"

# Cria a pasta certs se não existir
mkdir -p /app/certs

# Substitui certificado se existir
if [ -f "$CERT_FILE" ]; then
    echo -e "${GREEN}✅ Copiando certificado personalizado: $CERT_FILE${NC}"
    cp "$CERT_FILE" "$CERT_TARGET"
    echo -e "${GREEN}   Certificado copiado para: $CERT_TARGET${NC}"
    
    # Verifica permissões do certificado
    chmod 600 "$CERT_TARGET"
    echo -e "${GREEN}   Permissões do certificado configuradas${NC}"
else
    echo -e "${YELLOW}ℹ️  Certificado personalizado não encontrado: $CERT_FILE${NC}"
    echo -e "${YELLOW}   Usando certificado padrão${NC}"
fi

echo -e "${GREEN}🔐 Configuração de certificados concluída!${NC}"

exit 0 