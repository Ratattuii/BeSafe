// Setup global para testes do BeSafe
const path = require('path');

// Configuração de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'besafe_test_db';

// Mock global do console para reduzir logs durante os testes
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Configuração global de timeout
jest.setTimeout(30000);

// Cleanup após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup após todos os testes
afterAll(() => {
  // Restaura o console original
  global.console = originalConsole;
});

// Mock global para módulos que não devem ser testados
jest.mock('../src/database/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  testConnection: jest.fn(() => Promise.resolve(true)),
  createConnection: jest.fn(),
  closePool: jest.fn()
}));

jest.mock('../src/config/firebase', () => ({
  getAuth: jest.fn(() => null),
  getFirestore: jest.fn(() => null),
  initializeFirebase: jest.fn(() => null),
  admin: {}
}));

// Mock para bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn((password, saltRounds) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => Promise.resolve(hash === `hashed_${password}`))
}));

// Mock para jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload, secret, options) => 'mock_jwt_token'),
  verify: jest.fn((token, secret) => ({ userId: 1, email: 'test@test.com', role: 'donor' }))
}));

// Mock para multer
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = null;
      next();
    },
    array: () => (req, res, next) => {
      req.files = [];
      next();
    }
  });
  multer.diskStorage = jest.fn();
  multer.memoryStorage = jest.fn();
  return multer;
});

// Mock para sharp
jest.mock('sharp', () => {
  return jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    png: jest.fn().mockReturnThis(),
    toBuffer: jest.fn(() => Promise.resolve(Buffer.from('mock_image_data')))
  }));
});

// Mock para fs
jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  readFileSync: jest.fn(() => 'mock_file_content'),
  writeFileSync: jest.fn()
}));

// Mock para path
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn(() => '.jpg'),
  basename: jest.fn(() => 'mock_file.jpg')
}));

// Configuração global para testes de API
global.testHelpers = {
  // Helper para criar usuário de teste
  createTestUser: (overrides = {}) => ({
    id: 1,
    name: 'Test User',
    email: 'test@test.com',
    role: 'donor',
    avatar: null,
    created_at: new Date(),
    ...overrides
  }),
  
  // Helper para criar necessidade de teste
  createTestNeed: (overrides = {}) => ({
    id: 1,
    title: 'Test Need',
    description: 'Test description',
    category: 'alimentos',
    urgency: 'media',
    status: 'ativa',
    institution_id: 1,
    created_at: new Date(),
    ...overrides
  }),
  
  // Helper para criar doação de teste
  createTestDonation: (overrides = {}) => ({
    id: 1,
    donor_id: 1,
    institution_id: 1,
    need_id: 1,
    quantity: 10,
    unit: 'kg',
    status: 'pendente',
    created_at: new Date(),
    ...overrides
  })
};

// Configuração de expectativas globais
expect.extend({
  toBeValidJWT(received) {
    const pass = typeof received === 'string' && received.length > 0;
    return {
      message: () => `expected ${received} to be a valid JWT token`,
      pass
    };
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    return {
      message: () => `expected ${received} to be a valid email`,
      pass
    };
  }
});

// Configuração de cleanup automático
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});
