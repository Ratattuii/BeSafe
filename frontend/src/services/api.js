// Importa configurações da API
import { API_CONFIG } from './api/config';

/**
 * Classe para gerenciar as chamadas à API
 */
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL.replace('/api', '') || 'http://localhost:3000';
    this.token = null;
  }

  /**
   * Define o token JWT para autenticação
   * @param {string} token - Token JWT
   */
  setToken(token) {
    this.token = token;
  }

  /**
   * Remove o token JWT
   */
  clearToken() {
    this.token = null;
  }

  /**
   * Faz uma requisição HTTP
   * @param {string} endpoint - Endpoint da API
   * @param {object} options - Opções da requisição
   * @returns {Promise} Resposta da API
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Headers padrão
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Adiciona token de autenticação se disponível
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    // Configuração da requisição
    const config = {
      method: 'GET',
      headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Se a resposta tem success: false, retorna o objeto completo
        if (data.success === false) {
          return data;
        }
        throw new Error(data.message || `Erro HTTP: ${response.status}`);
      }

      // Retorna o objeto completo da resposta (que contém success, message, data)
      return data;
    } catch (error) {
      console.error('Erro na API:', error.message);
      throw error;
    }
  }

  /**
   * Faz requisição GET
   * @param {string} endpoint - Endpoint da API
   * @returns {Promise} Resposta da API
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Faz requisição POST
   * @param {string} endpoint - Endpoint da API
   * @param {object} data - Dados para enviar
   * @returns {Promise} Resposta da API
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * Faz requisição PUT
   * @param {string} endpoint - Endpoint da API
   * @param {object} data - Dados para enviar
   * @returns {Promise} Resposta da API
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * Upload de arquivo (FormData)
   * @param {string} endpoint - Endpoint da API
   * @param {FormData} formData - Dados do formulário
   * @param {string} method - Método HTTP (POST ou PUT)
   * @returns {Promise} Resposta da API
   */
  async upload(endpoint, formData, method = 'POST') {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers = {};
    
    // Adiciona token de autenticação se disponível
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Erro HTTP: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Erro no upload:', error.message);
      throw error;
    }
  }

  // ===== MÉTODOS DE AUTENTICAÇÃO =====

  /**
   * Registra um novo usuário
   * @param {object} userData - Dados do usuário
   * @param {File} avatarFile - Arquivo de avatar (opcional)
   * @returns {Promise} Resposta da API
   */
  async register(userData, avatarFile = null) {
    // Enviar como JSON simples (sem avatar por enquanto)
    return this.post('/auth/register', userData);
  }

  /**
   * Faz login do usuário
   * @param {string} email - Email do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise} Resposta da API
   */
  async login(email, password) {
    return this.post('/auth/login', { email, password });
  }

  /**
   * Busca dados do usuário logado
   * @returns {Promise} Resposta da API
   */
  async getMe() {
    return this.get('/auth/me');
  }

  // ===== MÉTODOS DE USUÁRIO =====

  /**
   * Busca usuário por ID
   * @param {number} userId - ID do usuário
   * @returns {Promise} Resposta da API
   */
  async getUser(userId) {
    return this.get(`/users/${userId}`);
  }

  /**
   * Atualiza dados do usuário
   * @param {number} userId - ID do usuário
   * @param {object} userData - Dados para atualizar
   * @param {File} avatarFile - Novo avatar (opcional)
   * @returns {Promise} Resposta da API
   */
  async updateUser(userId, userData, avatarFile = null) {
    const formData = new FormData();
    
    // Adiciona dados do usuário
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });

    // Adiciona avatar se fornecido
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    return this.upload(`/users/${userId}`, formData, 'PUT');
  }

  // ===== MÉTODOS DE DOAÇÕES =====

  /**
   * Lista todas as doações
   * @param {object} filters - Filtros de busca
   * @returns {Promise} Resposta da API
   */
  async getDonations(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/donations${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Lista doações do usuário logado
   * @param {object} filters - Filtros de busca
   * @returns {Promise} Resposta da API
   */
  async getUserDonations(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/donations/me${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Cria uma nova doação
   * @param {object} donationData - Dados da doação
   * @returns {Promise} Resposta da API
   */
  async createDonation(donationData) {
    return this.post('/donations', donationData);
  }

  /**
   * Atualiza status de uma doação
   * @param {number} donationId - ID da doação
   * @param {string} status - Novo status
   * @returns {Promise} Resposta da API
   */
  async updateDonationStatus(donationId, status) {
    return this.put(`/donations/${donationId}/status`, { status });
  }

  /**
   * Retorna estatísticas de doações do usuário
   * @returns {Promise} Resposta da API
   */
  async getDonationStats() {
    return this.get('/donations/stats');
  }

  // ===== MÉTODOS DE MENSAGENS =====

  /**
   * Lista conversas do usuário
   * @returns {Promise} Resposta da API
   */
  async getConversations() {
    return this.get('/messages/conversations');
  }

  /**
   * Busca mensagens com um usuário específico
   * @param {number} userId - ID do usuário
   * @param {object} options - Opções de paginação
   * @returns {Promise} Resposta da API
   */
  async getMessagesWithUser(userId, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(options).forEach(key => {
      if (options[key] !== null && options[key] !== undefined) {
        queryParams.append(key, options[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/messages/${userId}${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Envia uma mensagem
   * @param {number} receiverId - ID do destinatário
   * @param {string} message - Conteúdo da mensagem
   * @param {string} messageType - Tipo da mensagem (text, image, file)
   * @returns {Promise} Resposta da API
   */
  async sendMessage(receiverId, message, messageType = 'text') {
    return this.post('/messages', {
      receiver_id: receiverId,
      message,
      message_type: messageType
    });
  }

  /**
   * Marca uma mensagem como lida
   * @param {number} messageId - ID da mensagem
   * @returns {Promise} Resposta da API
   */
  async markMessageAsRead(messageId) {
    return this.put(`/messages/${messageId}/read`);
  }

  /**
   * Marca todas as mensagens de uma conversa como lidas
   * @param {number} userId - ID do usuário da conversa
   * @returns {Promise} Resposta da API
   */
  async markConversationAsRead(userId) {
    return this.put(`/messages/conversation/${userId}/read`);
  }

  /**
   * Retorna estatísticas de mensagens
   * @returns {Promise} Resposta da API
   */
  async getMessageStats() {
    return this.get('/messages/stats');
  }

  // ===== MÉTODOS DE NOTIFICAÇÕES =====

  /**
   * Lista notificações do usuário
   * @param {object} filters - Filtros de busca
   * @returns {Promise} Resposta da API
   */
  async getNotifications(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Marca uma notificação como lida
   * @param {number} notificationId - ID da notificação
   * @returns {Promise} Resposta da API
   */
  async markNotificationAsRead(notificationId) {
    return this.put(`/notifications/${notificationId}/read`);
  }

  /**
   * Marca todas as notificações como lidas
   * @returns {Promise} Resposta da API
   */
  async markAllNotificationsAsRead() {
    return this.put('/notifications/read-all');
  }

  /**
   * Remove uma notificação
   * @param {number} notificationId - ID da notificação
   * @returns {Promise} Resposta da API
   */
  async deleteNotification(notificationId) {
    return this.request(`/notifications/${notificationId}`, { method: 'DELETE' });
  }

  /**
   * Retorna estatísticas de notificações
   * @returns {Promise} Resposta da API
   */
  async getNotificationStats() {
    return this.get('/notifications/stats');
  }

  // ===== MÉTODOS DE BUSCA =====

  /**
   * Busca geral (necessidades e instituições)
   * @param {string} query - Termo de busca
   * @param {object} filters - Filtros adicionais
   * @returns {Promise} Resposta da API
   */
  async searchAll(query, filters = {}) {
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('q', query);
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/search${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Busca apenas necessidades
   * @param {string} query - Termo de busca
   * @param {object} filters - Filtros adicionais
   * @returns {Promise} Resposta da API
   */
  async searchNeeds(query, filters = {}) {
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('q', query);
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/search/needs${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Busca apenas instituições
   * @param {string} query - Termo de busca
   * @param {object} filters - Filtros adicionais
   * @returns {Promise} Resposta da API
   */
  async searchInstitutions(query, filters = {}) {
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('q', query);
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/search/institutions${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Busca sugestões de autocomplete
   * @param {string} query - Termo de busca
   * @param {string} type - Tipo de sugestão (all, needs, institutions, categories)
   * @returns {Promise} Resposta da API
   */
  async getSearchSuggestions(query, type = 'all') {
    const queryParams = new URLSearchParams();
    if (query) queryParams.append('q', query);
    if (type) queryParams.append('type', type);
    const queryString = queryParams.toString();
    return this.get(`/search/suggestions${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Retorna estatísticas de busca
   * @returns {Promise} Resposta da API
   */
  async getSearchStats() {
    return this.get('/search/stats');
  }

  // ===== MÉTODOS DE INSTITUIÇÕES =====

  /**
   * Busca perfil de uma instituição
   * @param {number} institutionId - ID da instituição
   * @returns {Promise} Resposta da API
   */
  async getInstitution(institutionId) {
    return this.get(`/institutions/${institutionId}`);
  }

  /**
   * Lista necessidades de uma instituição
   * @param {number} institutionId - ID da instituição
   * @param {object} filters - Filtros de busca
   * @returns {Promise} Resposta da API
   */
  async getInstitutionNeeds(institutionId, filters = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/institutions/${institutionId}/needs${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Lista seguidores de uma instituição
   * @param {number} institutionId - ID da instituição
   * @param {object} options - Opções de paginação
   * @returns {Promise} Resposta da API
   */
  async getInstitutionFollowers(institutionId, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(options).forEach(key => {
      if (options[key] !== null && options[key] !== undefined) {
        queryParams.append(key, options[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/institutions/${institutionId}/followers${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Lista todas as instituições
   * @param {object} filters - Filtros de busca
   * @returns {Promise} Resposta da API
   */
  async getAllInstitutions(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/institutions${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Atualiza perfil da instituição
   * @param {number} institutionId - ID da instituição
   * @param {object} institutionData - Dados para atualizar
   * @param {File} avatarFile - Novo avatar (opcional)
   * @returns {Promise} Resposta da API
   */
  async updateInstitutionProfile(institutionId, institutionData, avatarFile = null) {
    const formData = new FormData();
    
    // Adiciona dados da instituição
    Object.keys(institutionData).forEach(key => {
      if (institutionData[key] !== null && institutionData[key] !== undefined) {
        formData.append(key, institutionData[key]);
      }
    });

    // Adiciona avatar se fornecido
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    return this.upload(`/institutions/${institutionId}`, formData, 'PUT');
  }

  /**
   * Retorna estatísticas de uma instituição
   * @param {number} institutionId - ID da instituição
   * @returns {Promise} Resposta da API
   */
  async getInstitutionStats(institutionId) {
    return this.get(`/institutions/${institutionId}/stats`);
  }

  /**
   * Lista instituições seguidas pelo usuário
   * @returns {Promise} Resposta da API
   */
  async getFollowedInstitutions() {
    return this.get('/me/follows');
  }

  /**
   * Segue uma instituição
   * @param {number} institutionId - ID da instituição
   * @returns {Promise} Resposta da API
   */
  async followInstitution(institutionId) {
    return this.post(`/institutions/${institutionId}/follow`);
  }

  /**
   * Deixa de seguir uma instituição
   * @param {number} institutionId - ID da instituição
   * @returns {Promise} Resposta da API
   */
  async unfollowInstitution(institutionId) {
    return this.request(`/institutions/${institutionId}/follow`, { method: 'DELETE' });
  }

  // ===== MÉTODOS DE NECESSIDADES (ENHANCED) =====

  /**
   * Lista necessidades com filtros
   * @param {object} filters - Filtros de busca
   * @returns {Promise} Resposta da API
   */
  async getNeeds(filters = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== null && filters[key] !== undefined) {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/needs${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Busca uma necessidade específica
   * @param {number} needId - ID da necessidade
   * @returns {Promise} Resposta da API
   */
  async getNeed(needId) {
    return this.get(`/needs/${needId}`);
  }

  /**
   * Cria uma nova necessidade
   * @param {object} needData - Dados da necessidade
   * @param {File} imageFile - Imagem da necessidade (opcional)
   * @returns {Promise} Resposta da API
   */
  async createNeed(needData, imageFile = null) {
    if (imageFile) {
      const formData = new FormData();
      Object.keys(needData).forEach(key => {
        if (needData[key] !== null && needData[key] !== undefined) {
          formData.append(key, needData[key]);
        }
      });
      formData.append('image', imageFile);
      return this.upload('/needs', formData, 'POST');
    } else {
      return this.post('/needs', needData);
    }
  }

  /**
   * Lista tipos de necessidades disponíveis
   * @returns {Promise} Resposta da API
   */
  async getNeedTypes() {
    return this.get('/needs/types');
  }

  /**
   * Curtir/descurtir uma necessidade
   * @param {number} needId - ID da necessidade
   * @returns {Promise} Resposta da API
   */
  async toggleNeedLike(needId) {
    return this.post(`/needs/${needId}/like`);
  }

  /**
   * Lista comentários de uma necessidade
   * @param {number} needId - ID da necessidade
   * @param {object} options - Opções de paginação
   * @returns {Promise} Resposta da API
   */
  async getNeedComments(needId, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(options).forEach(key => {
      if (options[key] !== null && options[key] !== undefined) {
        queryParams.append(key, options[key]);
      }
    });
    const queryString = queryParams.toString();
    return this.get(`/needs/${needId}/comments${queryString ? `?${queryString}` : ''}`);
  }

  /**
   * Adiciona um comentário a uma necessidade
   * @param {number} needId - ID da necessidade
   * @param {string} comment - Conteúdo do comentário
   * @returns {Promise} Resposta da API
   */
  async addNeedComment(needId, comment) {
    return this.post(`/needs/${needId}/comments`, { comment });
  }

  /**
   * Registra um compartilhamento
   * @param {number} needId - ID da necessidade
   * @param {string} shareType - Tipo de compartilhamento (opcional)
   * @returns {Promise} Resposta da API
   */
  async shareNeed(needId, shareType = 'general') {
    return this.post(`/needs/${needId}/share`, { share_type: shareType });
  }

  /**
   * Busca estatísticas de interação de uma necessidade
   * @param {number} needId - ID da necessidade
   * @returns {Promise} Resposta da API
   */
  async getNeedStats(needId) {
    return this.get(`/needs/${needId}/stats`);
  }
}

// Instância única da API
const api = new ApiService();

export default api;
