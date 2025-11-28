import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, DEV_CONFIG } from './config';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.defaultHeaders = API_CONFIG.DEFAULT_HEADERS;
  }

  // Método para obter token do AsyncStorage
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('@BeSafe:token');
    } catch (error) {
      console.error('Erro ao obter token:', error);
      return null;
    }
  }

  // Método para preparar headers da requisição
  async prepareHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    const token = await this.getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Método principal para fazer requisições
  async makeRequest(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers: customHeaders = {},
      timeout = this.timeout,
      ...otherOptions
    } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.prepareHeaders(customHeaders);

    const requestConfig = {
      method,
      headers,
      ...otherOptions,
    };

    // Adicionar body apenas se não for GET
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        delete requestConfig.headers['Content-Type'];
        requestConfig.body = body;
      } else {
        requestConfig.body = JSON.stringify(body);
      }
    }

    if (DEV_CONFIG.ENABLE_LOGS) {
      console.log('API Request:', {
        url,
        method,
        headers: requestConfig.headers,
        body: body instanceof FormData ? 'FormData' : body,
      });
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (DEV_CONFIG.ENABLE_LOGS) {
        console.log('API Response:', {
          url,
          status: response.status,
          ok: response.ok,
        });
      }

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        success: true,
        data,
        status: response.status,
        headers: response.headers,
      };

    } catch (error) {
      if (DEV_CONFIG.ENABLE_LOGS) {
        console.error('API Error:', {
          url,
          error: error.message,
        });
      }

      if (error.name === 'AbortError') {
        throw new Error('Tempo limite da requisição esgotado');
      }

      throw this.handleNetworkError(error);
    }
  }

  // Tratar erros de resposta HTTP
  async handleErrorResponse(response) {
    let errorMessage = 'Erro na requisição';
    let errorData = null;

    try {
      errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `Erro ${response.status}: ${response.statusText}`;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = errorData;

    // Se for erro 401, limpar token (usuário não autenticado)
    if (response.status === API_CONFIG.STATUS_CODES.UNAUTHORIZED) {
      await AsyncStorage.removeItem('@BeSafe:token');
      await AsyncStorage.removeItem('@BeSafe:user');
    }

    throw error;
  }

  // Tratar erros de rede
  handleNetworkError(error) {
    if (!navigator.onLine) {
      return new Error('Sem conexão com a internet');
    }

    if (error.message.includes('fetch')) {
      return new Error('Erro de conexão com o servidor');
    }

    return error;
  }

  // Métodos de conveniência para diferentes tipos de requisição
  async get(endpoint, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body = null, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body = null, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(endpoint, body = null, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint, options = {}) {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' });
  }

  // Método para upload de imagens
  async uploadImage(imageUri, fieldName = 'image') {
    const formData = new FormData();
    
    // Preparar arquivo para upload
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append(fieldName, {
      uri: imageUri,
      name: filename,
      type,
    });

    return this.post(API_CONFIG.ENDPOINTS.UPLOAD.IMAGE, formData);
  }

  // Método para upload múltiplo de imagens
  async uploadMultipleImages(imageUris, fieldName = 'images') {
    const formData = new FormData();
    
    imageUris.forEach((imageUri, index) => {
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append(`${fieldName}[${index}]`, {
        uri: imageUri,
        name: filename,
        type,
      });
    });

    return this.post(API_CONFIG.ENDPOINTS.UPLOAD.MULTIPLE_IMAGES, formData);
  }
}

// Instância singleton do cliente API
const apiClient = new ApiClient();

export default apiClient;