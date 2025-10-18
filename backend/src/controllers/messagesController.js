const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');
const { validateRequired } = require('../utils/validation');

/**
 * Lista conversas do usuário logado
 * GET /messages/conversations
 */
async function getConversations(req, res) {
  try {
    const user_id = req.user.id;
    
    // Busca conversas com último mensagem e contagem de não lidas
    const conversations = await query(`
      SELECT 
        other_user.id as user_id,
        other_user.name as user_name,
        other_user.avatar as user_avatar,
        other_user.role as user_role,
        last_message.message as last_message,
        last_message.created_at as last_message_time,
        last_message.sender_id as last_message_sender_id,
        unread_count.count as unread_count
      FROM (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END as other_user_id
        FROM messages 
        WHERE sender_id = ? OR receiver_id = ?
      ) conversations
      LEFT JOIN users other_user ON conversations.other_user_id = other_user.id
      LEFT JOIN (
        SELECT 
          sender_id,
          receiver_id,
          message,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id) ORDER BY created_at DESC) as rn
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
      ) last_message ON (
        (last_message.sender_id = ? AND last_message.receiver_id = other_user.id) OR
        (last_message.sender_id = other_user.id AND last_message.receiver_id = ?)
      ) AND last_message.rn = 1
      LEFT JOIN (
        SELECT 
          sender_id,
          COUNT(*) as count
        FROM messages
        WHERE receiver_id = ? AND is_read = FALSE
        GROUP BY sender_id
      ) unread_count ON unread_count.sender_id = other_user.id
      ORDER BY last_message.created_at DESC
    `, [user_id, user_id, user_id, user_id, user_id, user_id, user_id, user_id]);
    
    return success(res, 'Conversas encontradas', { conversations });
    
  } catch (error) {
    console.error('Erro ao buscar conversas:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca mensagens entre o usuário logado e outro usuário
 * GET /messages/:userId
 */
async function getMessages(req, res) {
  try {
    const { userId } = req.params;
    const current_user_id = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    // Validação
    if (!userId || isNaN(userId)) {
      return errors.badRequest(res, 'ID de usuário inválido');
    }
    
    // Busca mensagens entre os dois usuários
    const messages = await query(`
      SELECT 
        m.*,
        sender.name as sender_name,
        sender.avatar as sender_avatar
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) 
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `, [current_user_id, userId, userId, current_user_id, parseInt(limit), parseInt(offset)]);
    
    // Marca mensagens como lidas
    await query(`
      UPDATE messages 
      SET is_read = TRUE, read_at = NOW()
      WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
    `, [userId, current_user_id]);
    
    return success(res, 'Mensagens encontradas', { 
      messages: messages.reverse(), // Inverte para mostrar mais antigas primeiro
      otherUserId: parseInt(userId)
    });
    
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Envia uma mensagem
 * POST /messages
 */
async function sendMessage(req, res) {
  try {
    const { receiver_id, message, message_type = 'text' } = req.body;
    const sender_id = req.user.id;
    
    // Validações
    const validationError = validateRequired(
      ['receiver_id', 'message'], 
      { receiver_id, message }
    );
    
    if (validationError) {
      return errors.badRequest(res, validationError);
    }
    
    if (sender_id === parseInt(receiver_id)) {
      return errors.badRequest(res, 'Você não pode enviar mensagem para si mesmo');
    }
    
    // Verifica se o destinatário existe
    const receiver = await queryOne(
      'SELECT id, name FROM users WHERE id = ?',
      [receiver_id]
    );
    
    if (!receiver) {
      return errors.notFound(res, 'Usuário destinatário não encontrado');
    }
    
    // Cria a mensagem
    const result = await query(`
      INSERT INTO messages 
      (sender_id, receiver_id, message, message_type, is_read) 
      VALUES (?, ?, ?, ?, FALSE)
    `, [sender_id, receiver_id, message.trim(), message_type]);
    
    // Busca a mensagem criada
    const newMessage = await queryOne(`
      SELECT 
        m.*,
        sender.name as sender_name,
        sender.avatar as sender_avatar,
        receiver.name as receiver_name
      FROM messages m
      LEFT JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.id = ?
    `, [result.insertId]);
    
    // TODO: Criar notificação para o destinatário
    // TODO: Emitir via WebSocket se implementado
    
    return success(res, 'Mensagem enviada com sucesso', { message: newMessage }, 201);
    
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Marca uma mensagem como lida
 * PUT /messages/:id/read
 */
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const user_id = req.user.id;
    
    // Validação
    if (!id || isNaN(id)) {
      return errors.badRequest(res, 'ID de mensagem inválido');
    }
    
    // Busca a mensagem
    const message = await queryOne(
      'SELECT * FROM messages WHERE id = ? AND receiver_id = ?',
      [id, user_id]
    );
    
    if (!message) {
      return errors.notFound(res, 'Mensagem não encontrada');
    }
    
    // Marca como lida se ainda não estiver
    if (!message.is_read) {
      await query(
        'UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE id = ?',
        [id]
      );
    }
    
    return success(res, 'Mensagem marcada como lida');
    
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Marca todas as mensagens de uma conversa como lidas
 * PUT /messages/conversation/:userId/read
 */
async function markConversationAsRead(req, res) {
  try {
    const { userId } = req.params;
    const current_user_id = req.user.id;
    
    // Validação
    if (!userId || isNaN(userId)) {
      return errors.badRequest(res, 'ID de usuário inválido');
    }
    
    // Marca todas as mensagens da conversa como lidas
    const result = await query(`
      UPDATE messages 
      SET is_read = TRUE, read_at = NOW()
      WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE
    `, [userId, current_user_id]);
    
    return success(res, 'Conversa marcada como lida', { 
      updatedCount: result.affectedRows 
    });
    
  } catch (error) {
    console.error('Erro ao marcar conversa como lida:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Busca estatísticas de mensagens do usuário
 * GET /messages/stats
 */
async function getMessageStats(req, res) {
  try {
    const user_id = req.user.id;
    
    // Estatísticas gerais
    const [stats] = await query(`
      SELECT 
        COUNT(*) as total_messages_sent,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = ?) as total_messages_received,
        (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = FALSE) as unread_messages,
        (SELECT COUNT(DISTINCT sender_id) FROM messages WHERE receiver_id = ?) as unique_conversations
      FROM messages 
      WHERE sender_id = ?
    `, [user_id, user_id, user_id, user_id]);
    
    return success(res, 'Estatísticas de mensagens', { stats });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de mensagens:', error.message);
    return errors.serverError(res);
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
  markConversationAsRead,
  getMessageStats
};
