const express = require('express');
const router = express.Router();
const { 
  getDonations, 
  getUserDonations, 
  createDonation, 
  updateDonationStatus, 
  getDonationStats 
} = require('../controllers/donationsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /donations
 * Lista todas as doações com filtros opcionais
 * Query params: status, donor_id, institution_id, need_id, limit, offset
 */
router.get('/', authenticateToken, getDonations);

/**
 * GET /donations/me
 * Lista doações do usuário logado
 * Query params: status, limit, offset
 */
router.get('/me', authenticateToken, getUserDonations);

/**
 * GET /donations/stats
 * Retorna estatísticas de doações do usuário logado
 */
router.get('/stats', authenticateToken, getDonationStats);

/**
 * POST /donations
 * Cria uma nova doação
 * Body: { need_id, quantity, unit?, notes?, promised_delivery? }
 */
router.post('/', authenticateToken, createDonation);

/**
 * PUT /donations/:id/status
 * Atualiza status de uma doação
 * Body: { status }
 */
router.put('/:id/status', authenticateToken, updateDonationStatus);

module.exports = router;
