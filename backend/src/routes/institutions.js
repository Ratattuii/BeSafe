const express = require('express');
const router = express.Router();
const { 
  getInstitutionProfile, 
  getInstitutionNeeds, 
  getInstitutionFollowers, 
  updateInstitutionProfile,
  getAllInstitutions,
  getInstitutionStats 
} = require('../controllers/institutionsController');
const { authenticateToken } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

/**
 * GET /institutions
 * Lista todas as instituições
 * Query params: institution_type, activity_area, verified_only, has_active_needs, limit, offset
 */
router.get('/', getAllInstitutions);

/**
 * GET /institutions/:id
 * Busca perfil de uma instituição específica
 */
router.get('/:id', getInstitutionProfile);

/**
 * GET /institutions/:id/needs
 * Lista necessidades de uma instituição
 * Query params: status, category, urgency, limit, offset
 */
router.get('/:id/needs', getInstitutionNeeds);

/**
 * GET /institutions/:id/followers
 * Lista seguidores de uma instituição
 * Query params: limit, offset
 */
router.get('/:id/followers', getInstitutionFollowers);

/**
 * GET /institutions/:id/stats
 * Retorna estatísticas de uma instituição
 */
router.get('/:id/stats', getInstitutionStats);

/**
 * PUT /institutions/:id
 * Atualiza perfil da instituição (apenas o próprio perfil)
 * Body: { name?, description?, institution_type?, activity_area?, phone?, address?, website? }
 * File: avatar (opcional)
 */
router.put('/:id', authenticateToken, handleUploadError, updateInstitutionProfile);

module.exports = router;
