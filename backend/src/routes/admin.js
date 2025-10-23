const express = require('express');
const router = express.Router();
const { 
  getSystemStats,
  getAllDonations,
  getAllUsers,
  verifyInstitution,
  suspendUser,
  generateDonationsReport
} = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Todas as rotas requerem autenticação e privilégios de admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /admin/stats
 * Estatísticas gerais do sistema
 */
router.get('/stats', getSystemStats);

/**
 * GET /admin/donations
 * Lista todas as doações com filtros
 * Query params: status, urgency, category, limit, offset, sortBy, sortOrder
 */
router.get('/donations', getAllDonations);

/**
 * GET /admin/users
 * Lista todos os usuários com filtros
 * Query params: role, verified, active, limit, offset, sortBy, sortOrder
 */
router.get('/users', getAllUsers);

/**
 * PUT /admin/users/:id/verify
 * Verifica/aprova uma instituição
 * Body: { verified: boolean }
 */
router.put('/users/:id/verify', verifyInstitution);

/**
 * PUT /admin/users/:id/suspend
 * Suspende/ativa um usuário
 * Body: { suspended: boolean, reason: string }
 */
router.put('/users/:id/suspend', suspendUser);

/**
 * GET /admin/reports/donations
 * Gera relatório CSV de doações
 * Query params: startDate, endDate, status
 */
router.get('/reports/donations', generateDonationsReport);

/**
 * POST /admin/alerts/disaster
 * Envia alerta de desastre global
 * Body: { title, message, severity }
 */
router.post('/alerts/disaster', adminController.sendDisasterAlert);

/**
 * GET /admin/alerts/history
 * Obtém histórico de alertas enviados
 */
router.get('/alerts/history', adminController.getAlertHistory);

/**
 * GET /admin/alerts/stats
 * Obtém estatísticas de alertas
 */
router.get('/alerts/stats', adminController.getAlertStats);

module.exports = router;
