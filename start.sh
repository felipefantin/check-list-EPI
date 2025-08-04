#!/bin/bash

echo "🚀 Iniciando Sistema de Checklist EPI..."

# Verificar se o MongoDB está rodando
echo "📊 Verificando MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "❌ MongoDB não está rodando. Por favor, inicie o MongoDB primeiro."
    echo "   Você pode usar: brew services start mongodb-community"
    exit 1
fi
echo "✅ MongoDB está rodando"

# Criar diretório de uploads se não existir
echo "📁 Criando diretório de uploads..."
mkdir -p uploads

# Instalar dependências se necessário
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências do backend..."
    npm install
fi

if [ ! -d "client/node_modules" ]; then
    echo "Instalando dependências do frontend..."
    cd client && npm install && cd ..
fi

# Iniciar o backend
echo "🔧 Iniciando servidor backend..."
npm run dev &
BACKEND_PID=$!

# Aguardar um pouco para o backend inicializar
sleep 3

# Iniciar o frontend
echo "🎨 Iniciando aplicação frontend..."
cd client && npm start &
FRONTEND_PID=$!

echo "✅ Sistema iniciado com sucesso!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5000"
echo ""
echo "Para parar o sistema, pressione Ctrl+C"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando sistema..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Manter o script rodando
wait 