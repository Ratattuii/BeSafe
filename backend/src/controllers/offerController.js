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
      conditions, 
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
        conditions,
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
 * Atualiza uma oferta de doação existente
 * PUT /offers/:id
 */
async function updateOffer(req, res) {
  try {
    const donor_id = req.user.id;
    const { id } = req.params;
    const {
      title,
      description,
      quantity,
      category,
      conditions,
      location,
      availability,
    } = req.body;

    // 1. Verifica se a oferta existe e pertence ao usuário
    const offer = await queryOne(
      'SELECT * FROM donation_offers WHERE id = ?',
      [id]
    );

    if (!offer) {
      return errors.notFound(res, 'Oferta de doação não encontrada.');
    }

    if (offer.donor_id !== donor_id) {
      return errors.forbidden(res, 'Você não tem permissão para editar esta oferta.');
    }

    // 2. Validação
    const validationError = validateRequired(
      ['title', 'description', 'quantity', 'category', 'conditions', 'availability'],
      req.body
    );
    
    if (validationError) {
      return errors.badRequest(res, validationError);
    }

    // 3. Atualiza no banco
    await query(
      `UPDATE donation_offers SET 
       title = ?, description = ?, quantity = ?, category = ?, 
       conditions = ?, location = ?, availability = ?
       WHERE id = ? AND donor_id = ?`,
      [
        title,
        description,
        quantity,
        category,
        conditions,
        location || null,
        availability,
        id,
        donor_id
      ]
    );

    const updatedOffer = await queryOne(
      'SELECT * FROM donation_offers WHERE id = ?',
      [id]
    );

    return success(res, 'Oferta de doação atualizada com sucesso', { offer: updatedOffer });

  } catch (error) {
    console.error('Erro ao atualizar oferta de doação:', error.message);
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

/**
 * Lista TODAS as ofertas de doação disponíveis (para instituições)
 * GET /offers/available
 */
async function getAvailableOffers(req, res) {
  try {
    const { category, urgency } = req.query;
    
    // 🔥 Construir filtros dinâmicos
    let whereClause = 'WHERE status = "available"';
    const params = [];
    
    if (category && category !== 'todos') {
      whereClause += ' AND category = ?';
      params.push(category);
    }
    
    if (urgency && urgency !== 'todos') {
      whereClause += ' AND urgency = ?';
      params.push(urgency);
    }
    
    // Buscar ofertas disponíveis
    const offers = await query(
      `SELECT 
        do.*,
        u.name as donor_name,
        u.email as donor_email,
        u.avatar as donor_avatar
       FROM donation_offers do
       INNER JOIN users u ON do.donor_id = u.id
       ${whereClause}
       ORDER BY do.created_at DESC`,
      params
    );

    return success(res, 'Ofertas disponíveis carregadas', { offers });

  } catch (error) {
    console.error('Erro ao buscar ofertas disponíveis:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Aceita uma oferta de doação (instituição) e cria conversa
 * PUT /offers/:id/accept
 */
async function acceptOffer(req, res) {
  try {
    const institution_id = req.user.id;
    const { id } = req.params;

    // 1. Verifica se a oferta existe e está disponível
    const offer = await queryOne(
      'SELECT * FROM donation_offers WHERE id = ? AND status = "available"',
      [id]
    );

    if (!offer) {
      return errors.notFound(res, 'Oferta não encontrada ou já foi aceita.');
    }

    // 2. Atualiza o status para "accepted" e registra a instituição que aceitou
    await query(
      `UPDATE donation_offers SET 
       status = 'accepted',
       accepted_by = ?,
       accepted_at = NOW()
       WHERE id = ?`,
      [institution_id, id]
    );

    // 3. 🔥 Cria uma conversa entre a instituição e o doador
    const conversationResult = await query(
      `INSERT INTO conversations 
       (user1_id, user2_id, offer_id, created_at) 
       VALUES (?, ?, ?, NOW())`,
      [institution_id, offer.donor_id, id]
    );

    // 4. 🔥 Envia uma mensagem automática de boas-vindas
    await query(
      `INSERT INTO messages 
       (conversation_id, sender_id, message, message_type, created_at) 
       VALUES (?, ?, ?, 'text', NOW())`,
      [
        conversationResult.insertId,
        institution_id,
        `Olá! Aceitei sua oferta "${offer.title}". Vamos combinar os detalhes da doação?`
      ]
    );

    // 5. Busca a oferta atualizada
    const updatedOffer = await queryOne(
      `SELECT 
        do.*,
        u.name as donor_name,
        u.email as donor_email,
        u.avatar as donor_avatar
       FROM donation_offers do
       INNER JOIN users u ON do.donor_id = u.id
       WHERE do.id = ?`,
      [id]
    );

    // 6. Cria notificação para o doador
    await query(
      `INSERT INTO notifications 
       (user_id, title, message, type, related_id, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        offer.donor_id,
        'Oferta Aceita! 🎉',
        `Sua oferta "${offer.title}" foi aceita. Uma conversa foi iniciada para combinar os detalhes.`,
        'offer_accepted',
        id
      ]
    );

    return success(res, 'Oferta aceita com sucesso! Chat iniciado com o doador.', { 
      offer: updatedOffer,
      conversation_id: conversationResult.insertId 
    });

  } catch (error) {
    console.error('Erro ao aceitar oferta:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Rejeita uma oferta de doação (instituição)
 * PUT /offers/:id/reject
 */
async function rejectOffer(req, res) {
  try {
    const institution_id = req.user.id;
    const { id } = req.params;

    // 1. Verifica se a oferta existe e está disponível
    const offer = await queryOne(
      'SELECT * FROM donation_offers WHERE id = ? AND status = "available"',
      [id]
    );

    if (!offer) {
      return errors.notFound(res, 'Oferta não encontrada ou já foi processada.');
    }

    // 2. Atualiza o status para "rejected" (ou mantém como available se preferir)
    // Aqui você pode escolher entre rejeitar ou apenas "ignorar" mantendo disponível
    await query(
      `UPDATE donation_offers SET 
       status = 'rejected',
       rejected_by = ?,
       rejected_at = NOW()
       WHERE id = ?`,
      [institution_id, id]
    );

    return success(res, 'Oferta rejeitada', { offer_id: id });

  } catch (error) {
    console.error('Erro ao rejeitar oferta:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  createOffer,
  updateOffer,
  getMyOffers,
  getAvailableOffers,
  acceptOffer,
  rejectOffer,
};