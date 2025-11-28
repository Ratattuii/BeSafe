const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Cria uma nova avaliação para uma donation_offer
 * POST /reviews
 */
async function createReview(req, res) {
  try {
    const { donation_id, reviewed_id, rating, comment, review_type } = req.body;
    const reviewer_id = req.user.id;

    // Validações básicas
    const validationError = validateRequired(
      ['donation_id', 'reviewed_id', 'rating', 'review_type'],
      { donation_id, reviewed_id, rating, review_type }
    );
    
    if (validationError) {
      return errors.badRequest(res, validationError);
    }

    if (rating < 1 || rating > 5) {
      return errors.badRequest(res, 'Rating deve ser entre 1 e 5');
    }

    if (reviewer_id === parseInt(reviewed_id)) {
      return errors.badRequest(res, 'Você não pode se avaliar');
    }

    // Verifica se a donation_offer existe e está finalizada
    const donationOffer = await queryOne(`
      SELECT * FROM donation_offers 
      WHERE id = ? AND status IN ('donated', 'entregue', 'concluido', 'doado')
    `, [donation_id]);

    if (!donationOffer) {
      return errors.notFound(res, 'Oferta de doação não encontrada ou não foi finalizada');
    }

    // Verifica se o usuário tem permissão para avaliar esta doação
    let canReview = false;

    if (review_type === 'donor_to_institution') {
      // Doador avaliando instituição - deve ser o donor da oferta
      canReview = donationOffer.donor_id === reviewer_id;
    } else if (review_type === 'institution_to_donor') {
      // Instituição avaliando doador - deve ser a institution da oferta
      canReview = donationOffer.institution_id === reviewer_id;
    } else {
      return errors.badRequest(res, 'Tipo de avaliação inválido');
    }

    if (!canReview) {
      return errors.forbidden(res, 'Você não tem permissão para avaliar esta doação');
    }

    // Verifica se o usuário avaliado existe
    const reviewedUser = await queryOne('SELECT id, name, role FROM users WHERE id = ?', [reviewed_id]);
    
    if (!reviewedUser) {
      return errors.notFound(res, 'Usuário a ser avaliado não encontrado');
    }

    // Verifica se já existe uma avaliação para esta donation_offer deste tipo
    const existingReview = await queryOne(`
      SELECT id FROM reviews 
      WHERE donation_offer_id = ? AND reviewer_id = ? AND review_type = ?
    `, [donation_id, reviewer_id, review_type]);

    if (existingReview) {
      return errors.conflict(res, 'Você já avaliou esta oferta de doação');
    }

    // Cria a avaliação
    const result = await query(`
      INSERT INTO reviews (donation_offer_id, reviewer_id, reviewed_id, rating, comment, review_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [donation_id, reviewer_id, reviewed_id, rating, comment, review_type]);

    if (result.affectedRows === 0) {
      return errors.serverError(res, 'Erro ao salvar avaliação no banco de dados');
    }

    // Busca a avaliação criada
    const newReview = await queryOne(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        reviewed.name as reviewed_name,
        reviewed.avatar as reviewed_avatar,
        do.title as donation_title,
        do.quantity as donation_quantity,
        do.category as donation_category,
        do.description as donation_description
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      LEFT JOIN donation_offers do ON r.donation_offer_id = do.id
      WHERE r.id = ?
    `, [result.insertId]);

    return success(res, 'Avaliação criada com sucesso', { review: newReview }, 201);

  } catch (error) {
    console.error('Erro ao criar avaliação:', error.message);
    
    // Verificar se é erro de constraint única
    if (error.code === 'ER_DUP_ENTRY') {
      return errors.conflict(res, 'Você já avaliou esta oferta de doação');
    }
    
    // Verificar se é erro de chave estrangeira
    if (error.code === 'ER_NO_REFERENCED_ROW' || error.code === 'ER_NO_REFERENCED_ROW_2') {
      return errors.badRequest(res, 'Dados inválidos para criar avaliação');
    }
    
    return errors.serverError(res);
  }
}

/**
 * Lista avaliações de uma donation_offer específica
 * GET /reviews/donation/:donationId
 */
