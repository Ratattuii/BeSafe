const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  getNotificationStats,
  createManualNotification,
  debugCreateTestNotification,
  debugGetFollowers
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
 * Retorna estatísticas de notificações
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

/**
 * POST /notifications/manual
 * Cria uma notificação manualmente (admin/sistema)
 */
router.post('/manual', authenticateToken, createManualNotification);

/**
 * DEBUG: Testar criação de notificação
 * POST /notifications/debug/test
 */
router.post('/debug/test', authenticateToken, debugCreateTestNotification);

/**
 * DEBUG: Verificar seguidores
 * GET /notifications/debug/followers/:institutionId
 */
router.get('/debug/followers/:institutionId', authenticateToken, debugGetFollowers);

module.exports = router;