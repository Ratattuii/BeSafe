// Arquivo principal de rotas - stub inicial
const express = require('express');
const router = express.Router();

// Controllers (quando implementados)
// const userController = require('../controllers/userController');
// const needController = require('../controllers/needController');
// const donationController = require('../controllers/donationController');
// const messageController = require('../controllers/messageController');

// Health check
const healthController = require('../controllers/healthController');

// Rotas de health check
router.get('/health', healthController.getHealthStatus);

// TODO: Implementar rotas principais
// 
// Rotas de autenticação
// router.post('/auth/register', userController.register);
// router.post('/auth/login', userController.login);
// router.post('/auth/logout', userController.logout);
//
// Rotas de usuários  
// router.get('/users/profile', authenticateToken, userController.getProfile);
// router.put('/users/profile', authenticateToken, userController.updateProfile);
// router.get('/users/institutions', userController.getInstitutions);
//
// Rotas de necessidades
// router.get('/needs', needController.getAllNeeds);
// router.post('/needs', authenticateToken, requireRole('receptor'), needController.createNeed);
// router.get('/needs/:id', needController.getNeedById);
// router.put('/needs/:id', authenticateToken, needController.updateNeed);
// router.delete('/needs/:id', authenticateToken, needController.deleteNeed);
//
// Rotas de doações
// router.get('/donations', authenticateToken, donationController.getUserDonations);
// router.post('/donations', authenticateToken, requireRole('doador'), donationController.createDonation);
//
// Rotas de mensagens
// router.get('/messages/chats', authenticateToken, messageController.getChats);
// router.get('/messages/:chatId', authenticateToken, messageController.getMessages);
// router.post('/messages', authenticateToken, messageController.sendMessage);
//
// Rotas de seguir instituições
// router.post('/follow/:institutionId', authenticateToken, requireRole('doador'), userController.followInstitution);
// router.delete('/follow/:institutionId', authenticateToken, requireRole('doador'), userController.unfollowInstitution);

router.get('/', (req, res) => {
  res.json({
    message: 'BeSafe API - Em desenvolvimento',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      documentation: 'Em breve...'
    }
  });
});

module.exports = router;
