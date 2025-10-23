const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Lista necessidades com filtros opcionais
 * GET /needs?urgency=alta&type=alimento&location=São Paulo
 */
async function getNeedsWithFilters(req, res) {
  try {
    const { urgency, category, location, limit = 20, offset = 0 } = req.query;
    
    // Query base usando a view criada
    let sql = `
      SELECT 
        id, title, description, urgency, category, quantity_needed, quantity_received, unit, location,
        status, created_at,
        institution_id, institution_name, institution_avatar, 
        institution_location, institution_verified
      FROM needs_with_institution 
      WHERE 1=1
    `;
    
    const params = [];
    
    // Aplicar filtros opcionais
    if (urgency && ['critica', 'alta', 'media', 'baixa'].includes(urgency)) {
      sql += ' AND urgency = ?';
      params.push(urgency);
    }
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (location) {
      sql += ' AND (location LIKE ? OR institution_location LIKE ?)';
      params.push(`%${location}%`, `%${location}%`);
    }
    
    // Ordenação e paginação
    sql += ' ORDER BY urgency = "critica" DESC, urgency = "alta" DESC, created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    // =================================================================
    // LOGS DE DEPURAÇÃO ADICIONADOS
    // =================================================================
    console.log('--- DEBUG: EXECUTANDO QUERY 1 (NEEDS) ---');
    console.log('SQL:', sql);
    console.log('PARAMS:', params);
    // =================================================================
    
    const needs = await query(sql, params);
    
    // Query para contar total (para paginação)
    let countSql = `
      SELECT COUNT(*) as total 
      FROM needs_with_institution 
      WHERE 1=1
    `;
    
    const countParams = [];
    
    if (urgency && ['critica', 'alta', 'media', 'baixa'].includes(urgency)) {
      countSql += ' AND urgency = ?';
      countParams.push(urgency);
    }
    
    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }
    
    if (location) {
      countSql += ' AND (location LIKE ? OR institution_location LIKE ?)';
      countParams.push(`%${location}%`, `%${location}%`);
    }
    
    // =================================================================
    // LOGS DE DEPURAÇÃO ADICIONADOS
    // =================================================================
    console.log('--- DEBUG: EXECUTANDO QUERY 2 (COUNT) ---');
    console.log('SQL (Count):', countSql);
    console.log('PARAMS (Count):', countParams);
    // =================================================================
    
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
    console.error('Erro ao buscar necessidades:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Cria uma nova necessidade (para teste)
 * POST /needs
 */
async function createNeed(req, res) {
  try {
    const { title, description, urgency, category, quantity_needed, unit, location } = req.body;
    
    // Validações básicas
    const validationError = validateRequired(
      ['title', 'description', 'urgency', 'category', 'quantity_needed'], 
      { title, description, urgency, category, quantity_needed }
    );
    
    if (validationError) {
      return errors.badRequest(res, validationError);
    }
    
    // Para teste, usar institution_id = 1 (Cruz Vermelha)
    // Em produção, pegar do token do usuário autenticado
    const institution_id = 1;
    
    const result = await query(`
      INSERT INTO needs 
      (institution_id, title, description, urgency, category, quantity_needed, unit, location) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      institution_id, title, description, urgency, category, 
      parseInt(quantity_needed), unit || 'unidades', location
    ]);
    
    // Busca a necessidade criada com dados da instituição
    const newNeed = await queryOne(`
      SELECT * FROM needs_with_institution WHERE id = ?
    `, [result.insertId]);
    
    return success(res, 'Necessidade criada com sucesso', { need: newNeed }, 201);
    
  } catch (error) {
    console.error('Erro ao criar necessidade:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca uma necessidade específica por ID
 * GET /needs/:id
 */
async function getNeedById(req, res) {
  try {
    const { id } = req.params;
    
    const need = await queryOne(`
      SELECT * FROM needs_with_institution WHERE id = ?
    `, [id]);
    
    if (!need) {
      return errors.notFound(res, 'Necessidade não encontrada');
    }
    
    return success(res, 'Necessidade encontrada', { need });
    
  } catch (error) {
    console.error('Erro ao buscar necessidade:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista tipos de necessidades disponíveis
 * GET /needs/types
 */
async function getNeedTypes(req, res) {
  try {
    const categories = await query(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM needs 
      WHERE status = 'ativa' 
      GROUP BY category 
      ORDER BY count DESC, category
    `);
    
    return success(res, 'Tipos de necessidades', { categories });
    
  } catch (error) {
    console.error('Erro ao buscar tipos:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getNeedsWithFilters,
  createNeed,
  getNeedById,
  getNeedTypes
};