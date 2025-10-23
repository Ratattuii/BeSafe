const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/db');

/**
 * Serviço de WebSocket para chat em tempo real
 */
class SocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*", // Em produção, especificar domínios permitidos
        methods: ["GET", "POST"]
      }
    });
    
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Cliente conectado: ${socket.id}`);

      // Autenticação do usuário
      socket.on('authenticate', async (data) => {
        try {
          const { token } = data;
          
          if (!token) {
            socket.emit('auth_error', { message: 'Token não fornecido' });
            return;
          }

          // Verificar token JWT
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Buscar usuário no banco
          const user = await queryOne(
            'SELECT id, name, email, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
          );

          if (!user) {
            socket.emit('auth_error', { message: 'Usuário não encontrado' });
            return;
          }

          // Registrar usuário conectado
          this.connectedUsers.set(user.id, socket.id);
          this.userSockets.set(socket.id, user.id);
          
          socket.userId = user.id;
          socket.user = user;

          console.log(`Usuário autenticado: ${user.name} (${user.id})`);
          
          socket.emit('authenticated', { 
            message: 'Autenticado com sucesso',
            user: user 
          });

          // Notificar outros usuários que este usuário está online
          socket.broadcast.emit('user_online', { 
            userId: user.id, 
            userName: user.name 
          });

        } catch (error) {
          console.error('Erro na autenticação:', error.message);
          socket.emit('auth_error', { message: 'Token inválido' });
        }
      });

      // Entrar em uma conversa
      socket.on('join_conversation', (data) => {
        try {
          const { conversationId } = data;
          
          if (!socket.userId) {
            socket.emit('error', { message: 'Usuário não autenticado' });
            return;
          }

          socket.join(`conversation_${conversationId}`);
          console.log(`Usuário ${socket.userId} entrou na conversa ${conversationId}`);
          
          socket.emit('joined_conversation', { conversationId });
          
        } catch (error) {
          console.error('Erro ao entrar na conversa:', error.message);
          socket.emit('error', { message: 'Erro ao entrar na conversa' });
        }
      });

      // Sair de uma conversa
      socket.on('leave_conversation', (data) => {
        try {
          const { conversationId } = data;
          socket.leave(`conversation_${conversationId}`);
          console.log(`Usuário ${socket.userId} saiu da conversa ${conversationId}`);
          
          socket.emit('left_conversation', { conversationId });
          
        } catch (error) {
          console.error('Erro ao sair da conversa:', error.message);
        }
      });

      // Enviar mensagem
      socket.on('send_message', async (data) => {
        try {
          const { conversationId, message, receiverId } = data;
          
          if (!socket.userId) {
            socket.emit('error', { message: 'Usuário não autenticado' });
            return;
          }

          if (!message || !message.trim()) {
            socket.emit('error', { message: 'Mensagem não pode estar vazia' });
            return;
          }

          // Salvar mensagem no banco
          const result = await queryOne(
            'INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())',
            [socket.userId, receiverId, message.trim()]
          );

          const messageData = {
            id: result.insertId,
            sender_id: socket.userId,
            receiver_id: receiverId,
            message: message.trim(),
            created_at: new Date().toISOString(),
            sender_name: socket.user.name,
          };

          // Enviar para a conversa específica
          this.io.to(`conversation_${conversationId}`).emit('new_message', messageData);
          
          // Enviar notificação para o destinatário se não estiver na conversa
          const receiverSocketId = this.connectedUsers.get(receiverId);
          if (receiverSocketId && receiverSocketId !== socket.id) {
            this.io.to(receiverSocketId).emit('message_notification', {
              ...messageData,
              conversationId,
            });
          }

          console.log(`Mensagem enviada: ${socket.userId} -> ${receiverId}`);
          
        } catch (error) {
          console.error('Erro ao enviar mensagem:', error.message);
          socket.emit('error', { message: 'Erro ao enviar mensagem' });
        }
      });

      // Indicador de digitação
      socket.on('typing', (data) => {
        try {
          const { conversationId, isTyping } = data;
          
          if (!socket.userId) return;

          socket.to(`conversation_${conversationId}`).emit('user_typing', {
            userId: socket.userId,
            userName: socket.user.name,
            isTyping: isTyping,
          });
          
        } catch (error) {
          console.error('Erro no indicador de digitação:', error.message);
        }
      });

      // Marcar mensagem como lida
      socket.on('mark_as_read', async (data) => {
        try {
          const { messageId, conversationId } = data;
          
          if (!socket.userId) return;

          // Atualizar mensagem como lida no banco
          await queryOne(
            'UPDATE messages SET is_read = TRUE, read_at = NOW() WHERE id = ? AND receiver_id = ?',
            [messageId, socket.userId]
          );

          // Notificar o remetente que a mensagem foi lida
          const message = await queryOne(
            'SELECT sender_id FROM messages WHERE id = ?',
            [messageId]
          );

          if (message) {
            const senderSocketId = this.connectedUsers.get(message.sender_id);
            if (senderSocketId) {
              this.io.to(senderSocketId).emit('message_read', {
                messageId: messageId,
                readBy: socket.userId,
                readAt: new Date().toISOString(),
              });
            }
          }
          
        } catch (error) {
          console.error('Erro ao marcar como lida:', error.message);
        }
      });

      // Desconexão
      socket.on('disconnect', () => {
        try {
          if (socket.userId) {
            console.log(`Usuário desconectado: ${socket.user.name} (${socket.userId})`);
            
            // Remover das listas de usuários conectados
            this.connectedUsers.delete(socket.userId);
            this.userSockets.delete(socket.id);
            
            // Notificar outros usuários que este usuário está offline
            socket.broadcast.emit('user_offline', { 
              userId: socket.userId, 
              userName: socket.user.name 
            });
          }
          
          console.log(`Cliente desconectado: ${socket.id}`);
          
        } catch (error) {
          console.error('Erro na desconexão:', error.message);
        }
      });
    });
  }

  /**
   * Enviar mensagem para usuário específico
   * @param {number} userId - ID do usuário
   * @param {string} event - Nome do evento
   * @param {object} data - Dados da mensagem
   */
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Enviar mensagem para todos os usuários conectados
   * @param {string} event - Nome do evento
   * @param {object} data - Dados da mensagem
   */
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  /**
   * Obter lista de usuários conectados
   */
  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  /**
   * Verificar se usuário está conectado
   * @param {number} userId - ID do usuário
   */
  isUserConnected(userId) {
    return this.connectedUsers.has(userId);
  }
}

module.exports = SocketService;
