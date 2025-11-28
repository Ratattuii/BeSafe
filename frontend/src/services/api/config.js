// Importa variáveis de ambiente usando react-native-dotenv
import { API_BASE_URL } from '@env';

// Configurações da API
export const API_CONFIG = {
  BASE_URL: API_BASE_URL || 'http://localhost:3000/api',
  
  TIMEOUT: 10000, // 10 segundos
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      VERIFY: '/auth/verify',
    },
    
    // Usuários
    USERS: {
      PROFILE: '/users/profile',
      UPDATE_PROFILE: '/users/profile',
      CHANGE_PASSWORD: '/users/change-password',
    },
    
    // Instituições
    INSTITUTIONS: {
      LIST: '/institutions',
      DETAIL: (id) => `/institutions/${id}`,
      NEEDS: (id) => `/institutions/${id}/needs`,
      DONATIONS: (id) => `/institutions/${id}/donations`,
      FOLLOW: (id) => `/institutions/${id}/follow`,
      UNFOLLOW: (id) => `/institutions/${id}/unfollow`,
      FOLLOWERS: (id) => `/institutions/${id}/followers`,
    },
    
    // Doadores
    DONORS: {
      LIST: '/donors',
      DETAIL: (id) => `/donors/${id}`,
      DONATIONS_MADE: (id) => `/donors/${id}/donations/made`,
      DONATIONS_OFFERED: (id) => `/donors/${id}/donations/offered`,
      FOLLOWING: (id) => `/donors/${id}/following`,
    },
    
    // Necessidades
    NEEDS: {
      LIST: '/needs',
      CREATE: '/needs',
      DETAIL: (id) => `/needs/${id}`,
      UPDATE: (id) => `/needs/${id}`,
      DELETE: (id) => `/needs/${id}`,
      CLOSE: (id) => `/needs/${id}/close`,
    },
    
    // Doações
    DONATIONS: {
      LIST: '/donations',
      CREATE: '/donations',
      DETAIL: (id) => `/donations/${id}`,
      UPDATE: (id) => `/donations/${id}`,
      DELETE: (id) => `/donations/${id}`,
      CONFIRM: (id) => `/donations/${id}/confirm`,
    },
    
    // Chat
    CHAT: {
      CONVERSATIONS: '/chat/conversations',
      MESSAGES: (chatId) => `/chat/${chatId}/messages`,
      SEND_MESSAGE: (chatId) => `/chat/${chatId}/messages`,
      MARK_READ: (chatId) => `/chat/${chatId}/read`,
    },
    
    // Notificações
    NOTIFICATIONS: {
      LIST: '/notifications',
      MARK_READ: (id) => `/notifications/${id}/read`,
      MARK_ALL_READ: '/notifications/mark-all-read',
      SETTINGS: '/notifications/settings',
    },
    
    // Busca
    SEARCH: {
      GENERAL: '/search',
      NEEDS: '/search/needs',
      INSTITUTIONS: '/search/institutions',
      DONATIONS: '/search/donations',
    },
    
    // Upload
    UPLOAD: {
      IMAGE: '/upload/image',
      MULTIPLE_IMAGES: '/upload/images',
    },
  },
  
  // Headers padrão
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Status codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },
};

// Configurações de desenvolvimento
export const DEV_CONFIG = {
  ENABLE_LOGS: process.env.NODE_ENV === 'development',
  MOCK_DELAY: 1000,
  USE_MOCK_DATA: false,
};

export default API_CONFIG;



