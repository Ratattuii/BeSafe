const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { createFollowNotification } = require('./notificationsController');

/**
 * Lista instituições seguidas pelo usuário logado
 * GET /me/follows
 */
async function getFollowedInstitutions(req, res) {
  try {
    const user_id = req.user?.id || 1;
    
    const institutions = await query(`
      SELECT 
        u.id,
        u.name,
        u.description,
        u.avatar,
        u.address as location,
        u.is_verified,
        u.institution_type,
        u.activity_area,
        COUNT(n.id) as active_needs_count
      FROM users u
      INNER JOIN follows f ON u.id = f.institution_id
      LEFT JOIN needs n ON u.id = n.institution_id AND n.status = 'ativa'
      WHERE f.follower_id = ? AND u.role = 'institution' AND u.is_active = TRUE
      GROUP BY u.id, u.name, u.description, u.avatar, u.address, u.is_verified, u.institution_type, u.activity_area
      ORDER BY u.name
    `, [user_id]);
    
    return success(res, 'Instituições seguidas', { institutions });
    
  } catch (error) {
    console.error('Erro ao buscar instituições seguidas:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Seguir uma instituição
 * POST /institutions/:id/follow
 */
async function followInstitution(req, res) {
  try {
    const { id: institution_id } = req.params;
    const user_id = req.user?.id || 1;
    
    // Verifica se a instituição existe
    const institution = await queryOne(`
      SELECT id FROM users WHERE id = ? AND role = 'institution' AND is_active = TRUE
    `, [institution_id]);
    
    if (!institution) {
      return errors.notFound(res, 'Instituição não encontrada');
    }
    
    // Verifica se já segue
    const existingFollow = await queryOne(`
      SELECT id FROM follows WHERE follower_id = ? AND institution_id = ?
    `, [user_id, institution_id]);
    
    if (existingFollow) {
      return errors.conflict(res, 'Você já segue esta instituição');
    }
    
    // Cria o relacionamento
    await query(`
      INSERT INTO follows (follower_id, institution_id) VALUES (?, ?)
    `, [user_id, institution_id]);
    
    await createFollowNotification(follower_id, institutionId);

    return success(res, 'Instituição seguida com sucesso');
    
  } catch (error) {
    console.error('Erro ao seguir instituição:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Deixar de seguir uma instituição  
 * DELETE /institutions/:id/follow
 */
async function unfollowInstitution(req, res) {
  try {
    const { id: institution_id } = req.params;
    const user_id = req.user?.id || 1;
    
    const result = await query(`
      DELETE FROM follows WHERE follower_id = ? AND institution_id = ?
    `, [user_id, institution_id]);
    
    if (result.affectedRows === 0) {
      return errors.notFound(res, 'Você não segue esta instituição');
    }
    
    return success(res, 'Deixou de seguir a instituição');
    
  } catch (error) {
    console.error('Erro ao deixar de seguir:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista todas as instituições disponíveis
 * GET /institutions
 */
async function getAllInstitutions(req, res) {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const institutions = await query(`
      SELECT 
        u.id,
        u.name,
        u.description,
        u.avatar,
        u.address as location,
        u.is_verified,
        u.institution_type,
        u.activity_area,
        COUNT(n.id) as active_needs_count,
        EXISTS(
          SELECT 1 FROM follows f 
          WHERE f.institution_id = u.id AND f.follower_id = ?
        ) as is_followed
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id AND n.status = 'ativa'
      WHERE u.role = 'institution' AND u.is_active = TRUE
      GROUP BY u.id, u.name, u.description, u.avatar, u.address, u.is_verified, u.institution_type, u.activity_area
      ORDER BY active_needs_count DESC, u.name
      LIMIT ? OFFSET ?
    `, [req.user?.id || 1, parseInt(limit), parseInt(offset)]);
    
    return success(res, 'Instituições disponíveis', { institutions });
    
  } catch (error) {
    console.error('Erro ao buscar instituições:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getFollowedInstitutions,
  followInstitution,
  unfollowInstitution,
  getAllInstitutions
};