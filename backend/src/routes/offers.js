const express = require('express');
const router = express.Router();
const { 
  createOffer, 
  getMyOffers, 
  updateOffer,
  getAvailableOffers,
  acceptOffer,
  rejectOffer
} = require('../controllers/offerController');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /offers
 * Cria uma nova oferta de doação (item postado pelo doador)
 */
router.post('/', authenticateToken, createOffer);

/**
 * GET /offers/my-offers
 * Lista as ofertas de doação publicadas pelo doador logado
 */
router.get('/my-offers', authenticateToken, getMyOffers);

/**
 * GET /offers/available
 * Lista TODAS as ofertas disponíveis para instituições
 */
router.get('/available', authenticateToken, getAvailableOffers);

/**
 * PUT /offers/:id/accept
 * Aceita uma oferta de doação (instituição)
 */
router.put('/:id/accept', authenticateToken, acceptOffer);

/**
 * PUT /offers/:id/reject  
 * Rejeita uma oferta de doação (instituição)
 */
router.put('/:id/reject', authenticateToken, rejectOffer);

/**
 * PUT /offers/:id
 * Atualiza uma oferta de doação existente
 */
router.put('/:id', authenticateToken, updateOffer);

module.exports = router;