async function getDonationReviews(req, res) {
  try {
    const { donationId } = req.params;

    if (!donationId || isNaN(donationId)) {
      return errors.badRequest(res, 'ID de oferta inválido');
    }

    const reviews = await query(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        reviewer.role as reviewer_role,
        reviewed.name as reviewed_name,
        reviewed.avatar as reviewed_avatar,
        reviewed.role as reviewed_role,
        do.title as donation_title
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      LEFT JOIN donation_offers do ON r.donation_offer_id = do.id
      WHERE r.donation_offer_id = ? AND r.is_public = TRUE
      ORDER BY r.created_at DESC
    `, [donationId]);

    return success(res, 'Avaliações encontradas', { reviews });

  } catch (error) {
    console.error('Erro ao buscar avaliações da oferta:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista avaliações recebidas por um usuário
 * GET /reviews/user/:userId/received
 */
async function getUserReceivedReviews(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId || isNaN(userId)) {
      return errors.badRequest(res, 'ID de usuário inválido');
    }

    const reviews = await query(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        reviewer.role as reviewer_role,
        do.title as donation_title,
        do.quantity as donation_quantity,
        do.category as donation_category
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN donation_offers do ON r.donation_offer_id = do.id
      WHERE r.reviewed_id = ? AND r.is_public = TRUE
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    // Calcula estatísticas
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
      FROM reviews 
      WHERE reviewed_id = ? AND is_public = TRUE
    `, [userId]);

    return success(res, 'Avaliações recebidas encontradas', { 
      reviews, 
      stats: {
        ...stats,
        average_rating: parseFloat(stats.average_rating || 0).toFixed(1)
      }
    });

  } catch (error) {
    console.error('Erro ao buscar avaliações recebidas:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista avaliações feitas por um usuário
 * GET /reviews/user/:userId/given
 */
async function getUserGivenReviews(req, res) {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId || isNaN(userId)) {
      return errors.badRequest(res, 'ID de usuário inválido');
    }

    const reviews = await query(`
      SELECT 
        r.*,
        reviewed.name as reviewed_name,
        reviewed.avatar as reviewed_avatar,
        reviewed.role as reviewed_role,
        do.title as donation_title,
        do.quantity as donation_quantity,
        do.category as donation_category
      FROM reviews r
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      LEFT JOIN donation_offers do ON r.donation_offer_id = do.id
      WHERE r.reviewer_id = ? AND r.is_public = TRUE
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    return success(res, 'Avaliações feitas encontradas', { reviews });

  } catch (error) {
    console.error('Erro ao buscar avaliações feitas:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Atualiza uma avaliação
 * PUT /reviews/:id
 */
async function updateReview(req, res) {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const user_id = req.user.id;

    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de avaliação inválido');
    }

    if (rating && (rating < 1 || rating > 5)) {
      return errors.badRequest(res, 'Rating deve ser entre 1 e 5');
    }

    // Busca a avaliação
    const review = await queryOne(
      'SELECT * FROM reviews WHERE id = ? AND reviewer_id = ?',
      [id, user_id]
    );

    if (!review) {
      return errors.notFound(res, 'Avaliação não encontrada');
    }

    // Atualiza a avaliação
    const updateFields = [];
    const updateValues = [];

    if (rating !== undefined) {
      updateFields.push('rating = ?');
      updateValues.push(rating);
    }

    if (comment !== undefined) {
      updateFields.push('comment = ?');
      updateValues.push(comment);
    }

    if (updateFields.length === 0) {
      return errors.badRequest(res, 'Nenhum campo para atualizar');
    }

    updateValues.push(id);
    await query(
      `UPDATE reviews SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    // Busca a avaliação atualizada
    const updatedReview = await queryOne(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        reviewed.name as reviewed_name,
        reviewed.avatar as reviewed_avatar,
        do.title as donation_title
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      LEFT JOIN donation_offers do ON r.donation_offer_id = do.id
      WHERE r.id = ?
    `, [id]);

    return success(res, 'Avaliação atualizada com sucesso', { review: updatedReview });

  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Remove uma avaliação
 * DELETE /reviews/:id
 */
async function deleteReview(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de avaliação inválido');
    }

    // Busca a avaliação
    const review = await queryOne(
      'SELECT * FROM reviews WHERE id = ? AND reviewer_id = ?',
      [id, user_id]
    );

    if (!review) {
      return errors.notFound(res, 'Avaliação não encontrada');
    }

    // Remove a avaliação
    await query('DELETE FROM reviews WHERE id = ?', [id]);

    return success(res, 'Avaliação removida com sucesso');

  } catch (error) {
    console.error('Erro ao remover avaliação:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista todas as avaliações (para admin)
 * GET /reviews
 */
async function getAllReviews(req, res) {
  try {
    const { limit = 50, offset = 0, rating, review_type } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (rating && !isNaN(rating)) {
      whereClause += ' AND r.rating = ?';
      params.push(parseInt(rating));
    }

    if (review_type) {
      whereClause += ' AND r.review_type = ?';
      params.push(review_type);
    }

    params.push(parseInt(limit), parseInt(offset));

    const reviews = await query(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        reviewer.role as reviewer_role,
        reviewed.name as reviewed_name,
        reviewed.avatar as reviewed_avatar,
        reviewed.role as reviewed_role,
        do.title as donation_title,
        do.status as offer_status
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      LEFT JOIN donation_offers do ON r.donation_offer_id = do.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, params);

    // Total de avaliações
    const [countResult] = await query(`
      SELECT COUNT(*) as total FROM reviews r ${whereClause}
    `, params.slice(0, -2)); // Remove limit e offset

    return success(res, 'Avaliações encontradas', {
      reviews,
      pagination: {
        total: countResult.total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < countResult.total
      }
    });

  } catch (error) {
    console.error('Erro ao buscar todas as avaliações:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  createReview,
  getDonationReviews,
  getUserReceivedReviews,
  getUserGivenReviews,
  updateReview,
  deleteReview,
  getAllReviews
};