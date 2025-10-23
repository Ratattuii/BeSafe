const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired, runValidations } = require('../utils/validation');

/**
 * Cria uma nova zona de risco/abrigo (apenas admin)
 * POST /map/zones
 */
async function createZone(req, res) {
  try {
    const { latitude, longitude, radius, type, description, severity } = req.body;
    const created_by = req.user.id;

    const validationError = runValidations(
      validateRequired(['latitude', 'longitude', 'radius', 'type'], req.body),
      !['risco', 'abrigo'].includes(type) ? 'Tipo deve ser "risco" ou "abrigo"' : null,
      !['baixa', 'media', 'alta', 'critica'].includes(severity) ? 'Severidade inválida' : null,
      isNaN(latitude) || latitude < -90 || latitude > 90 ? 'Latitude inválida' : null,
      isNaN(longitude) || longitude < -180 || longitude > 180 ? 'Longitude inválida' : null,
      isNaN(radius) || radius < 10 || radius > 10000 ? 'Raio deve estar entre 10 e 10000 metros' : null
    );

    if (validationError) {
      return errors.badRequest(res, validationError);
    }

    const result = await query(
      'INSERT INTO affected_zones (latitude, longitude, radius, type, description, severity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [latitude, longitude, radius, type, description || null, severity || 'media', created_by]
    );

    const newZone = await queryOne('SELECT * FROM affected_zones WHERE id = ?', [result.insertId]);
    return success(res, 'Zona criada com sucesso', { zone: newZone }, 201);

  } catch (error) {
    console.error('Erro ao criar zona:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista todas as zonas ativas (público)
 * GET /map/zones
 */
async function getZones(req, res) {
  try {
    const { type, severity, bounds } = req.query;
    
    let sql = 'SELECT * FROM affected_zones WHERE is_active = TRUE';
    const params = [];

    // Filtros opcionais
    if (type && ['risco', 'abrigo'].includes(type)) {
      sql += ' AND type = ?';
      params.push(type);
    }

    if (severity && ['baixa', 'media', 'alta', 'critica'].includes(severity)) {
      sql += ' AND severity = ?';
      params.push(severity);
    }

    // Filtro por bounds (northeast, southwest)
    if (bounds) {
      try {
        const boundsData = JSON.parse(bounds);
        if (boundsData.northeast && boundsData.southwest) {
          sql += ' AND latitude BETWEEN ? AND ? AND longitude BETWEEN ? AND ?';
          params.push(
            boundsData.southwest.latitude,
            boundsData.northeast.latitude,
            boundsData.southwest.longitude,
            boundsData.northeast.longitude
          );
        }
      } catch (e) {
        return errors.badRequest(res, 'Formato de bounds inválido');
      }
    }

    sql += ' ORDER BY severity = "critica" DESC, severity = "alta" DESC, created_at DESC';

    const zones = await query(sql, params);
    return success(res, 'Zonas encontradas', { zones });

  } catch (error) {
    console.error('Erro ao buscar zonas:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Atualiza uma zona existente (apenas admin)
 * PUT /map/zones/:id
 */
async function updateZone(req, res) {
  try {
    const { id } = req.params;
    const { latitude, longitude, radius, type, description, severity, is_active } = req.body;

    const validationError = runValidations(
      type && !['risco', 'abrigo'].includes(type) ? 'Tipo deve ser "risco" ou "abrigo"' : null,
      severity && !['baixa', 'media', 'alta', 'critica'].includes(severity) ? 'Severidade inválida' : null,
      latitude && (isNaN(latitude) || latitude < -90 || latitude > 90) ? 'Latitude inválida' : null,
      longitude && (isNaN(longitude) || longitude < -180 || longitude > 180) ? 'Longitude inválida' : null,
      radius && (isNaN(radius) || radius < 10 || radius > 10000) ? 'Raio deve estar entre 10 e 10000 metros' : null
    );

    if (validationError) {
      return errors.badRequest(res, validationError);
    }

    const existingZone = await queryOne('SELECT * FROM affected_zones WHERE id = ?', [id]);
    if (!existingZone) {
      return errors.notFound(res, 'Zona não encontrada');
    }

    const updateFields = [];
    const updateValues = [];

    if (latitude !== undefined) {
      updateFields.push('latitude = ?');
      updateValues.push(latitude);
    }
    if (longitude !== undefined) {
      updateFields.push('longitude = ?');
      updateValues.push(longitude);
    }
    if (radius !== undefined) {
      updateFields.push('radius = ?');
      updateValues.push(radius);
    }
    if (type !== undefined) {
      updateFields.push('type = ?');
      updateValues.push(type);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (severity !== undefined) {
      updateFields.push('severity = ?');
      updateValues.push(severity);
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(is_active);
    }

    if (updateFields.length === 0) {
      return errors.badRequest(res, 'Nenhum campo para atualizar fornecido');
    }

    await query(
      `UPDATE affected_zones SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      [...updateValues, id]
    );

    const updatedZone = await queryOne('SELECT * FROM affected_zones WHERE id = ?', [id]);
    return success(res, 'Zona atualizada com sucesso', { zone: updatedZone });

  } catch (error) {
    console.error('Erro ao atualizar zona:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Remove uma zona (apenas admin)
 * DELETE /map/zones/:id
 */
async function deleteZone(req, res) {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM affected_zones WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return errors.notFound(res, 'Zona não encontrada');
    }

    return success(res, 'Zona removida com sucesso');

  } catch (error) {
    console.error('Erro ao remover zona:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Obtém estatísticas das zonas (apenas admin)
 * GET /map/stats
 */
async function getZoneStats(req, res) {
  try {
    const totalZones = await queryOne('SELECT COUNT(*) as count FROM affected_zones');
    const riskZones = await queryOne('SELECT COUNT(*) as count FROM affected_zones WHERE type = "risco" AND is_active = TRUE');
    const shelterZones = await queryOne('SELECT COUNT(*) as count FROM affected_zones WHERE type = "abrigo" AND is_active = TRUE');
    const criticalZones = await queryOne('SELECT COUNT(*) as count FROM affected_zones WHERE severity = "critica" AND is_active = TRUE');

    return success(res, 'Estatísticas das zonas', {
      totalZones: totalZones.count,
      riskZones: riskZones.count,
      shelterZones: shelterZones.count,
      criticalZones: criticalZones.count
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas das zonas:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  createZone,
  getZones,
  updateZone,
  deleteZone,
  getZoneStats
};
