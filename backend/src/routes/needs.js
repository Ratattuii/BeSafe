const express = require('express');
const router = express.Router();
const { 
  getNeedsWithFilters, 
  getNeedTypes, 
  getNeedById, 
  createNeed,
  toggleLike,
  getComments,
  addComment,
  registerShare,
  getNeedStats
} = require('../controllers/needsController');
const { authenticateToken } = require('../middleware/auth');
const { handleMultipleUploadError } = require('../middleware/upload');
const { validateRequest } = require('../utils/validation');

/**
 * GET /needs
 * Lista necessidades com filtros opcionais
 * Query params: ?urgency=alta&type=alimento&location=São Paulo&limit=20&offset=0
 */
router.get('/', getNeedsWithFilters);

/**
 * GET /needs/types  
 * Lista tipos de necessidades disponíveis
 */
router.get('/types', getNeedTypes);

/**
 * GET /needs/:id
 * Busca necessidade específica por ID
 */
router.get('/:id', getNeedById);

/**
 * POST /needs
 * Cria nova necessidade (protegido por autenticação)
 * Body: { title, description, urgency, type, quantity, unit?, location?, goal_quantity? }
 * File: image (opcional)
 */
router.post('/', authenticateToken, handleMultipleUploadError, validateRequest('need'), createNeed);

/**
 * POST /needs/:id/like
 * Curtir/descurtir uma necessidade (protegido por autenticação)
 */
router.post('/:id/like', authenticateToken, toggleLike);

/**
 * GET /needs/:id/comments
 * Lista comentários de uma necessidade
 */
router.get('/:id/comments', getComments);

/**
 * POST /needs/:id/comments
 * Adiciona um comentário a uma necessidade (protegido por autenticação)
 * Body: { comment }
 */
router.post('/:id/comments', authenticateToken, addComment);

/**
 * POST /needs/:id/share
 * Registra um compartilhamento (protegido por autenticação, mas user_id pode ser null)
 * Body: { share_type? }
 */
router.post('/:id/share', authenticateToken, registerShare);

/**
 * GET /needs/:id/stats
 * Busca estatísticas de interação de uma necessidade
 */
router.get('/:id/stats', getNeedStats);

module.exports = router;

