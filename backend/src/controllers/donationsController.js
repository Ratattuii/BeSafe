const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Lista todas as doações com filtros opcionais
 * GET /donations
 */
async function getDonations(req, res) {
  try {
    const { status, donor_id, institution_id, need_id, limit = 20, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        d.*,
        donor.name as donor_name,
        donor.avatar as donor_avatar,
        institution.name as institution_name,
        institution.avatar as institution_avatar,
        n.title as need_title,
        n.category as need_category
      FROM donations d
      LEFT JOIN users donor ON d.donor_id = donor.id
      LEFT JOIN users institution ON d.institution_id = institution.id
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE 1=1
    `;
    
    const params = [];
    
    // Aplicar filtros opcionais
    if (status && ['pendente', 'confirmada', 'entregue', 'cancelada'].includes(status)) {
      sql += ' AND d.status = ?';
      params.push(status);
    }
    
    if (donor_id) {
      sql += ' AND d.donor_id = ?';
      params.push(donor_id);
    }
    
    if (institution_id) {
      sql += ' AND d.institution_id = ?';
      params.push(institution_id);
    }
    
    if (need_id) {
      sql += ' AND d.need_id = ?';
      params.push(need_id);
    }
    
    // Ordenação e paginação
    sql += ' ORDER BY d.created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const donations = await query(sql, params);
    
    // Query para contar total
    let countSql = 'SELECT COUNT(*) as total FROM donations d WHERE 1=1';
    const countParams = [];
    
    if (status && ['pendente', 'confirmada', 'entregue', 'cancelada'].includes(status)) {
      countSql += ' AND d.status = ?';
      countParams.push(status);
    }
    
    if (donor_id) {
      countSql += ' AND d.donor_id = ?';
      countParams.push(donor_id);
    }
    
    if (institution_id) {
      countSql += ' AND d.institution_id = ?';
      countParams.push(institution_id);
    }
    
    if (need_id) {
      countSql += ' AND d.need_id = ?';
      countParams.push(need_id);
    }
    
    const [countResult] = await query(countSql, countParams);
    const total = countResult.total;
    
    return success(res, 'Doações encontradas', {
      donations,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar doações:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista doações do usuário logado
 * GET /donations/me
 */
async function getUserDonations(req, res) {
  try {
    const user_id = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        d.*,
        institution.name as institution_name,
        institution.avatar as institution_avatar,
        n.title as need_title,
        n.category as need_category,
        n.urgency as need_urgency
      FROM donations d
      LEFT JOIN users institution ON d.institution_id = institution.id
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE d.donor_id = ?
    `;
    
    const params = [user_id];
    
    if (status && ['pendente', 'confirmada', 'entregue', 'cancelada'].includes(status)) {
      sql += ' AND d.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY d.created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const donations = await query(sql, params);
    
    return success(res, 'Suas doações', { donations });
    
  } catch (error) {
    console.error('Erro ao buscar doações do usuário:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Cria uma nova doação
 * POST /donations
 */
async function createDonation(req, res) {
  try {
    console.log('=== CREATE DONATION DEBUG ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);
    
    const { need_id, quantity, unit, notes, promised_delivery } = req.body;
    
    // Verifica se usuário está autenticado
    if (!req.user || !req.user.id) {
      console.error('Usuário não autenticado');
      return errors.unauthorized(res, 'Usuário não autenticado');
    }
    
    const donor_id = req.user.id;
    
    // Validações
    if (!need_id) {
      return errors.badRequest(res, 'need_id é obrigatório');
    }
    
    if (!quantity || isNaN(parseInt(quantity))) {
      return errors.badRequest(res, 'quantity deve ser um número válido');
    }
    
    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      return errors.badRequest(res, 'quantity deve ser maior que zero');
    }
    
    // Verifica se a necessidade existe e está ativa
    const need = await queryOne(`
      SELECT n.*, u.id as institution_id, u.name as institution_name
      FROM needs n
      LEFT JOIN users u ON n.institution_id = u.id
      WHERE n.id = ? AND n.status = 'ativa'
    `, [need_id]);
    
    if (!need) {
      return errors.notFound(res, 'Necessidade não encontrada ou inativa');
    }
    
    // Verifica se o usuário não está tentando doar para si mesmo
    if (req.user.role === 'institution' && need.institution_id === donor_id) {
      return errors.badRequest(res, 'Você não pode doar para sua própria instituição');
    }
    
    // Cria a doação
    console.log('Criando doação com:', { donor_id, need_id, institution_id: need.institution_id, quantity: quantityNum, unit: unit || 'unidades' });
    
    const result = await query(`
      INSERT INTO donations 
      (donor_id, need_id, institution_id, quantity, unit, notes, promised_delivery, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente')
    `, [
      donor_id, need_id, need.institution_id, 
      quantityNum, unit || 'unidades', notes || null, promised_delivery || null
    ]);
    
    // Busca a doação criada com dados relacionados
    const newDonation = await queryOne(`
      SELECT 
        d.*,
        donor.name as donor_name,
        donor.avatar as donor_avatar,
        institution.name as institution_name,
        institution.avatar as institution_avatar,
        n.title as need_title,
        n.category as need_category
      FROM donations d
      LEFT JOIN users donor ON d.donor_id = donor.id
      LEFT JOIN users institution ON d.institution_id = institution.id
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE d.id = ?
    `, [result.insertId]);
    
    // TODO: Criar notificação para a instituição
    
    return success(res, 'Doação criada com sucesso', { donation: newDonation }, 201);
    
  } catch (error) {
    console.error('Erro ao criar doação:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Atualiza status de uma doação
 * PUT /donations/:id/status
 */
async function updateDonationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user_id = req.user.id;
    
    // Validações
    if (!status || !['pendente', 'confirmada', 'entregue', 'cancelada'].includes(status)) {
      return errors.badRequest(res, 'Status inválido');
    }
    
    // Busca a doação
    const donation = await queryOne(`
      SELECT d.*, n.title as need_title
      FROM donations d
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE d.id = ?
    `, [id]);
    
    if (!donation) {
      return errors.notFound(res, 'Doação não encontrada');
    }
    
    // Verifica se o usuário pode atualizar esta doação
    const canUpdate = donation.donor_id === user_id || donation.institution_id === user_id;
    if (!canUpdate) {
      return errors.forbidden(res, 'Você não pode atualizar esta doação');
    }
    
    // Atualiza o status
    const updateData = { status };
    if (status === 'entregue') {
      updateData.delivered_at = new Date();
    }
    
    await query(`
      UPDATE donations 
      SET status = ?, delivered_at = ?, updated_at = NOW()
      WHERE id = ?
    `, [status, updateData.delivered_at, id]);
    
    // Se a doação foi confirmada ou entregue, atualiza a quantidade recebida da necessidade
    if (status === 'confirmada' || status === 'entregue') {
      await query(`
        UPDATE needs 
        SET quantity_received = quantity_received + ?
        WHERE id = ?
      `, [donation.quantity, donation.need_id]);
    }
    
    // Busca a doação atualizada
    const updatedDonation = await queryOne(`
      SELECT 
        d.*,
        donor.name as donor_name,
        institution.name as institution_name,
        n.title as need_title
      FROM donations d
      LEFT JOIN users donor ON d.donor_id = donor.id
      LEFT JOIN users institution ON d.institution_id = institution.id
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE d.id = ?
    `, [id]);
    
    return success(res, 'Status da doação atualizado', { donation: updatedDonation });
    
  } catch (error) {
    console.error('Erro ao atualizar status da doação:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Retorna estatísticas de doações do usuário
 * GET /donations/stats
 */
async function getDonationStats(req, res) {
  try {
    const user_id = req.user.id;
    
    // Estatísticas gerais
    const [totalStats] = await query(`
      SELECT 
        COUNT(*) as total_donations,
        SUM(CASE WHEN status = 'entregue' THEN quantity ELSE 0 END) as total_quantity_donated,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as pending_donations,
        SUM(CASE WHEN status = 'confirmada' THEN 1 ELSE 0 END) as confirmed_donations,
        SUM(CASE WHEN status = 'entregue' THEN 1 ELSE 0 END) as delivered_donations
      FROM donations 
      WHERE donor_id = ?
    `, [user_id]);
    
    // Doações por categoria
    const categoryStats = await query(`
      SELECT 
        n.category,
        COUNT(*) as count,
        SUM(d.quantity) as total_quantity
      FROM donations d
      LEFT JOIN needs n ON d.need_id = n.id
      WHERE d.donor_id = ? AND d.status = 'entregue'
      GROUP BY n.category
      ORDER BY count DESC
    `, [user_id]);
    
    // Doações por mês (últimos 12 meses)
    const monthlyStats = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        SUM(quantity) as total_quantity
      FROM donations 
      WHERE donor_id = ? AND status = 'entregue'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `, [user_id]);
    
    return success(res, 'Estatísticas de doações', {
      stats: {
        total: totalStats,
        byCategory: categoryStats,
        byMonth: monthlyStats
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getDonations,
  getUserDonations,
  createDonation,
  updateDonationStatus,
  getDonationStats
};
