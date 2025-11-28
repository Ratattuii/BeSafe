const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * =============================================
 * FUNÇÕES PRINCIPAIS DA API
 * =============================================
 */

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
        related_user.avatar as related_user_avatar,
        inst.name as institution_name,
        inst.avatar as institution_avatar
      FROM notifications n
      LEFT JOIN users related_user ON n.related_id = related_user.id AND n.related_type = 'user'
      LEFT JOIN users inst ON n.related_id = inst.id AND n.related_type = 'institution'
      WHERE n.user_id = ?
    `;
    
    const params = [user_id];
    
    // Aplicar filtros opcionais
    if (type && ['donation', 'message', 'follow', 'need_update', 'system', 'offer'].includes(type)) {
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
    
    if (type && ['donation', 'message', 'follow', 'need_update', 'system', 'offer'].includes(type)) {
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
 * Cria notificação manualmente (para admin/sistema)
 * POST /notifications/manual
 */
async function createManualNotification(req, res) {
  try {
    const { user_id, type, title, message, related_id, related_type } = req.body;
    
    // Validação
    if (!user_id || !type || !title || !message) {
      return errors.badRequest(res, 'Dados incompletos: user_id, type, title e message são obrigatórios');
    }
    
    // Verifica se o usuário existe
    const userExists = await queryOne('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!userExists) {
      return errors.notFound(res, 'Usuário não encontrado');
    }
    
    // Cria a notificação
    const result = await query(`
      INSERT INTO notifications 
      (user_id, type, title, message, related_id, related_type, is_read) 
      VALUES (?, ?, ?, ?, ?, ?, FALSE)
    `, [user_id, type, title, message, related_id, related_type]);
    
    return success(res, 'Notificação criada com sucesso', {
      notificationId: result.insertId
    });
    
  } catch (error) {
    console.error('Erro ao criar notificação manual:', error);
    return errors.serverError(res);
  }
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

/**
 * Função base para criar notificações
 */
async function createNotification(user_id, type, title, message, related_id = null, related_type = null) {
  try {

    // Validar parâmetros obrigatórios
    if (!user_id || !type || !title || !message) {
      const error = 'Parâmetros obrigatórios faltando: user_id, type, title, message';
      console.error('Erro de validação:', error);
      return { success: false, error };
    }

    // Verificar se o usuário existe
    const userExists = await queryOne('SELECT id FROM users WHERE id = ?', [user_id]);
    if (!userExists) {
      const error = `Usuário com ID ${user_id} não existe`;
      console.error('Erro:', error);
      return { success: false, error };
    }
    
    const result = await query(`
      INSERT INTO notifications 
      (user_id, type, title, message, related_id, related_type, is_read, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, FALSE, NOW())
    `, [user_id, type, title, message, related_id, related_type]);
    
    console.log('Notificação criada com sucesso. ID:', result.insertId);
    
    return { 
      success: true, 
      notificationId: result.insertId,
      message: `Notificação ${type} criada para usuário ${user_id}`
    };
  } catch (error) {
    console.error('Erro ao criar notificação:', error.message);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Nova doação recebida (para instituição)
 */
async function createDonationNotification(donor_id, institution_id, donation_id, item_name, quantity = 1) {
  try {
    const donor = await queryOne('SELECT name FROM users WHERE id = ?', [donor_id]);
    const donorName = donor ? donor.name : 'Um doador';
    
    return await createNotification(
      institution_id,
      'donation',
      'Nova doação recebida 🎁',
      `${donorName} doou ${quantity} ${item_name} para sua instituição`,
      donation_id,
      'donation'
    );
  } catch (error) {
    console.error('Erro ao criar notificação de doação:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Nova mensagem (para destinatário)
 */
async function createMessageNotification(sender_id, receiver_id, message_content) {
  try {
    const sender = await queryOne('SELECT name FROM users WHERE id = ?', [sender_id]);
    const senderName = sender ? sender.name : 'Um usuário';
    
    const messagePreview = message_content.length > 50 
      ? message_content.substring(0, 50) + '...' 
      : message_content;
    
    return await createNotification(
      receiver_id,
      'message',
      'Nova mensagem 💬',
      `${senderName}: ${messagePreview}`,
      sender_id,
      'user'
    );
  } catch (error) {
    console.error('Erro ao criar notificação de mensagem:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Novo seguidor (para instituição)
 */
async function createFollowNotification(follower_id, institution_id) {
  try {
    const follower = await queryOne('SELECT name FROM users WHERE id = ?', [follower_id]);
    const followerName = follower ? follower.name : 'Um usuário';
    
    return await createNotification(
      institution_id,
      'follow',
      'Novo seguidor 👥',
      `${followerName} começou a seguir sua instituição`,
      follower_id,
      'user'
    );
  } catch (error) {
    console.error('Erro ao criar notificação de seguidor:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Atualização de necessidade (para instituição)
 */
async function createNeedUpdateNotification(need_id, institution_id, update_type, need_title) {
  try {
    const messages = {
      'created': `Você criou uma nova necessidade: "${need_title}"`,
      'updated': `Sua necessidade "${need_title}" foi atualizada`,
      'fulfilled': `🎉 Necessidade "${need_title}" foi totalmente atendida!`,
      'urgent': `🚨 Necessidade "${need_title}" marcada como URGENTE`,
      'donation_received': `✅ Recebemos uma doação para "${need_title}"`,
      'donation_confirmed': `✔️ Doação confirmada para "${need_title}"`
    };
    
    const message = messages[update_type] || `Sua necessidade "${need_title}" foi atualizada`;
    const title = update_type === 'fulfilled' ? 'Necessidade atendida! 🎉' : 'Atualização de necessidade 📝';
    
    return await createNotification(
      institution_id,
      'need_update',
      title,
      message,
      need_id,
      'need'
    );
  } catch (error) {
    console.error('Erro ao criar notificação de atualização de necessidade:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Atualização de necessidade para SEGUIDORES
 */
async function createNeedUpdateForFollowers(need_id, institution_id, update_type, need_title) {
  try {
    const institution = await queryOne('SELECT name, avatar FROM users WHERE id = ?', [institution_id]);
    if (!institution) {
      console.error('❌ [NOTIFICATIONS] Instituição não encontrada:', institution_id);
      return { success: false, error: 'Instituição não encontrada' };
    }

    const messages = {
      'created': `${institution.name} criou uma nova necessidade: "${need_title}"`,
      'updated': `${institution.name} atualizou a necessidade: "${need_title}"`,
      'fulfilled': `🎉 ${institution.name} atendeu a necessidade: "${need_title}"`,
      'urgent': `🚨 ${institution.name} tem uma necessidade URGENTE: "${need_title}"`
    };

    const followers = await query(
      'SELECT follower_id as user_id FROM follows WHERE institution_id = ?',
      [institution_id]
    );

    console.log(`📢 [NOTIFICATIONS] Encontrados ${followers.length} seguidores para a instituição ${institution_id}`);

    if (followers.length === 0) {
      console.log('ℹ️ [NOTIFICATIONS] Nenhum seguidor encontrado para notificar');
      return { 
        success: true, 
        sentCount: 0,
        message: 'Nenhum seguidor para notificar' 
      };
    }

    // Cria notificação para cada seguidor
    const results = [];
    let successCount = 0;
    
    for (const follower of followers) {
      try {
        const result = await createNotification(
          follower.user_id,
          'need_update',
          'Nova necessidade disponível 📋',
          messages[update_type] || `${institution.name} atualizou: "${need_title}"`,
          need_id,
          'need'
        );
        
        if (result.success) {
          successCount++;
          console.log(`Notificação criada para seguidor ${follower.user_id}`);
        } else {
          console.error(`Erro ao criar notificação para seguidor ${follower.user_id}:`, result.error);
        }
        
        results.push(result);
      } catch (error) {
        console.error(`Erro ao processar seguidor ${follower.user_id}:`, error);
      }
    }

    console.log(`Notificações enviadas: ${successCount}/${followers.length} seguidores`);

    return { 
      success: true, 
      sentCount: successCount,
      totalFollowers: followers.length,
      results 
    };
  } catch (error) {
    console.error('Erro ao criar notificação para seguidores:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Oferta aceita (para doador)
 */
async function createOfferAcceptedNotification(offer_id, institution_id, donor_id) {
  try {
    const institution = await queryOne('SELECT name FROM users WHERE id = ?', [institution_id]);
    const institutionName = institution ? institution.name : 'Uma instituição';
    
    // Busca informações da oferta
    const offer = await queryOne(
      'SELECT title FROM donation_offers WHERE id = ?',
      [offer_id]
    );
    
    const offerTitle = offer ? offer.title : 'sua oferta';
    
    return await createNotification(
      donor_id,
      'offer',
      'Oferta aceita! ✅',
      `${institutionName} aceitou ${offerTitle}`,
      offer_id,
      'offer'
    );
  } catch (error) {
    console.error('Erro ao criar notificação de oferta aceita:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Status da doação atualizado (para doador)
 */
async function createDonationStatusNotification(donation_id, donor_id, institution_id, new_status) {
  try {
    const institution = await queryOne('SELECT name FROM users WHERE id = ?', [institution_id]);
    const institutionName = institution ? institution.name : 'A instituição';
    
    const statusMessages = {
      'confirmed': `✅ ${institutionName} confirmou o recebimento da sua doação`,
      'delivered': `🎉 ${institutionName} registrou sua doação como entregue`,
      'cancelled': `❌ ${institutionName} cancelou a sua doação`,
      'pending': `⏳ ${institutionName} está analisando sua doação`
    };
    
    const message = statusMessages[new_status] || `${institutionName} atualizou o status da sua doação`;
    
    return await createNotification(
      donor_id,
      'donation',
      'Status da doação atualizado 📦',
      message,
      donation_id,
      'donation'
    );
  } catch (error) {
    console.error('Erro ao criar notificação de status de doação:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Sistema/Admin (para qualquer usuário)
 */
async function createSystemNotification(user_id, title, message, related_id = null, related_type = null) {
  try {
    return await createNotification(
      user_id,
      'system',
      title,
      message,
      related_id,
      related_type
    );
  } catch (error) {
    console.error('Erro ao criar notificação do sistema:', error);
    return { success: false, error: error.message };
  }
}

/**
 * NOTIFICAÇÃO: Lembrete (para doador/instituição)
 */
async function createReminderNotification(user_id, reminder_type, data = {}) {
  try {
    const reminders = {
      'donation_pending': {
        title: 'Lembrete de doação ⏰',
        message: 'Você tem doações pendentes para confirmar'
      },
      'need_urgent': {
        title: 'Necessidade urgente 🚨',
        message: `Sua necessidade "${data.need_title}" está próxima do prazo`
      },
      'message_unread': {
        title: 'Mensagem não lida 💬',
        message: 'Você tem mensagens não lidas na sua caixa de entrada'
      }
    };
    
    const reminder = reminders[reminder_type] || {
      title: 'Lembrete 🔔',
      message: 'Lembrete do sistema'
    };
    
    return await createNotification(
      user_id,
      'system',
      reminder.title,
      reminder.message,
      data.related_id,
      data.related_type
    );
  } catch (error) {
    console.error('Erro ao criar notificação de lembrete:', error);
    return { success: false, error: error.message };
  }
}

/**
 * DEBUG: Testar criação de notificação manual
 * POST /notifications/debug/test
 */
async function debugCreateTestNotification(req, res) {
  try {
    const { user_id, message } = req.body;
    
    // Testar a função createNotification diretamente
    const result = await createNotification(
      user_id,
      'need_update',
      'Notificação de Teste 📋',
      message || 'Esta é uma notificação de teste',
      1, // related_id
      'need' // related_type
    );
    
    return success(res, 'Notificação de teste criada', {
      testResult: result,
      notificationId: result.notificationId
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
    return errors.serverError(res, error.message);
  }
}

/**
 * DEBUG: Verificar seguidores de uma instituição
 * GET /notifications/debug/followers/:institutionId
 */
async function debugGetFollowers(req, res) {
  try {
    const { institutionId } = req.params;
    
    const followers = await query(
      'SELECT follower_id as user_id, u.name, u.email FROM follows f JOIN users u ON f.follower_id = u.id WHERE f.institution_id = ?',
      [institutionId]
    );
    
    return success(res, 'Seguidores encontrados', {
      institutionId,
      followersCount: followers.length,
      followers
    });
    
  } catch (error) {
    console.error('Erro ao buscar seguidores:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createManualNotification,
  getNotificationStats,
  
  createNotification,
  createDonationNotification,
  createMessageNotification,
  createFollowNotification,
  createNeedUpdateNotification,
  createNeedUpdateForFollowers,
  createOfferAcceptedNotification,
  createDonationStatusNotification,
  createSystemNotification,
  createReminderNotification,

  // Funções de debug
  debugCreateTestNotification,
  debugGetFollowers
};