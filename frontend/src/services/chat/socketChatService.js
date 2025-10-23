import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../services/api/config';

/**
 * Serviço de Socket.IO para chat em tempo real
 */
class SocketChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Conecta ao servidor Socket.IO
   */
  async connect() {
    try {
      if (this.socket && this.isConnected) {
        console.log('Socket já está conectado');
        return true;
      }

      // Obter token do AsyncStorage
      const token = await AsyncStorage.getItem('@BeSafe:token');
      if (!token) {
        console.error('Token não encontrado para conectar ao Socket.IO');
        return false;
      }

      // URL do servidor (remover /api do final se existir)
      const serverUrl = API_CONFIG.BASE_URL.replace('/api', '');
      
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
      });

      this.setupEventHandlers();
      
      // Autenticar após conectar
      this.socket.on('connect', () => {
        console.log('Conectado ao Socket.IO');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.authenticate(token);
      });

      return true;
    } catch (error) {
      console.error('Erro ao conectar Socket.IO:', error);
      return false;
    }
  }

  /**
   * Configura os event handlers do Socket.IO
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Conexão estabelecida
    this.socket.on('connect', () => {
      console.log('Socket.IO conectado');
      this.isConnected = true;
      this.emit('connection_status', { connected: true });
    });

    // Desconectado
    this.socket.on('disconnect', (reason) => {
      console.log('Socket.IO desconectado:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.emit('connection_status', { connected: false, reason });
    });

    // Erro de conexão
    this.socket.on('connect_error', (error) => {
      console.error('Erro de conexão Socket.IO:', error);
      this.emit('connection_error', error);
    });

    // Autenticação bem-sucedida
    this.socket.on('authenticated', (data) => {
      console.log('Socket.IO autenticado:', data.user.name);
      this.isAuthenticated = true;
      this.emit('authenticated', data);
    });

    // Erro de autenticação
    this.socket.on('auth_error', (error) => {
      console.error('Erro de autenticação Socket.IO:', error);
      this.isAuthenticated = false;
      this.emit('auth_error', error);
    });

    // Nova mensagem recebida
    this.socket.on('new_message', (message) => {
      console.log('Nova mensagem recebida:', message);
      this.emit('new_message', message);
    });

    // Notificação de mensagem
    this.socket.on('message_notification', (notification) => {
      console.log('Notificação de mensagem:', notification);
      this.emit('message_notification', notification);
    });

    // Usuário digitando
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    // Mensagem marcada como lida
    this.socket.on('message_read', (data) => {
      this.emit('message_read', data);
    });

    // Usuário online
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    // Usuário offline
    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Entrou na conversa
    this.socket.on('joined_conversation', (data) => {
      this.emit('joined_conversation', data);
    });

    // Saiu da conversa
    this.socket.on('left_conversation', (data) => {
      this.emit('left_conversation', data);
    });

    // Erro geral
    this.socket.on('error', (error) => {
      console.error('Erro Socket.IO:', error);
      this.emit('error', error);
    });
  }

  /**
   * Autentica o usuário no Socket.IO
   */
  async authenticate(token) {
    if (!this.socket || !this.isConnected) {
      console.error('Socket não conectado para autenticação');
      return false;
    }

    try {
      this.socket.emit('authenticate', { token });
      return true;
    } catch (error) {
      console.error('Erro ao autenticar Socket.IO:', error);
      return false;
    }
  }

  /**
   * Entra em uma conversa
   */
  joinConversation(conversationId) {
    if (!this.socket || !this.isAuthenticated) {
      console.error('Socket não autenticado para entrar na conversa');
      return false;
    }

    try {
      this.socket.emit('join_conversation', { conversationId });
      return true;
    } catch (error) {
      console.error('Erro ao entrar na conversa:', error);
      return false;
    }
  }

  /**
   * Sai de uma conversa
   */
  leaveConversation(conversationId) {
    if (!this.socket || !this.isAuthenticated) {
      return false;
    }

    try {
      this.socket.emit('leave_conversation', { conversationId });
      return true;
    } catch (error) {
      console.error('Erro ao sair da conversa:', error);
      return false;
    }
  }

  /**
   * Envia uma mensagem
   */
  sendMessage(conversationId, message, receiverId) {
    if (!this.socket || !this.isAuthenticated) {
      console.error('Socket não autenticado para enviar mensagem');
      return false;
    }

    if (!message || !message.trim()) {
      console.error('Mensagem vazia');
      return false;
    }

    try {
      this.socket.emit('send_message', {
        conversationId,
        message: message.trim(),
        receiverId,
      });
      return true;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      return false;
    }
  }

  /**
   * Envia indicador de digitação
   */
  setTyping(conversationId, isTyping) {
    if (!this.socket || !this.isAuthenticated) {
      return false;
    }

    try {
      this.socket.emit('typing', { conversationId, isTyping });
      return true;
    } catch (error) {
      console.error('Erro ao enviar indicador de digitação:', error);
      return false;
    }
  }

  /**
   * Marca mensagem como lida
   */
  markAsRead(messageId, conversationId) {
    if (!this.socket || !this.isAuthenticated) {
      return false;
    }

    try {
      this.socket.emit('mark_as_read', { messageId, conversationId });
      return true;
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
      return false;
    }
  }

  /**
   * Adiciona listener para eventos
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove listener para eventos
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emite evento para listeners locais
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erro no listener do evento ${event}:`, error);
        }
      });
    }
  }

  /**
   * Desconecta do Socket.IO
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.isAuthenticated = false;
      this.listeners.clear();
      console.log('Socket.IO desconectado');
    }
  }

  /**
   * Verifica se está conectado
   */
  isSocketConnected() {
    return this.isConnected && this.isAuthenticated;
  }

  /**
   * Reconecta ao servidor
   */
  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Máximo de tentativas de reconexão atingido');
      return false;
    }

    this.reconnectAttempts++;
    console.log(`Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000 * this.reconnectAttempts));
    return await this.connect();
  }
}

// Instância singleton do serviço
const socketChatService = new SocketChatService();

export default socketChatService;
