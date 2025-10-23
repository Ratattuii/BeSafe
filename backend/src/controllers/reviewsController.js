const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Cria uma nova avaliação
 * POST /reviews
 */
async function createReview(req, res) {
  try {
    const { donation_id, reviewed_id, rating, comment, review_type } = req.body;
    const reviewer_id = req.user.id;

    // Validações
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

    // Verifica se a doação existe e se o usuário tem permissão para avaliar
    const donation = await queryOne(`
      SELECT d.*, n.title as need_title
      FROM donations d
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE d.id = ? AND d.status = 'entregue'
    `, [donation_id]);

    if (!donation) {
      return errors.notFound(res, 'Doação não encontrada ou não entregue');
    }

    // Verifica se o usuário tem permissão para avaliar esta doação
    const canReview = await queryOne(`
      SELECT 1 FROM donations 
      WHERE id = ? AND (donor_id = ? OR institution_id = ?)
    `, [donation_id, reviewer_id, reviewer_id]);

    if (!canReview) {
      return errors.forbidden(res, 'Você não tem permissão para avaliar esta doação');
    }

    // Verifica se já existe uma avaliação deste tipo
    const existingReview = await queryOne(`
      SELECT id FROM reviews 
      WHERE donation_id = ? AND reviewer_id = ? AND review_type = ?
    `, [donation_id, reviewer_id, review_type]);

    if (existingReview) {
      return errors.conflict(res, 'Você já avaliou esta doação com este tipo de avaliação');
    }

    // Cria a avaliação
    const result = await query(`
      INSERT INTO reviews (donation_id, reviewer_id, reviewed_id, rating, comment, review_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [donation_id, reviewer_id, reviewed_id, rating, comment, review_type]);

    // Busca a avaliação criada
    const newReview = await queryOne(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        reviewed.name as reviewed_name,
        reviewed.avatar as reviewed_avatar,
        d.quantity as donation_quantity,
        d.unit as donation_unit,
        n.title as need_title
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      LEFT JOIN donations d ON r.donation_id = d.id
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE r.id = ?
    `, [result.insertId]);

    return success(res, 'Avaliação criada com sucesso', { review: newReview }, 201);

  } catch (error) {
    console.error('Erro ao criar avaliação:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista avaliações de uma doação específica
 * GET /reviews/donation/:donationId
 */
async function getDonationReviews(req, res) {
  try {
    const { donationId } = req.params;

    if (!donationId || isNaN(donationId)) {
      return errors.badRequest(res, 'ID de doação inválido');
    }

    const reviews = await query(`
      SELECT 
        r.*,
        reviewer.name as reviewer_name,
        reviewer.avatar as reviewer_avatar,
        reviewer.role as reviewer_role,
        reviewed.name as reviewed_name,
        reviewed.avatar as reviewed_avatar,
        reviewed.role as reviewed_role
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      WHERE r.donation_id = ? AND r.is_public = TRUE
      ORDER BY r.created_at DESC
    `, [donationId]);

    return success(res, 'Avaliações encontradas', { reviews });

  } catch (error) {
    console.error('Erro ao buscar avaliações da doação:', error.message);
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
        d.quantity as donation_quantity,
        d.unit as donation_unit,
        n.title as need_title
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN donations d ON r.donation_id = d.id
      LEFT JOIN needs n ON d.need_id = n.id
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
        d.quantity as donation_quantity,
        d.unit as donation_unit,
        n.title as need_title
      FROM reviews r
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
      LEFT JOIN donations d ON r.donation_id = d.id
      LEFT JOIN needs n ON d.need_id = n.id
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
        reviewed.avatar as reviewed_avatar
      FROM reviews r
      LEFT JOIN users reviewer ON r.reviewer_id = reviewer.id
      LEFT JOIN users reviewed ON r.reviewed_id = reviewed.id
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

module.exports = {
  createReview,
  getDonationReviews,
  getUserReceivedReviews,
  getUserGivenReviews,
  updateReview,
  deleteReview
};
