// Configuração da API do BeSafe
const API_BASE_URL = 'http://localhost:3000';

/**
 * Classe para gerenciar as chamadas à API
 */
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
        throw new Error(data.message || `Erro HTTP: ${response.status}`);
      }

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
    const formData = new FormData();
    
    // Adiciona dados do usuário
    Object.keys(userData).forEach(key => {
      formData.append(key, userData[key]);
    });

    // Adiciona avatar se fornecido
    if (avatarFile) {
      formData.append('avatar', avatarFile);
    }

    return this.upload('/auth/register', formData);
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
}

// Instância única da API
const api = new ApiService();

export default api;
