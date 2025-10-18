const express = require('express');
const router = express.Router();
const { 
  getConversations, 
  getMessages, 
  sendMessage, 
  markAsRead, 
  markConversationAsRead,
  getMessageStats 
} = require('../controllers/messagesController');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /messages/conversations
 * Lista conversas do usuário logado
 */
router.get('/conversations', authenticateToken, getConversations);

/**
 * GET /messages/stats
 * Retorna estatísticas de mensagens do usuário logado
 */
router.get('/stats', authenticateToken, getMessageStats);

/**
 * GET /messages/:userId
 * Busca mensagens entre o usuário logado e outro usuário
 * Query params: limit, offset
 */
router.get('/:userId', authenticateToken, getMessages);

/**
 * POST /messages
 * Envia uma mensagem
 * Body: { receiver_id, message, message_type? }
 */
router.post('/', authenticateToken, sendMessage);

/**
 * PUT /messages/:id/read
 * Marca uma mensagem como lida
 */
router.put('/:id/read', authenticateToken, markAsRead);

/**
 * PUT /messages/conversation/:userId/read
 * Marca todas as mensagens de uma conversa como lidas
 */
router.put('/conversation/:userId/read', authenticateToken, markConversationAsRead);

module.exports = router;
