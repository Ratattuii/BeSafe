const { Router } = require('express');
const router = Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');

// IMPORTANTE: A IMPORTAÇÃO
const { 
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
  sendGlobalDisasterAlert, // <-- Nome correto (com "Global")
  getAlertHistory,
  getAlertStats
} = require('../controllers/adminController');

// Todas as rotas de admin precisam de autenticação E verificação de admin
router.use(authenticateToken, isAdmin);

/**
 * GET /admin/users
 * Lista todos os usuários
 */
router.get('/users', getAllUsers);

/**
 * PUT /admin/users/:id/role
 * Atualiza o papel (role) de um usuário
 */
router.put('/users/:id/role', updateUserRole);

/**
 * DELETE /admin/users/:id
 * Deleta um usuário
 */
router.delete('/users/:id', deleteUser);

/**
 * GET /admin/stats
 * Busca estatísticas para o dashboard do admin
 */
router.get('/stats', getAdminStats);

/**
 * POST /admin/alerts
 * Envia um alerta de desastre global
 */
router.post('/alerts', sendGlobalDisasterAlert); // <-- Nome correto (com "Global")

/**
 * GET /admin/alerts/history
 * Busca histórico de alertas enviados
 */
router.get('/alerts/history', getAlertHistory);

/**
 * GET /admin/alerts/stats
 * Busca estatísticas de alertas
 */
router.get('/alerts/stats', getAlertStats);

module.exports = router;