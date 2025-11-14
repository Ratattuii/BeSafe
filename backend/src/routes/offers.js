const express = require('express');
const router = express.Router();
const { createOffer, getMyOffers } = require('../controllers/offerController');
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

module.exports = router;