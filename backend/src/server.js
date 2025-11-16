require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');
const SocketService = require('./services/socketService');

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
const reviewsRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const mapRoutes = require('./routes/map');
const offerRoutes = require('./routes/offers'); // <-- ADICIONADO AQUI

// Configura nossa aplicação Express
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// JWT secret do .env (com fallback para desenvolvimento)
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'besafe_jwt_secret_2024_desenvolvimento';
  console.warn('⚠️  JWT_SECRET não definido no .env, usando valor padrão (apenas para desenvolvimento)');
}

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
app.use('/reviews', reviewsRoutes);
app.use('/admin', adminRoutes);
app.use('/map', mapRoutes);
app.use('/', followsRoutes); // Para /me/follows
app.use('/offers', offerRoutes); // <-- ADICIONADO AQUI

// Rota inicial - mostra se tá tudo funcionando
app.get('/', (req, res) => {
  return success(res, 'BeSafe API está funcionando', {
    version: '1.0.0',
    availableRoutes: [
      'POST /auth/register - Criar nova conta',
      'POST /auth/login - Entrar no app',
      // ... (outras rotas) ...
      'POST /offers - Criar oferta de doação', // Rota nova
      'GET /offers/my-offers - Minhas ofertas de doação', // Rota nova
      // ... (outras rotas) ...
      'GET /admin/reports/donations - Relatório CSV de doações (admin)'
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

// Inicializa Socket.io para chat em tempo real
let socketService;
try {
  socketService = new SocketService(server);
  console.log('✅ Socket.io inicializado');
} catch (error) {
  console.error('⚠️  Erro ao inicializar Socket.io:', error.message);
}

// Testa conexão e inicia servidor
testConnection().then(connected => {
  if (!connected) {
    console.error('Erro ao conectar ao banco de dados');
    process.exit(1);
  }
  
  server.listen(PORT, () => {
    console.log(`✅ Servidor rodando na porta ${PORT}`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🔌 Socket.io disponível`);
  });
}).catch(error => {
  console.error('Erro ao iniciar servidor:', error.message);
  process.exit(1);
});

// Encerramento limpo
process.on('SIGINT', () => process.exit(0));
process.on('SIGTERM', () => process.exit(0));