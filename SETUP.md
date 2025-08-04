# 🚀 Guia de Configuração - Sistema de Checklist EPI

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 16 ou superior)
- **MongoDB** (versão 4.4 ou superior)
- **npm** ou **yarn**

### Instalando no macOS

```bash
# Instalar Node.js (se não tiver)
brew install node

# Instalar MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community
```

### Instalando no Windows

1. Baixe e instale o [Node.js](https://nodejs.org/)
2. Baixe e instale o [MongoDB](https://www.mongodb.com/try/download/community)
3. Configure o MongoDB como serviço

### Instalando no Linux (Ubuntu/Debian)

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

## 🛠️ Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd aplicativo-checklist-epi
```

### 2. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Servidor
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/checklist-epi

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-aqui-mude-em-producao

# Upload de arquivos
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### 3. Instale as dependências

```bash
# Instalar dependências do backend
npm install

# Instalar dependências do frontend
cd client && npm install && cd ..
```

### 4. Inicie o sistema

#### Opção 1: Script automático (Recomendado)

```bash
./start.sh
```

#### Opção 2: Manual

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

## 🌐 Acessando o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 👤 Usuários Padrão

O sistema não vem com usuários pré-cadastrados. Você precisará criar o primeiro usuário administrador através da API:

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Administrador",
    "email": "admin@empresa.com",
    "password": "123456",
    "role": "admin",
    "department": "TI"
  }'
```

## 📱 Funcionalidades

### Para Funcionários
- ✅ Login com matrícula e senha
- ✅ Visualização de checklists diários
- ✅ Execução de checklist item por item
- ✅ Registro de anomalias com foto
- ✅ Assinatura digital
- ✅ Funcionamento offline

### Para Supervisores
- ✅ Visualização de checklists da equipe
- ✅ Aprovação de registros
- ✅ Relatórios básicos

### Para Técnicos de Segurança
- ✅ Cadastro de funcionários
- ✅ Gestão de tipos de EPI
- ✅ Criação de checklists
- ✅ Relatórios completos
- ✅ Exportação de dados

## 🔧 Desenvolvimento

### Estrutura do Projeto

```
aplicativo-checklist-epi/
├── server/                 # Backend Node.js
│   ├── models/            # Modelos MongoDB
│   ├── routes/            # Rotas da API
│   ├── middleware/        # Middlewares
│   └── index.js           # Servidor principal
├── client/                # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── contexts/      # Contextos React
│   │   ├── services/      # Serviços de API
│   │   └── utils/         # Utilitários
│   └── public/            # Arquivos públicos
├── uploads/               # Arquivos enviados
└── package.json           # Dependências do backend
```

### Scripts Disponíveis

```bash
# Backend
npm run dev          # Desenvolvimento com nodemon
npm start           # Produção
npm test            # Testes

# Frontend
cd client
npm start           # Desenvolvimento
npm run build       # Build para produção
npm test            # Testes
```

## 🐛 Solução de Problemas

### MongoDB não conecta
```bash
# Verificar se o MongoDB está rodando
brew services list | grep mongodb

# Reiniciar MongoDB
brew services restart mongodb-community
```

### Porta já em uso
```bash
# Verificar processos na porta
lsof -i :5000
lsof -i :3000

# Matar processo
kill -9 <PID>
```

### Erro de dependências
```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📊 Banco de Dados

### Coleções MongoDB

- **users**: Funcionários, supervisores e administradores
- **epi_types**: Tipos de EPI cadastrados
- **checklists**: Templates de checklist
- **checklist_executions**: Execuções de checklist
- **anomalies**: Registros de anomalias com fotos

### Backup e Restore

```bash
# Backup
mongodump --db checklist-epi --out ./backup

# Restore
mongorestore --db checklist-epi ./backup/checklist-epi
```

## 🔒 Segurança

- Autenticação JWT
- Criptografia de senhas (bcrypt)
- Validação de dados
- Headers de segurança (Helmet)
- Conformidade com LGPD

## 📈 Próximos Passos

- [ ] Implementar funcionalidades completas das páginas
- [ ] Adicionar testes automatizados
- [ ] Implementar notificações push
- [ ] Criar aplicativo mobile com React Native
- [ ] Adicionar relatórios avançados
- [ ] Implementar backup automático

## 🤝 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação
2. Consulte os logs do sistema
3. Abra uma issue no repositório

---

**Desenvolvido com ❤️ para garantir a segurança dos trabalhadores** 