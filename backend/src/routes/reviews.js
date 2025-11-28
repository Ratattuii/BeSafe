const express = require('express');
const router = express.Router();
const { 
  createReview, 
  getDonationReviews, 
  getUserReceivedReviews, 
  getUserGivenReviews,
  updateReview,
  deleteReview 
} = require('../controllers/reviewsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /reviews
 * Cria uma nova avaliação
 * Body: { donation_id, reviewed_id, rating, comment, review_type }
 */
router.post('/', authenticateToken, createReview);

/**
 * GET /reviews/donation/:donationId
 * Lista avaliações de uma doação específica
 */
router.get('/donation/:donationId', getDonationReviews);

/**
 * GET /reviews/user/:userId/received
 * Lista avaliações recebidas por um usuário
 */
router.get('/user/:userId/received', getUserReceivedReviews);

/**
 * GET /reviews/user/:userId/given
 * Lista avaliações feitas por um usuário
 */
router.get('/user/:userId/given', getUserGivenReviews);

/**
 * PUT /reviews/:id
 * Atualiza uma avaliação
 * Body: { rating, comment }
 */
router.put('/:id', authenticateToken, updateReview);

/**
 * DELETE /reviews/:id
 * Remove uma avaliação
 */
router.delete('/:id', authenticateToken, deleteReview);

module.exports = router;