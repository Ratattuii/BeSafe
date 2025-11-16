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
 * Cria uma nova necessidade
 * POST /needs
 */
async function createNeed(req, res) {
  try {
    console.log('📦 Body completo:', req.body);
    
    const { title, description, urgency, type, category, quantity, unit, location } = req.body;
    
    const finalCategory = category || type;
    
    console.log('🎯 Category final:', finalCategory);
    console.log('📍 Location:', location);
    console.log('🔢 Quantity (goal_quantity):', quantity);
    
    // Validações
    const validationErrors = [];
    
    if (!title) validationErrors.push('Título é obrigatório');
    if (!description) validationErrors.push('Descrição é obrigatória');
    if (!urgency) validationErrors.push('Urgência é obrigatória');
    if (!finalCategory) validationErrors.push('Categoria é obrigatória');
    if (!quantity) validationErrors.push('Quantidade é obrigatória');
    if (!location || location.trim() === '') validationErrors.push('Localização é obrigatória');
    
    if (validationErrors.length > 0) {
      console.log('❌ Erros de validação:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: validationErrors
      });
    }
    
    if (req.user.role !== 'institution') {
      return res.status(403).json({
        success: false,
        message: 'Apenas instituições podem criar necessidades'
      });
    }
    
    const institution_id = req.user.id;
    
    console.log('💾 Inserindo no banco...');
    
    // ✅ CORRETO: Usar quantity como quantity_needed
    const result = await query(`
      INSERT INTO needs 
      (institution_id, title, description, urgency, category, quantity_needed, unit, location) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      institution_id, 
      title, 
      description, 
      urgency, 
      finalCategory,
      parseInt(quantity), // ✅ quantity → quantity_needed
      unit || 'unidades', 
      location.trim()
    ]);
    
    console.log('✅ Necessidade criada com ID:', result.insertId);
    
    const newNeed = await queryOne(`
      SELECT * FROM needs_with_institution WHERE id = ?
    `, [result.insertId]);
    
    return res.status(201).json({
      success: true,
      message: 'Necessidade criada com sucesso',
      data: {
        need: newNeed
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar necessidade:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
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

/**
 * Curtir/descurtir uma necessidade
 * POST /needs/:id/like
 */
async function toggleLike(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Verifica se a necessidade existe
    const need = await queryOne('SELECT id FROM needs WHERE id = ?', [id]);
    if (!need) {
      return errors.notFound(res, 'Necessidade não encontrada');
    }
    
    // Verifica se já curtiu
    const existingLike = await queryOne(
      'SELECT id FROM need_likes WHERE need_id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (existingLike) {
      // Remove o like
      await query('DELETE FROM need_likes WHERE id = ?', [existingLike.id]);
      
      // Busca contagem atualizada
      const [countResult] = await query(
        'SELECT COUNT(*) as count FROM need_likes WHERE need_id = ?',
        [id]
      );
      
      return success(res, 'Like removido', {
        liked: false,
        likesCount: countResult.count
      });
    } else {
      // Adiciona o like
      await query(
        'INSERT INTO need_likes (need_id, user_id) VALUES (?, ?)',
        [id, user_id]
      );
      
      // Busca contagem atualizada
      const [countResult] = await query(
        'SELECT COUNT(*) as count FROM need_likes WHERE need_id = ?',
        [id]
      );
      
      return success(res, 'Like adicionado', {
        liked: true,
        likesCount: countResult.count
      });
    }
  } catch (error) {
    console.error('Erro ao curtir necessidade:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista comentários de uma necessidade
 * GET /needs/:id/comments
 */
async function getComments(req, res) {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Verifica se a necessidade existe
    const need = await queryOne('SELECT id FROM needs WHERE id = ?', [id]);
    if (!need) {
      return errors.notFound(res, 'Necessidade não encontrada');
    }
    
    // Busca comentários com dados do usuário
    const comments = await query(`
      SELECT 
        nc.*,
        u.id as user_id,
        u.name as user_name,
        u.avatar as user_avatar
      FROM need_comments nc
      LEFT JOIN users u ON nc.user_id = u.id
      WHERE nc.need_id = ?
      ORDER BY nc.created_at DESC
      LIMIT ? OFFSET ?
    `, [id, parseInt(limit), parseInt(offset)]);
    
    // Conta total de comentários
    const [countResult] = await query(
      'SELECT COUNT(*) as total FROM need_comments WHERE need_id = ?',
      [id]
    );
    
    return success(res, 'Comentários encontrados', {
      comments,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < countResult.total
      }
    });
  } catch (error) {
    console.error('Erro ao buscar comentários:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Adiciona um comentário a uma necessidade
 * POST /needs/:id/comments
 */
async function addComment(req, res) {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const user_id = req.user.id;
    
    // Validações
    if (!comment || !comment.trim()) {
      return errors.badRequest(res, 'Comentário não pode estar vazio');
    }
    
    // Verifica se a necessidade existe
    const need = await queryOne('SELECT id FROM needs WHERE id = ?', [id]);
    if (!need) {
      return errors.notFound(res, 'Necessidade não encontrada');
    }
    
    // Insere o comentário
    const result = await query(
      'INSERT INTO need_comments (need_id, user_id, comment) VALUES (?, ?, ?)',
      [id, user_id, comment.trim()]
    );
    
    // Busca o comentário criado com dados do usuário
    const newComment = await queryOne(`
      SELECT 
        nc.*,
        u.id as user_id,
        u.name as user_name,
        u.avatar as user_avatar
      FROM need_comments nc
      LEFT JOIN users u ON nc.user_id = u.id
      WHERE nc.id = ?
    `, [result.insertId]);
    
    return success(res, 'Comentário adicionado', { comment: newComment }, 201);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Registra um compartilhamento
 * POST /needs/:id/share
 */
async function registerShare(req, res) {
  try {
    const { id } = req.params;
    const { share_type = 'general' } = req.body;
    const user_id = req.user?.id || null;
    
    // Verifica se a necessidade existe
    const need = await queryOne('SELECT id FROM needs WHERE id = ?', [id]);
    if (!need) {
      return errors.notFound(res, 'Necessidade não encontrada');
    }
    
    // Insere o compartilhamento
    await query(
      'INSERT INTO need_shares (need_id, user_id, share_type) VALUES (?, ?, ?)',
      [id, user_id, share_type]
    );
    
    // Busca contagem atualizada
    const [countResult] = await query(
      'SELECT COUNT(*) as count FROM need_shares WHERE need_id = ?',
      [id]
    );
    
    return success(res, 'Compartilhamento registrado', {
      sharesCount: countResult.count
    });
  } catch (error) {
    console.error('Erro ao registrar compartilhamento:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca estatísticas de interação de uma necessidade
 * GET /needs/:id/stats
 */
async function getNeedStats(req, res) {
  try {
    const { id } = req.params;
    
    // Verifica se a necessidade existe
    const need = await queryOne('SELECT id FROM needs WHERE id = ?', [id]);
    if (!need) {
      return errors.notFound(res, 'Necessidade não encontrada');
    }
    
    // Busca estatísticas
    const [likesCount] = await query(
      'SELECT COUNT(*) as count FROM need_likes WHERE need_id = ?',
      [id]
    );
    
    const [commentsCount] = await query(
      'SELECT COUNT(*) as count FROM need_comments WHERE need_id = ?',
      [id]
    );
    
    const [sharesCount] = await query(
      'SELECT COUNT(*) as count FROM need_shares WHERE need_id = ?',
      [id]
    );
    
    // Verifica se o usuário logado curtiu
    let userLiked = false;
    if (req.user) {
      const like = await queryOne(
        'SELECT id FROM need_likes WHERE need_id = ? AND user_id = ?',
        [id, req.user.id]
      );
      userLiked = !!like;
    }
    
    return success(res, 'Estatísticas da necessidade', {
      likes: likesCount.count,
      comments: commentsCount.count,
      shares: sharesCount.count,
      userLiked
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getNeedsWithFilters,
  createNeed,
  getNeedById,
  getNeedTypes,
  toggleLike,
  getComments,
  addComment,
  registerShare,
  getNeedStats
};