const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');

/**
 * Busca geral (necessidades e instituições)
 * GET /search
 */
async function searchAll(req, res) {
  try {
    const { q, category, urgency, location, limit = 20, offset = 0 } = req.query;
    
    const results = {
      needs: [],
      institutions: [],
      total: 0
    };
    
    // Busca necessidades
    let needsSql = `
      SELECT 
        n.*,
        u.name as institution_name,
        u.avatar as institution_avatar,
        u.address as institution_location,
        u.is_verified as institution_verified
      FROM needs n
      LEFT JOIN users u ON n.institution_id = u.id
      WHERE n.status = 'ativa'
    `;
    
    const needsParams = [];
    
    if (q && q.trim()) {
      needsSql += ' AND (n.title LIKE ? OR n.description LIKE ? OR u.name LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      needsParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category && ['alimentos', 'roupas', 'medicamentos', 'brinquedos', 'materiais', 'outros'].includes(category)) {
      needsSql += ' AND n.category = ?';
      needsParams.push(category);
    }
    
    if (urgency && ['baixa', 'media', 'alta', 'critica'].includes(urgency)) {
      needsSql += ' AND n.urgency = ?';
      needsParams.push(urgency);
    }
    
    if (location && location.trim()) {
      needsSql += ' AND (n.location LIKE ? OR u.address LIKE ?)';
      const locationTerm = `%${location.trim()}%`;
      needsParams.push(locationTerm, locationTerm);
    }
    
    needsSql += ' ORDER BY n.urgency = "critica" DESC, n.urgency = "alta" DESC, n.created_at DESC';
    needsSql += ' LIMIT ? OFFSET ?';
    needsParams.push(parseInt(limit), parseInt(offset));
    
    results.needs = await query(needsSql, needsParams);
    
    // Busca instituições
    let institutionsSql = `
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u.address as location,
        u.description,
        u.institution_type,
        u.activity_area,
        u.is_verified,
        COUNT(n.id) as active_needs_count
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id AND n.status = 'ativa'
      WHERE u.role = 'institution' AND u.is_active = TRUE
    `;
    
    const institutionsParams = [];
    
    if (q && q.trim()) {
      institutionsSql += ' AND (u.name LIKE ? OR u.description LIKE ? OR u.institution_type LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      institutionsParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (location && location.trim()) {
      institutionsSql += ' AND u.address LIKE ?';
      institutionsParams.push(`%${location.trim()}%`);
    }
    
    institutionsSql += ' GROUP BY u.id, u.name, u.avatar, u.address, u.description, u.institution_type, u.activity_area, u.is_verified';
    institutionsSql += ' ORDER BY active_needs_count DESC, u.name';
    institutionsSql += ' LIMIT ? OFFSET ?';
    institutionsParams.push(parseInt(limit), parseInt(offset));
    
    results.institutions = await query(institutionsSql, institutionsParams);
    
    results.total = results.needs.length + results.institutions.length;
    
    return success(res, 'Resultados da busca', {
      results,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Erro na busca geral:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca apenas necessidades
 * GET /search/needs
 */
async function searchNeeds(req, res) {
  try {
    const { q, category, urgency, location, sort = 'recentes', limit = 20, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        n.*,
        u.name as institution_name,
        u.avatar as institution_avatar,
        u.address as institution_location,
        u.is_verified as institution_verified,
        u.phone as institution_phone,
        u.website as institution_website
      FROM needs n
      LEFT JOIN users u ON n.institution_id = u.id
      WHERE n.status = 'ativa'
    `;
    
    const params = [];
    
    // Filtros de busca
    if (q && q.trim()) {
      sql += ' AND (n.title LIKE ? OR n.description LIKE ? OR u.name LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category && ['alimentos', 'roupas', 'medicamentos', 'brinquedos', 'materiais', 'outros'].includes(category)) {
      sql += ' AND n.category = ?';
      params.push(category);
    }
    
    if (urgency && ['baixa', 'media', 'alta', 'critica'].includes(urgency)) {
      sql += ' AND n.urgency = ?';
      params.push(urgency);
    }
    
    if (location && location.trim()) {
      sql += ' AND (n.location LIKE ? OR u.address LIKE ?)';
      const locationTerm = `%${location.trim()}%`;
      params.push(locationTerm, locationTerm);
    }
    
    // Ordenação
    switch (sort) {
      case 'urgencia':
        sql += ' ORDER BY n.urgency = "critica" DESC, n.urgency = "alta" DESC, n.urgency = "media" DESC, n.created_at DESC';
        break;
      case 'proximidade':
        // TODO: Implementar ordenação por proximidade geográfica
        sql += ' ORDER BY n.created_at DESC';
        break;
      case 'relevancia':
        // TODO: Implementar algoritmo de relevância
        sql += ' ORDER BY n.urgency = "critica" DESC, n.created_at DESC';
        break;
      default: // recentes
        sql += ' ORDER BY n.created_at DESC';
    }
    
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const needs = await query(sql, params);
    
    // Query para contar total
    let countSql = `
      SELECT COUNT(*) as total 
      FROM needs n
      LEFT JOIN users u ON n.institution_id = u.id
      WHERE n.status = 'ativa'
    `;
    
    const countParams = [];
    
    if (q && q.trim()) {
      countSql += ' AND (n.title LIKE ? OR n.description LIKE ? OR u.name LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (category && ['alimentos', 'roupas', 'medicamentos', 'brinquedos', 'materiais', 'outros'].includes(category)) {
      countSql += ' AND n.category = ?';
      countParams.push(category);
    }
    
    if (urgency && ['baixa', 'media', 'alta', 'critica'].includes(urgency)) {
      countSql += ' AND n.urgency = ?';
      countParams.push(urgency);
    }
    
    if (location && location.trim()) {
      countSql += ' AND (n.location LIKE ? OR u.address LIKE ?)';
      const locationTerm = `%${location.trim()}%`;
      countParams.push(locationTerm, locationTerm);
    }
    
    const [countResult] = await query(countSql, countParams);
    const total = countResult.total;
    
    return success(res, 'Necessidades encontradas', {
      needs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('Erro na busca de necessidades:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca apenas instituições
 * GET /search/institutions
 */
async function searchInstitutions(req, res) {
  try {
    const { q, institution_type, activity_area, location, verified_only = false, limit = 20, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        u.id,
        u.name,
        u.avatar,
        u.address as location,
        u.description,
        u.institution_type,
        u.activity_area,
        u.website,
        u.phone,
        u.is_verified,
        COUNT(n.id) as active_needs_count,
        COUNT(f.id) as followers_count
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id AND n.status = 'ativa'
      LEFT JOIN follows f ON u.id = f.institution_id
      WHERE u.role = 'institution' AND u.is_active = TRUE
    `;
    
    const params = [];
    
    // Filtros de busca
    if (q && q.trim()) {
      sql += ' AND (u.name LIKE ? OR u.description LIKE ? OR u.institution_type LIKE ? OR u.activity_area LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (institution_type && institution_type.trim()) {
      sql += ' AND u.institution_type LIKE ?';
      params.push(`%${institution_type.trim()}%`);
    }
    
    if (activity_area && activity_area.trim()) {
      sql += ' AND u.activity_area LIKE ?';
      params.push(`%${activity_area.trim()}%`);
    }
    
    if (location && location.trim()) {
      sql += ' AND u.address LIKE ?';
      params.push(`%${location.trim()}%`);
    }
    
    if (verified_only === 'true') {
      sql += ' AND u.is_verified = TRUE';
    }
    
    sql += ' GROUP BY u.id, u.name, u.avatar, u.address, u.description, u.institution_type, u.activity_area, u.website, u.phone, u.is_verified';
    sql += ' ORDER BY u.is_verified DESC, active_needs_count DESC, followers_count DESC, u.name';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const institutions = await query(sql, params);
    
    // Query para contar total
    let countSql = `
      SELECT COUNT(DISTINCT u.id) as total 
      FROM users u
      WHERE u.role = 'institution' AND u.is_active = TRUE
    `;
    
    const countParams = [];
    
    if (q && q.trim()) {
      countSql += ' AND (u.name LIKE ? OR u.description LIKE ? OR u.institution_type LIKE ? OR u.activity_area LIKE ?)';
      const searchTerm = `%${q.trim()}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    if (institution_type && institution_type.trim()) {
      countSql += ' AND u.institution_type LIKE ?';
      countParams.push(`%${institution_type.trim()}%`);
    }
    
    if (activity_area && activity_area.trim()) {
      countSql += ' AND u.activity_area LIKE ?';
      countParams.push(`%${activity_area.trim()}%`);
    }
    
    if (location && location.trim()) {
      countSql += ' AND u.address LIKE ?';
      countParams.push(`%${location.trim()}%`);
    }
    
    if (verified_only === 'true') {
      countSql += ' AND u.is_verified = TRUE';
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
    console.error('Erro na busca de instituições:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca sugestões de autocomplete
 * GET /search/suggestions
 */
async function getSearchSuggestions(req, res) {
  try {
    const { q, type = 'all' } = req.query;
    
    if (!q || q.trim().length < 2) {
      return success(res, 'Sugestões vazias', { suggestions: [] });
    }
    
    const suggestions = [];
    const searchTerm = `%${q.trim()}%`;
    
    // Sugestões de necessidades (títulos)
    if (type === 'all' || type === 'needs') {
      const needSuggestions = await query(`
        SELECT DISTINCT n.title as suggestion, 'need' as type
        FROM needs n
        WHERE n.status = 'ativa' AND n.title LIKE ?
        ORDER BY n.created_at DESC
        LIMIT 5
      `, [searchTerm]);
      
      suggestions.push(...needSuggestions);
    }
    
    // Sugestões de instituições
    if (type === 'all' || type === 'institutions') {
      const institutionSuggestions = await query(`
        SELECT DISTINCT u.name as suggestion, 'institution' as type
        FROM users u
        WHERE u.role = 'institution' AND u.is_active = TRUE AND u.name LIKE ?
        ORDER BY u.is_verified DESC, u.name
        LIMIT 5
      `, [searchTerm]);
      
      suggestions.push(...institutionSuggestions);
    }
    
    // Sugestões de categorias
    if (type === 'all' || type === 'categories') {
      const categorySuggestions = await query(`
        SELECT DISTINCT n.category as suggestion, 'category' as type
        FROM needs n
        WHERE n.status = 'ativa' AND n.category LIKE ?
        ORDER BY COUNT(*) DESC
        LIMIT 3
      `, [searchTerm]);
      
      suggestions.push(...categorySuggestions);
    }
    
    return success(res, 'Sugestões encontradas', { suggestions });
    
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca estatísticas de busca
 * GET /search/stats
 */
async function getSearchStats(req, res) {
  try {
    // Estatísticas gerais
    const [totalStats] = await query(`
      SELECT 
        (SELECT COUNT(*) FROM needs WHERE status = 'ativa') as total_needs,
        (SELECT COUNT(*) FROM users WHERE role = 'institution' AND is_active = TRUE) as total_institutions,
        (SELECT COUNT(DISTINCT category) FROM needs WHERE status = 'ativa') as total_categories
    `);
    
    // Categorias mais populares
    const popularCategories = await query(`
      SELECT 
        category,
        COUNT(*) as count
      FROM needs 
      WHERE status = 'ativa'
      GROUP BY category
      ORDER BY count DESC
      LIMIT 10
    `);
    
    // Instituições com mais necessidades
    const topInstitutions = await query(`
      SELECT 
        u.name,
        u.avatar,
        COUNT(n.id) as needs_count
      FROM users u
      LEFT JOIN needs n ON u.id = n.institution_id AND n.status = 'ativa'
      WHERE u.role = 'institution' AND u.is_active = TRUE
      GROUP BY u.id, u.name, u.avatar
      ORDER BY needs_count DESC
      LIMIT 10
    `);
    
    return success(res, 'Estatísticas de busca', {
      stats: {
        total: totalStats,
        popularCategories,
        topInstitutions
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de busca:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  searchAll,
  searchNeeds,
  searchInstitutions,
  getSearchSuggestions,
  getSearchStats
};
