const express = require('express');
const router = express.Router();
const { getNeedsWithFilters, createNeed, getNeedById, getNeedTypes } = require('../controllers/needsController');
const { authenticateToken } = require('../middleware/auth');
const { handleMultipleUploadError } = require('../middleware/upload');

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
router.post('/', authenticateToken, handleMultipleUploadError, createNeed);

module.exports = router;

