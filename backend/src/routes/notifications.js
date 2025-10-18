const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getNotificationStats 
} = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /notifications
 * Lista notificações do usuário logado
 * Query params: type, is_read, limit, offset
 */
router.get('/', authenticateToken, getNotifications);

/**
 * GET /notifications/stats
 * Retorna estatísticas de notificações do usuário logado
 */
router.get('/stats', authenticateToken, getNotificationStats);

/**
 * PUT /notifications/:id/read
 * Marca uma notificação como lida
 */
router.put('/:id/read', authenticateToken, markAsRead);

/**
 * PUT /notifications/read-all
 * Marca todas as notificações como lidas
 */
router.put('/read-all', authenticateToken, markAllAsRead);

/**
 * DELETE /notifications/:id
 * Remove uma notificação
 */
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router;
