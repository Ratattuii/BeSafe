const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Lista notificações do usuário logado
 * GET /notifications
 */
async function getNotifications(req, res) {
  try {
    const user_id = req.user.id;
    const { type, is_read, limit = 20, offset = 0 } = req.query;
    
    let sql = `
      SELECT 
        n.*,
        related_user.name as related_user_name,
        related_user.avatar as related_user_avatar
      FROM notifications n
      LEFT JOIN users related_user ON n.related_id = related_user.id AND n.related_type = 'user'
      WHERE n.user_id = ?
    `;
    
    const params = [user_id];
    
    // Aplicar filtros opcionais
    if (type && ['donation', 'message', 'follow', 'need_update', 'system'].includes(type)) {
      sql += ' AND n.type = ?';
      params.push(type);
    }
    
    if (is_read !== undefined) {
      sql += ' AND n.is_read = ?';
      params.push(is_read === 'true');
    }
    
    // Ordenação e paginação
    sql += ' ORDER BY n.created_at DESC';
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const notifications = await query(sql, params);
    
    // Query para contar total
    let countSql = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?';
    const countParams = [user_id];
    
    if (type && ['donation', 'message', 'follow', 'need_update', 'system'].includes(type)) {
      countSql += ' AND type = ?';
      countParams.push(type);
    }
    
    if (is_read !== undefined) {
      countSql += ' AND is_read = ?';
      countParams.push(is_read === 'true');
    }
    
    const [countResult] = await query(countSql, countParams);
    const total = countResult.total;
    
    // Conta notificações não lidas
    const [unreadResult] = await query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [user_id]
    );
    
    return success(res, 'Notificações encontradas', {
      notifications,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      },
      unreadCount: unreadResult.unread_count
    });
    
  } catch (error) {
    console.error('Erro ao buscar notificações:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Marca uma notificação como lida
 * PUT /notifications/:id/read
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de notificação inválido');
    }
    
    // Busca a notificação
    const notification = await queryOne(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (!notification) {
      return errors.notFound(res, 'Notificação não encontrada');
    }
    
    // Marca como lida se ainda não estiver
    if (!notification.is_read) {
      await query(
        'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ?',
        [id]
      );
    }
    
    return success(res, 'Notificação marcada como lida');
    
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Marca todas as notificações como lidas
 * PUT /notifications/read-all
 */
async function markAllAsRead(req, res) {
  try {
    const user_id = req.user.id;
    
    const result = await query(
      'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
      [user_id]
    );
    
    return success(res, 'Todas as notificações foram marcadas como lidas', {
      updatedCount: result.affectedRows
    });
    
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Remove uma notificação
 * DELETE /notifications/:id
 */
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de notificação inválido');
    }
    
    const result = await query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    
    if (result.affectedRows === 0) {
      return errors.notFound(res, 'Notificação não encontrada');
    }
    
    return success(res, 'Notificação removida');
    
  } catch (error) {
    console.error('Erro ao remover notificação:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Função auxiliar para criar notificações
 * @param {number} user_id - ID do usuário que receberá a notificação
 * @param {string} type - Tipo da notificação
 * @param {string} title - Título da notificação
 * @param {string} message - Mensagem da notificação
 * @param {number} related_id - ID relacionado (opcional)
 * @param {string} related_type - Tipo do relacionamento (opcional)
 */
async function createNotification(user_id, type, title, message, related_id = null, related_type = null) {
  try {
    await query(`
      INSERT INTO notifications 
      (user_id, type, title, message, related_id, related_type, is_read) 
      VALUES (?, ?, ?, ?, ?, ?, FALSE)
    `, [user_id, type, title, message, related_id, related_type]);
    
    return true;
  } catch (error) {
    console.error('Erro ao criar notificação:', error.message);
    return false;
  }
}

/**
 * Cria notificação de nova doação
 */
async function createDonationNotification(donor_id, institution_id, donation_id, need_title) {
  return await createNotification(
    institution_id,
    'donation',
    'Nova doação recebida',
    `Você recebeu uma nova doação para: ${need_title}`,
    donation_id,
    'donation'
  );
}

/**
 * Cria notificação de nova mensagem
 */
async function createMessageNotification(sender_id, receiver_id, message_preview) {
  return await createNotification(
    receiver_id,
    'message',
    'Nova mensagem',
    message_preview.length > 50 ? message_preview.substring(0, 50) + '...' : message_preview,
    sender_id,
    'user'
  );
}

/**
 * Cria notificação de novo seguidor
 */
async function createFollowNotification(follower_id, institution_id) {
  return await createNotification(
    institution_id,
    'follow',
    'Novo seguidor',
    'Você tem um novo seguidor',
    follower_id,
    'user'
  );
}

/**
 * Cria notificação de atualização de necessidade
 */
async function createNeedUpdateNotification(need_id, institution_id, update_type) {
  const messages = {
    'status_change': 'O status da sua necessidade foi atualizado',
    'donation_received': 'Você recebeu uma nova doação',
    'donation_confirmed': 'Uma doação foi confirmada',
    'donation_delivered': 'Uma doação foi entregue'
  };
  
  return await createNotification(
    institution_id,
    'need_update',
    'Atualização de necessidade',
    messages[update_type] || 'Sua necessidade foi atualizada',
    need_id,
    'need'
  );
}

/**
 * Busca estatísticas de notificações
 * GET /notifications/stats
 */
async function getNotificationStats(req, res) {
  try {
    const user_id = req.user.id;
    
    // Estatísticas por tipo
    const typeStats = await query(`
      SELECT 
        type,
        COUNT(*) as total,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread
      FROM notifications 
      WHERE user_id = ?
      GROUP BY type
      ORDER BY total DESC
    `, [user_id]);
    
    // Total geral
    const [totalStats] = await query(`
      SELECT 
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_notifications
      FROM notifications 
      WHERE user_id = ?
    `, [user_id]);
    
    return success(res, 'Estatísticas de notificações', {
      stats: {
        total: totalStats,
        byType: typeStats
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de notificações:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createDonationNotification,
  createMessageNotification,
  createFollowNotification,
  createNeedUpdateNotification,
  getNotificationStats
};
