const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Cria uma nova oferta de doação (um item postado por um doador)
 * POST /offers
 */
async function createOffer(req, res) {
  try {
    const donor_id = req.user.id;
    const {
      title,
      description,
      quantity,
      category,
      conditions, // Renomeado de condition
      location,
      availability,
    } = req.body;

    // Validação
    const validationError = validateRequired(
      ['title', 'description', 'quantity', 'category', 'conditions', 'availability'],
      req.body
    );
    
    if (validationError) {
      return errors.badRequest(res, validationError);
    }

    // Insere no banco
    const result = await query(
      `INSERT INTO donation_offers 
       (donor_id, title, description, quantity, category, conditions, location, availability, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [
        donor_id,
        title,
        description,
        quantity,
        category,
        conditions, // Renomeado de condition
        location || null,
        availability,
      ]
    );

    const newOffer = await queryOne(
      'SELECT * FROM donation_offers WHERE id = ?',
      [result.insertId]
    );

    return success(res, 'Oferta de doação criada com sucesso', { offer: newOffer }, 201);

  } catch (error) {
    console.error('Erro ao criar oferta de doação:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista as ofertas de doação do usuário logado
 * GET /offers/my-offers
 */
async function getMyOffers(req, res) {
  try {
    const donor_id = req.user.id;
    
    const offers = await query(
      'SELECT * FROM donation_offers WHERE donor_id = ? ORDER BY created_at DESC',
      [donor_id]
    );

    return success(res, 'Suas ofertas de doação', { offers });

  } catch (error) {
    console.error('Erro ao buscar ofertas do doador:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  createOffer,
  getMyOffers,
};