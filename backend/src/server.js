const express = require('express');
const cors = require('cors');
const path = require('path');

const { testConnection } = require('./database/db');
const { success, errors } = require('./utils/responses');

// Carrega as rotas do nosso app
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const needsRoutes = require('./routes/needs');
const followsRoutes = require('./routes/follows');
const donationsRoutes = require('./routes/donations');
const messagesRoutes = require('./routes/messages');
const notificationsRoutes = require('./routes/notifications');
const searchRoutes = require('./routes/search');
const institutionsRoutes = require('./routes/institutions');

// Configura nossa aplicação Express
const app = express();
const PORT = 3000;

// Defino o JWT secret aqui mesmo por enquanto (depois migro pro .env)
process.env.JWT_SECRET = 'besafe_jwt_secret_2024_desenvolvimento';

// Configurações básicas do servidor
app.use(cors()); // Libera CORS pra não dar problema no frontend
app.use(express.json()); // Entende JSON nas requisições
app.use(express.urlencoded({ extended: true })); // Entende formulários também

// Pasta onde ficam os uploads dos usuários
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Log das requisições
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('pt-BR');
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Conecta as rotas principais
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/needs', needsRoutes);
app.use('/donations', donationsRoutes);
app.use('/messages', messagesRoutes);
app.use('/notifications', notificationsRoutes);
app.use('/search', searchRoutes);
app.use('/institutions', institutionsRoutes);
app.use('/', followsRoutes); // Para /me/follows

// Rota inicial - mostra se tá tudo funcionando
app.get('/', (req, res) => {
  return success(res, 'BeSafe API está funcionando', {
    version: '1.0.0',
    availableRoutes: [
      'POST /auth/register - Criar nova conta',
      'POST /auth/login - Entrar no app',
      'GET /auth/me - Ver meus dados',
      'GET /users/:id - Buscar usuário específico',
      'PUT /users/:id - Atualizar perfil do usuário',
      'GET /needs - Listar necessidades (filtros: urgency, type, location)',
      'GET /needs/types - Tipos de necessidades disponíveis',
      'POST /needs - Criar necessidade',
      'GET /donations - Listar doações',
      'GET /donations/me - Minhas doações',
      'POST /donations - Criar doação',
      'GET /messages/conversations - Listar conversas',
      'GET /messages/:userId - Mensagens com usuário',
      'POST /messages - Enviar mensagem',
      'GET /notifications - Listar notificações',
      'GET /search - Busca geral',
      'GET /search/needs - Buscar necessidades',
      'GET /search/institutions - Buscar instituições',
      'GET /institutions - Listar instituições',
      'GET /institutions/:id - Perfil da instituição',
      'GET /me/follows - Instituições seguidas',
      'POST /institutions/:id/follow - Seguir instituição'
    ]
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  return errors.notFound(res, 'Rota não encontrada');
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  console.error('Erro interno:', error);
  return errors.serverError(res);
});

// Testa conexão e inicia servidor
testConnection().then(connected => {
  if (!connected) {
    console.error('Erro ao conectar ao banco de dados');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Erro ao iniciar servidor:', error.message);
  process.exit(1);
});

// Encerramento limpo
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));
