const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Busca perfil de uma instituição
 * GET /institutions/:id
 */
async function getInstitutionProfile(req, res) {
  try {
    const { id } = req.params;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de instituição inválido');
    }
    
    // Busca dados da instituição
    const institution = await queryOne(`
      SELECT 
        u.*,
        COUNT(DISTINCT n.id) as total_needs,
        COUNT(DISTINCT CASE WHEN n.status = 'ativa' THEN n.id END) as active_needs,
        COUNT(DISTINCT f.id) as followers_count
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id
      LEFT JOIN follows f ON u.id = f.institution_id
      WHERE u.id = ? AND u.role = 'institution' AND u.is_active = TRUE
      GROUP BY u.id
    `, [id]);
    
    if (!institution) {
      return errors.notFound(res, 'Instituição não encontrada');
    }
    
    // Verifica se o usuário logado segue esta instituição
    let isFollowed = false;
    if (req.user) {
      const follow = await queryOne(
        'SELECT id FROM follows WHERE follower_id = ? AND institution_id = ?',
        [req.user.id, id]
      );
      isFollowed = !!follow;
    }
    
    return success(res, 'Perfil da instituição', {
      institution: {
        ...institution,
        isFollowed
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil da instituição:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista necessidades de uma instituição
 * GET /institutions/:id/needs
 */
async function getInstitutionNeeds(req, res) {
  try {
    const { id } = req.params;
    const { status, category, urgency, limit = 20, offset = 0 } = req.query;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de instituição inválido');
    }
    
    // Verifica se a instituição existe
    const institution = await queryOne(
      'SELECT id, name FROM users WHERE id = ? AND role = "institution" AND is_active = TRUE',
      [id]
    );
    
    if (!institution) {
      return errors.notFound(res, 'Instituição não encontrada');
    }
    
    let sql = `
      SELECT 
        n.*,
        COUNT(d.id) as total_donations,
        SUM(CASE WHEN d.status IN ('confirmada', 'entregue') THEN d.quantity ELSE 0 END) as total_received
      FROM needs n
      LEFT JOIN donations d ON n.id = d.need_id
      WHERE n.institution_id = ?
    `;
    
    const params = [id];
    
    // Filtros opcionais
    if (status && ['ativa', 'em_andamento', 'concluida', 'cancelada'].includes(status)) {
      sql += ' AND n.status = ?';
      params.push(status);
    }
    
    if (category && ['alimentos', 'roupas', 'medicamentos', 'brinquedos', 'materiais', 'outros'].includes(category)) {
      sql += ' AND n.category = ?';
      params.push(category);
    }
    
    if (urgency && ['baixa', 'media', 'alta', 'critica'].includes(urgency)) {
      sql += ' AND n.urgency = ?';
      params.push(urgency);
    }
    
    sql += ' GROUP BY n.id';
    sql += ' ORDER BY n.urgency = "critica" DESC, n.urgency = "alta" DESC, n.created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const needs = await query(sql, params);
    
    // Query para contar total
    let countSql = 'SELECT COUNT(*) as total FROM needs WHERE institution_id = ?';
    const countParams = [id];
    
    if (status && ['ativa', 'em_andamento', 'concluida', 'cancelada'].includes(status)) {
      countSql += ' AND status = ?';
      countParams.push(status);
    }
    
    if (category && ['alimentos', 'roupas', 'medicamentos', 'brinquedos', 'materiais', 'outros'].includes(category)) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }
    
    if (urgency && ['baixa', 'media', 'alta', 'critica'].includes(urgency)) {
      countSql += ' AND urgency = ?';
      countParams.push(urgency);
    }
    
    const [countResult] = await query(countSql, countParams);
    const total = countResult.total;
    
    return success(res, 'Necessidades da instituição', {
      institution: {
        id: institution.id,
        name: institution.name
      },
      needs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar necessidades da instituição:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista seguidores de uma instituição
 * GET /institutions/:id/followers
 */
async function getInstitutionFollowers(req, res) {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de instituição inválido');
    }
    
    // Verifica se a instituição existe
    const institution = await queryOne(
      'SELECT id, name FROM users WHERE id = ? AND role = "institution" AND is_active = TRUE',
      [id]
    );
    
    if (!institution) {
      return errors.notFound(res, 'Instituição não encontrada');
    }
    
    // Busca seguidores
    const followers = await query(`
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u.created_at as user_created_at,
        f.created_at as followed_at
      FROM follows f
      LEFT JOIN users u ON f.follower_id = u.id
      WHERE f.institution_id = ? AND u.is_active = TRUE
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, parseInt(limit), parseInt(offset)]);
    
    // Conta total de seguidores
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM follows WHERE institution_id = ?',
      [id]
    );
    const total = countResult.total;
    
    return success(res, 'Seguidores da instituição', {
      institution: {
        id: institution.id,
        name: institution.name
      },
      followers,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar seguidores da instituição:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Atualiza perfil da instituição
 * PUT /institutions/:id
 */
async function updateInstitutionProfile(req, res) {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      institution_type, 
      activity_area, 
      phone, 
      address, 
      website 
    } = req.body;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de instituição inválido');
    }
    
    // Verifica se o usuário pode editar esta instituição
    if (req.user.id !== parseInt(id)) {
      return errors.forbidden(res, 'Você só pode editar seu próprio perfil');
    }
    
    // Verifica se é uma instituição
    if (req.user.role !== 'institution') {
      return errors.forbidden(res, 'Apenas instituições podem editar este perfil');
    }
    
    // Busca dados atuais
    const currentInstitution = await queryOne(
      'SELECT * FROM users WHERE id = ? AND role = "institution"',
      [id]
    );
    
    if (!currentInstitution) {
      return errors.notFound(res, 'Instituição não encontrada');
    }
    
    // Prepara dados para atualização
    const updateFields = [];
    const updateValues = [];
    
    if (name && name.trim()) {
      updateFields.push('name = ?');
      updateValues.push(name.trim());
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    
    if (institution_type && institution_type.trim()) {
      updateFields.push('institution_type = ?');
      updateValues.push(institution_type.trim());
    }
    
    if (activity_area && activity_area.trim()) {
      updateFields.push('activity_area = ?');
      updateValues.push(activity_area.trim());
    }
    
    if (phone && phone.trim()) {
      updateFields.push('phone = ?');
      updateValues.push(phone.trim());
    }
    
    if (address !== undefined) {
      updateFields.push('address = ?');
      updateValues.push(address);
    }
    
    if (website && website.trim()) {
      updateFields.push('website = ?');
      updateValues.push(website.trim());
    }
    
    // Atualiza avatar se enviado
    if (req.file) {
      updateFields.push('avatar = ?');
      updateValues.push(`/uploads/avatars/${req.file.filename}`);
    }
    
    if (updateFields.length === 0) {
      return errors.badRequest(res, 'Nenhum dado válido para atualizar');
    }
    
    // Adiciona timestamp de atualização
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);
    
    // Executa atualização
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    // Busca dados atualizados
    const updatedInstitution = await queryOne(`
      SELECT 
        u.*,
        COUNT(DISTINCT n.id) as total_needs,
        COUNT(DISTINCT CASE WHEN n.status = 'ativa' THEN n.id END) as active_needs,
        COUNT(DISTINCT f.id) as followers_count
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id
      LEFT JOIN follows f ON u.id = f.institution_id
      WHERE u.id = ?
      GROUP BY u.id
    `, [id]);
    
    return success(res, 'Perfil da instituição atualizado', {
      institution: updatedInstitution
    });
    
  } catch (error) {
    console.error('Erro ao atualizar perfil da instituição:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista todas as instituições
 * GET /institutions
 */
async function getAllInstitutions(req, res) {
  try {
    const { 
      institution_type, 
      activity_area, 
      verified_only = false, 
      has_active_needs = false,
      limit = 20, 
      offset = 0 
    } = req.query;
    
    let sql = `
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u.description,
        u.institution_type,
        u.activity_area,
        u.address as location,
        u.website,
        u.phone,
        u.is_verified,
        u.created_at,
        COUNT(DISTINCT n.id) as total_needs,
        COUNT(DISTINCT CASE WHEN n.status = 'ativa' THEN n.id END) as active_needs,
        COUNT(DISTINCT f.id) as followers_count
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id
      LEFT JOIN follows f ON u.id = f.institution_id
      WHERE u.role = 'institution' AND u.is_active = TRUE
    `;
    
    const params = [];
    
    // Filtros opcionais
    if (institution_type && institution_type.trim()) {
      sql += ' AND u.institution_type LIKE ?';
      params.push(`%${institution_type.trim()}%`);
    }
    
    if (activity_area && activity_area.trim()) {
      sql += ' AND u.activity_area LIKE ?';
      params.push(`%${activity_area.trim()}%`);
    }
    
    if (verified_only === 'true') {
      sql += ' AND u.is_verified = TRUE';
    }
    
    sql += ' GROUP BY u.id, u.name, u.avatar, u.description, u.institution_type, u.activity_area, u.address, u.website, u.phone, u.is_verified, u.created_at';
    
    if (has_active_needs === 'true') {
      sql += ' HAVING active_needs > 0';
    }
    
    sql += ' ORDER BY u.is_verified DESC, active_needs DESC, followers_count DESC, u.name';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const institutions = await query(sql, params);
    
    // Query para contar total
    let countSql = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id
      WHERE u.role = 'institution' AND u.is_active = TRUE
    `;
    
    const countParams = [];
    
    if (institution_type && institution_type.trim()) {
      countSql += ' AND u.institution_type LIKE ?';
      countParams.push(`%${institution_type.trim()}%`);
    }
    
    if (activity_area && activity_area.trim()) {
      countSql += ' AND u.activity_area LIKE ?';
      countParams.push(`%${activity_area.trim()}%`);
    }
    
    if (verified_only === 'true') {
      countSql += ' AND u.is_verified = TRUE';
    }
    
    if (has_active_needs === 'true') {
      countSql += ' AND EXISTS(SELECT 1 FROM needs n2 WHERE n2.institution_id = u.id AND n2.status = "ativa")';
    }
    
    const [countResult] = await query(countSql, countParams);
    const total = countResult.total;
    
    return success(res, 'Instituições encontradas', {
      institutions,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar instituições:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca estatísticas de uma instituição
 * GET /institutions/:id/stats
 */
async function getInstitutionStats(req, res) {
  try {
    const { id } = req.params;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de instituição inválido');
    }
    
    // Verifica se a instituição existe
    const institution = await queryOne(
      'SELECT id, name FROM users WHERE id = ? AND role = "institution" AND is_active = TRUE',
      [id]
    );
    
    if (!institution) {
      return errors.notFound(res, 'Instituição não encontrada');
    }
    
    // Estatísticas gerais
    const [generalStats] = await query(`
      SELECT 
        COUNT(DISTINCT n.id) as total_needs,
        COUNT(DISTINCT CASE WHEN n.status = 'ativa' THEN n.id END) as active_needs,
        COUNT(DISTINCT CASE WHEN n.status = 'concluida' THEN n.id END) as completed_needs,
        COUNT(DISTINCT f.id) as total_followers
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id
      LEFT JOIN follows f ON u.id = f.institution_id
      WHERE u.id = ?
    `, [id]);
    
    // Estatísticas de doações
    const [donationStats] = await query(`
      SELECT 
        COUNT(DISTINCT d.id) as total_donations,
        SUM(CASE WHEN d.status = 'entregue' THEN d.quantity ELSE 0 END) as total_received,
        SUM(CASE WHEN d.status = 'pendente' THEN 1 ELSE 0 END) as pending_donations,
        SUM(CASE WHEN d.status = 'confirmada' THEN 1 ELSE 0 END) as confirmed_donations
      FROM donations d
      WHERE d.institution_id = ?
    `, [id]);
    
    // Necessidades por categoria
    const needsByCategory = await query(`
      SELECT 
        n.category,
        COUNT(*) as count,
        SUM(CASE WHEN n.status = 'ativa' THEN 1 ELSE 0 END) as active_count
      FROM needs n
      WHERE n.institution_id = ?
      GROUP BY n.category
      ORDER BY count DESC
    `, [id]);
    
    // Necessidades por urgência
    const needsByUrgency = await query(`
      SELECT 
        n.urgency,
        COUNT(*) as count,
        SUM(CASE WHEN n.status = 'ativa' THEN 1 ELSE 0 END) as active_count
      FROM needs n
      WHERE n.institution_id = ?
      GROUP BY n.urgency
      ORDER BY 
        CASE n.urgency 
          WHEN 'critica' THEN 1 
          WHEN 'alta' THEN 2 
          WHEN 'media' THEN 3 
          WHEN 'baixa' THEN 4 
        END
    `, [id]);
    
    return success(res, 'Estatísticas da instituição', {
      institution: {
        id: institution.id,
        name: institution.name
      },
      stats: {
        general: generalStats,
        donations: donationStats,
        needsByCategory,
        needsByUrgency
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas da instituição:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getInstitutionProfile,
  getInstitutionNeeds,
  getInstitutionFollowers,
  updateInstitutionProfile,
  getAllInstitutions,
  getInstitutionStats
};
