const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 8080; // Adicione esta linha se não existir

// --- CONFIGURAÇÃO DE MIDDLEWARE (ORDEM CORRETA) ---

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const corsOptions = {
  // CORREÇÃO AQUI: A URL do seu frontend é http://localhost:3000
  // Removida a barra final para maior compatibilidade
  origin: 'http://localhost:3000', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Headers permitidos
  credentials: true // Permite o envio de cookies de sessão ou cabeçalhos de autorização
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(compression());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// -----------------------------------------------------------

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/checklist-epi', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado ao MongoDB'))
.catch(err => console.error('❌ Erro ao conectar ao MongoDB:', err));

// --- ROTAS DA API ---
// As rotas estão configuradas com o prefixo '/api', o que é consistente
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/epi-types', require('./routes/epiTypes'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/executions', require('./routes/executions'));
app.use('/api/anomalies', require('./routes/anomalies'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor a funcionar corretamente',
    timestamp: new Date().toISOString()
  });
});

// --- TRATAMENTO DE ERROS ---

// Este middleware deve vir DEPOIS de todas as rotas da API
// Ele captura qualquer requisição que não foi tratada pelas rotas acima
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Middleware de tratamento de erros global
app.use((err, req, res, next) => {
  console.error(err.stack); // Imprime o stack trace do erro para depuração
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo correu mal'
  });
});

// Iniciar o servidor (apenas uma vez)
app.listen(PORT, () => {
  console.log(`🚀 Servidor a rodar na porta ${PORT}`);
  console.log(`📱 API disponível em http://localhost:${PORT}/api`);
});
