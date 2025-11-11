const { Router } = require('express');
const router = Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Importação do controller com nomes corretos
const { 
  getZones, 
  createZone, 
  updateZone, 
  deleteZone,
  getZoneStats
} = require('../controllers/mapController');

/**
 * GET /map/zones
 * Lista todas as zonas de risco/abrigo (público)
 * Query params: type, severity, bounds
 */
router.get('/zones', getZones);

/**
 * GET /map/stats
 * Obtém estatísticas das zonas (apenas admin)
 */
router.get('/stats', authenticateToken, isAdmin, getZoneStats);

/**
 * POST /map/zones
 * Adiciona uma nova zona (Protegido: Admin)
 * Body: { latitude, longitude, radius, type, description?, severity? }
 */
router.post('/zones', authenticateToken, isAdmin, createZone);

/**
 * PUT /map/zones/:id
 * Atualiza uma zona (Protegido: Admin)
 * Body: { latitude?, longitude?, radius?, type?, description?, severity?, is_active? }
 */
router.put('/zones/:id', authenticateToken, isAdmin, updateZone);

/**
 * DELETE /map/zones/:id
 * Deleta uma zona (Protegido: Admin)
 */
router.delete('/zones/:id', authenticateToken, isAdmin, deleteZone);

module.exports = router;