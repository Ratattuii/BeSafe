const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Obtém estatísticas gerais do sistema
 * GET /admin/stats
 */
async function getSystemStats(req, res) {
  try {
    // Estatísticas de usuários
    const userStats = await queryOne(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'donor' THEN 1 END) as total_donors,
        COUNT(CASE WHEN role = 'institution' THEN 1 END) as total_institutions,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
        COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_users,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users
      FROM users
    `);

    // Estatísticas de necessidades
    const needsStats = await queryOne(`
      SELECT 
        COUNT(*) as total_needs,
        COUNT(CASE WHEN status = 'ativa' THEN 1 END) as active_needs,
        COUNT(CASE WHEN status = 'concluida' THEN 1 END) as completed_needs,
        COUNT(CASE WHEN urgency = 'critica' THEN 1 END) as critical_needs,
        COUNT(CASE WHEN urgency = 'alta' THEN 1 END) as high_urgency_needs
      FROM needs
    `);

    // Estatísticas de doações
    const donationsStats = await queryOne(`
      SELECT 
        COUNT(*) as total_donations,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pending_donations,
        COUNT(CASE WHEN status = 'confirmada' THEN 1 END) as confirmed_donations,
        COUNT(CASE WHEN status = 'entregue' THEN 1 END) as delivered_donations,
        COUNT(CASE WHEN status = 'cancelada' THEN 1 END) as cancelled_donations,
        SUM(CASE WHEN status = 'entregue' THEN quantity ELSE 0 END) as total_delivered_quantity
      FROM donations
    `);

    // Estatísticas de avaliações
    const reviewsStats = await queryOne(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_reviews,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews
      FROM reviews
      WHERE is_public = TRUE
    `);

    // Estatísticas de mensagens
    const messagesStats = await queryOne(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_messages
      FROM messages
    `);

    // Estatísticas por categoria de necessidades
    const categoryStats = await query(`
      SELECT 
        category,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'ativa' THEN 1 END) as active_count
      FROM needs
      GROUP BY category
      ORDER BY count DESC
    `);

    // Estatísticas por mês (últimos 6 meses)
    const monthlyStats = await query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        'users' as type
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      
      UNION ALL
      
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as count,
        'donations' as type
      FROM donations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      
      ORDER BY month DESC, type
    `);

    return success(res, 'Estatísticas do sistema', {
      users: userStats,
      needs: needsStats,
      donations: donationsStats,
      reviews: {
        ...reviewsStats,
        average_rating: parseFloat(reviewsStats.average_rating || 0).toFixed(1)
      },
      messages: messagesStats,
      categories: categoryStats,
      monthly: monthlyStats
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do sistema:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista todas as doações com filtros
 * GET /admin/donations
 */
async function getAllDonations(req, res) {
  try {
    const { 
      status, 
      urgency, 
      category, 
      limit = 50, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Filtros
    if (status) {
      whereConditions.push('d.status = ?');
      queryParams.push(status);
    }

    if (urgency) {
      whereConditions.push('n.urgency = ?');
      queryParams.push(urgency);
    }

    if (category) {
      whereConditions.push('n.category = ?');
      queryParams.push(category);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Ordenação válida
    const validSortFields = ['created_at', 'updated_at', 'quantity', 'rating'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const donations = await query(`
      SELECT 
        d.*,
        donor.name as donor_name,
        donor.email as donor_email,
        donor.avatar as donor_avatar,
        institution.name as institution_name,
        institution.email as institution_email,
        institution.avatar as institution_avatar,
        institution.is_verified as institution_verified,
        n.title as need_title,
        n.category as need_category,
        n.urgency as need_urgency,
        n.status as need_status,
        AVG(r.rating) as average_rating,
        COUNT(r.id) as review_count
      FROM donations d
      LEFT JOIN users donor ON d.donor_id = donor.id
      LEFT JOIN users institution ON d.institution_id = institution.id
      LEFT JOIN needs n ON d.need_id = n.id
      LEFT JOIN reviews r ON d.id = r.donation_id AND r.is_public = TRUE
      ${whereClause}
      GROUP BY d.id
      ORDER BY d.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Contagem total para paginação
    const totalCount = await queryOne(`
      SELECT COUNT(*) as count
      FROM donations d
      LEFT JOIN needs n ON d.need_id = n.id
      ${whereClause}
    `, queryParams);

    return success(res, 'Doações encontradas', {
      donations,
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount.count
      }
    });

  } catch (error) {
    console.error('Erro ao buscar doações:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Lista todos os usuários com filtros
 * GET /admin/users
 */
async function getAllUsers(req, res) {
  try {
    const { 
      role, 
      verified, 
      active, 
      limit = 50, 
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    // Filtros
    if (role) {
      whereConditions.push('role = ?');
      queryParams.push(role);
    }

    if (verified !== undefined) {
      whereConditions.push('is_verified = ?');
      queryParams.push(verified === 'true');
    }

    if (active !== undefined) {
      whereConditions.push('is_active = ?');
      queryParams.push(active === 'true');
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Ordenação válida
    const validSortFields = ['created_at', 'name', 'email', 'role'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

    const users = await query(`
      SELECT 
        u.*,
        COUNT(DISTINCT d.id) as total_donations,
        COUNT(DISTINCT n.id) as total_needs,
        COUNT(DISTINCT r.id) as total_reviews_received,
        AVG(r.rating) as average_rating
      FROM users u
      LEFT JOIN donations d ON u.id = d.donor_id
      LEFT JOIN needs n ON u.id = n.institution_id
      LEFT JOIN reviews r ON u.id = r.reviewed_id AND r.is_public = TRUE
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.${sortField} ${sortDirection}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(limit), parseInt(offset)]);

    // Contagem total para paginação
    const totalCount = await queryOne(`
      SELECT COUNT(*) as count FROM users ${whereClause}
    `, queryParams);

    return success(res, 'Usuários encontrados', {
      users: users.map(user => ({
        ...user,
        average_rating: user.average_rating ? parseFloat(user.average_rating).toFixed(1) : null
      })),
      pagination: {
        total: totalCount.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < totalCount.count
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Verifica/aprova uma instituição
 * PUT /admin/users/:id/verify
 */
async function verifyInstitution(req, res) {
  try {
    const { id } = req.params;
    const { verified = true } = req.body;

    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de usuário inválido');
    }

    // Busca o usuário
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ? AND role = "institution"',
      [id]
    );

    if (!user) {
      return errors.notFound(res, 'Instituição não encontrada');
    }

    // Atualiza o status de verificação
    await query(
      'UPDATE users SET is_verified = ?, updated_at = NOW() WHERE id = ?',
      [verified, id]
    );

    return success(res, `Instituição ${verified ? 'verificada' : 'desverificada'} com sucesso`);

  } catch (error) {
    console.error('Erro ao verificar instituição:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Suspende/ativa um usuário
 * PUT /admin/users/:id/suspend
 */
async function suspendUser(req, res) {
  try {
    const { id } = req.params;
    const { suspended = true, reason = '' } = req.body;

    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de usuário inválido');
    }

    // Não permite suspender administradores
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ? AND role != "admin"',
      [id]
    );

    if (!user) {
      return errors.notFound(res, 'Usuário não encontrado ou não pode ser suspenso');
    }

    // Atualiza o status ativo
    await query(
      'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [!suspended, id]
    );

    // TODO: Criar notificação para o usuário sobre suspensão/reativação

    return success(res, `Usuário ${suspended ? 'suspenso' : 'reativado'} com sucesso`);

  } catch (error) {
    console.error('Erro ao suspender usuário:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Gera relatório CSV de doações
 * GET /admin/reports/donations
 */
async function generateDonationsReport(req, res) {
  try {
    const { startDate, endDate, status } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (startDate) {
      whereConditions.push('d.created_at >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('d.created_at <= ?');
      queryParams.push(endDate);
    }

    if (status) {
      whereConditions.push('d.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const donations = await query(`
      SELECT 
        d.id,
        d.quantity,
        d.unit,
        d.status,
        d.created_at,
        d.delivered_at,
        donor.name as donor_name,
        donor.email as donor_email,
        institution.name as institution_name,
        institution.email as institution_email,
        institution.cnpj as institution_cnpj,
        n.title as need_title,
        n.category as need_category,
        n.urgency as need_urgency
      FROM donations d
      LEFT JOIN users donor ON d.donor_id = donor.id
      LEFT JOIN users institution ON d.institution_id = institution.id
      LEFT JOIN needs n ON d.need_id = n.id
      ${whereClause}
      ORDER BY d.created_at DESC
    `, queryParams);

    // Gera CSV
    const csvHeader = 'ID,Quantidade,Unidade,Status,Data Criação,Data Entrega,Doador,Email Doador,Instituição,Email Instituição,CNPJ,Necessidade,Categoria,Urgência\n';
    
    const csvRows = donations.map(donation => [
      donation.id,
      donation.quantity,
      donation.unit || '',
      donation.status,
      donation.created_at,
      donation.delivered_at || '',
      `"${donation.donor_name || ''}"`,
      donation.donor_email || '',
      `"${donation.institution_name || ''}"`,
      donation.institution_email || '',
      donation.institution_cnpj || '',
      `"${donation.need_title || ''}"`,
      donation.need_category || '',
      donation.need_urgency || ''
    ].join(','));

    const csvContent = csvHeader + csvRows.join('\n');

    // Define headers para download
    const filename = `donations_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('Erro ao gerar relatório de doações:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getSystemStats,
  getAllDonations,
  getAllUsers,
  verifyInstitution,
  suspendUser,
  generateDonationsReport
};
