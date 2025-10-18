const express = require('express');
const router = express.Router();
const { getFollowedInstitutions, followInstitution, unfollowInstitution, getAllInstitutions } = require('../controllers/followsController');
const { authenticateToken } = require('../middleware/auth');

/**
 * GET /me/follows
 * Lista instituições seguidas pelo usuário logado
 */
router.get('/me/follows', authenticateToken, getFollowedInstitutions);

/**
 * GET /institutions
 * Lista todas as instituições disponíveis
 */
router.get('/institutions', getAllInstitutions);

/**
 * POST /institutions/:id/follow
 * Seguir uma instituição
 */
router.post('/institutions/:id/follow', authenticateToken, followInstitution);

/**
 * DELETE /institutions/:id/follow  
 * Deixar de seguir uma instituição
 */
router.delete('/institutions/:id/follow', authenticateToken, unfollowInstitution);

module.exports = router;

