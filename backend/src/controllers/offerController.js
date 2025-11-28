const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');
const { createOfferAcceptedNotification } = require('./notificationsController');

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

    // 3. Cria uma conversa entre a instituição e o doador
    const conversationResult = await query(
      `INSERT INTO conversations 
       (user1_id, user2_id, offer_id, created_at) 
       VALUES (?, ?, ?, NOW())`,
      [institution_id, offer.donor_id, id]
    );

    // 4. Envia uma mensagem automática de boas-vindas
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

    await createOfferAcceptedNotification(id, institution_id, offer.user_id);

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

/**
 * Finaliza uma oferta de doação (marca como doada)
 * POST /offers/:id/finalize
 */
async function finalizeDonationOffer(req, res) {
  try {
    const { id } = req.params;
    
    console.log('🔄 [FINALIZE OFFER] Iniciando finalização da oferta ID:', id);
    console.log('👤 [FINALIZE OFFER] Usuário:', req.user);

    // Verifica se a oferta existe e pertence ao usuário (usando donor_id)
    const existingOffer = await queryOne(`
      SELECT * FROM donation_offers WHERE id = ? AND donor_id = ?
    `, [id, req.user.id]);

    if (!existingOffer) {
      console.log('❌ [FINALIZE OFFER] Oferta não encontrada ou sem permissão');
      return res.status(404).json({
        success: false,
        message: 'Oferta não encontrada ou você não tem permissão para finalizá-la'
      });
    }

    console.log('✅ [FINALIZE OFFER] Oferta encontrada:', {
      id: existingOffer.id,
      title: existingOffer.title,
      status: existingOffer.status
    });

    // Marcar como doada (status deve ser 'donated' conforme a tabela)
    const result = await query(`
      UPDATE donation_offers 
      SET status = 'donated', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND donor_id = ?
    `, [id, req.user.id]);

    if (result.affectedRows === 0) {
      console.log('❌ [FINALIZE OFFER] Nenhuma linha afetada');
      return res.status(404).json({
        success: false,
        message: 'Oferta não encontrada ou nenhuma alteração realizada'
      });
    }

    console.log('✅ [FINALIZE OFFER] Oferta finalizada com sucesso. Linhas afetadas:', result.affectedRows);

    return res.json({
      success: true,
      message: 'Oferta finalizada com sucesso',
      data: {
        offerId: id,
        action: 'finalized'
      }
    });

  } catch (error) {
    console.error('❌ [FINALIZE OFFER] Erro ao finalizar oferta:', error);
    console.error('🔍 [FINALIZE OFFER] Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao finalizar oferta',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  createOffer,
  updateOffer,
  getMyOffers,
  getAvailableOffers,
  acceptOffer,
  rejectOffer,
  finalizeDonationOffer
};