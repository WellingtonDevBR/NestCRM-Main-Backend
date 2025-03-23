#!/bin/bash

# 🚀 CONFIGURAÇÕES
EC2_USER="ec2-user"
EC2_HOST="YOUR_EC2_PUBLIC_IP"
EC2_KEY_PATH="~/.ssh/your-key.pem"   # caminho da sua chave PEM
REMOTE_DIR="/home/ec2-user/nestcrm-backend"

# 🔄 Etapa 1: Construir (se necessário) e zipar os arquivos
echo "📦 Preparando arquivos para deploy..."
zip -r backend.zip src package.json tsconfig.json bun.lock .env README.md

# 🚚 Etapa 2: Enviar para a EC2
echo "📤 Enviando para EC2..."
scp -i $EC2_KEY_PATH backend.zip $EC2_USER@$EC2_HOST:$REMOTE_DIR

# 🧨 Etapa 3: Conectar via SSH e descompactar + instalar dependências
echo "🔧 Conectando à EC2 e preparando aplicação..."
ssh -i $EC2_KEY_PATH $EC2_USER@$EC2_HOST << EOF
  cd $REMOTE_DIR
  rm -rf src node_modules
  unzip -o backend.zip
  rm backend.zip
  bun install
  echo "✅ Aplicação atualizada com sucesso!"
EOF
