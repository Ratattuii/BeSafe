const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const mapController = require('../controllers/mapController');

/**
 * GET /map/zones
 * Lista zonas de risco/abrigo (público)
 * Query params: ?type=risco&severity=alta&bounds={"northeast":{"lat":-23.5,"lng":-46.6},"southwest":{"lat":-23.6,"lng":-46.7}}
 */
router.get('/zones', mapController.getZones);

/**
 * GET /map/stats
 * Obtém estatísticas das zonas (apenas admin)
 */
router.get('/stats', authenticateToken, requireAdmin, mapController.getZoneStats);

/**
 * POST /map/zones
 * Cria nova zona de risco/abrigo (apenas admin)
 * Body: { latitude, longitude, radius, type, description, severity }
 */
router.post('/zones', authenticateToken, requireAdmin, mapController.createZone);

/**
 * PUT /map/zones/:id
 * Atualiza zona existente (apenas admin)
 * Body: { latitude?, longitude?, radius?, type?, description?, severity?, is_active? }
 */
router.put('/zones/:id', authenticateToken, requireAdmin, mapController.updateZone);

/**
 * DELETE /map/zones/:id
 * Remove zona (apenas admin)
 */
router.delete('/zones/:id', authenticateToken, requireAdmin, mapController.deleteZone);

module.exports = router;
