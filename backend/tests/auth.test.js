const request = require('supertest');
const app = require('../src/server');

// Mock do banco de dados para testes
jest.mock('../src/database/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  testConnection: jest.fn(() => Promise.resolve(true))
}));

// Mock do Firebase Admin SDK
jest.mock('../src/config/firebase', () => ({
  getAuth: jest.fn(() => null),
  getFirestore: jest.fn(() => null),
  initializeFirebase: jest.fn(() => null)
}));

describe('BeSafe API Tests', () => {
  beforeEach(() => {
    // Limpa todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  describe('GET /', () => {
    it('should return API status', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('BeSafe API está funcionando');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.availableRoutes).toBeInstanceOf(Array);
    });
  });

  describe('POST /auth/register', () => {
    const { query, queryOne } = require('../src/database/db');

    it('should register a new user successfully', async () => {
      // Mock: email não existe
      queryOne.mockResolvedValueOnce(null);
      
      // Mock: inserção bem-sucedida
      query.mockResolvedValueOnce({ insertId: 1 });
      
      // Mock: busca do usuário criado
      queryOne.mockResolvedValueOnce({
        id: 1,
        name: 'João Silva',
        email: 'joao@teste.com',
        role: 'donor',
        avatar: null,
        created_at: new Date()
      });

      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123456',
        role: 'donor'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuário registrado com sucesso');
      expect(response.body.data.user.email).toBe('joao@teste.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for duplicate email', async () => {
      // Mock: email já existe
      queryOne.mockResolvedValueOnce({ id: 1 });

      const userData = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123456',
        role: 'donor'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email já cadastrado');
    });

    it('should return error for missing required fields', async () => {
      const userData = {
        name: 'João Silva',
        // email missing
        password: '123456',
        role: 'donor'
      };

      const response = await request(app)
        .post('/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Campos obrigatórios');
    });
  });

  describe('POST /auth/login', () => {
    const { queryOne } = require('../src/database/db');
    const bcrypt = require('bcrypt');

    it('should login successfully with valid credentials', async () => {
      // Mock: usuário encontrado
      queryOne.mockResolvedValueOnce({
        id: 1,
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '$2b$10$hashedpassword',
        role: 'donor',
        avatar: null
      });

      // Mock: bcrypt.compare retorna true
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const loginData = {
        email: 'joao@teste.com',
        password: '123456'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login realizado com sucesso');
      expect(response.body.data.user.email).toBe('joao@teste.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      // Mock: usuário não encontrado
      queryOne.mockResolvedValueOnce(null);

      const loginData = {
        email: 'joao@teste.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Email ou senha incorretos');
    });
  });

  describe('GET /needs', () => {
    const { query } = require('../src/database/db');

    it('should return list of needs', async () => {
      // Mock: lista de necessidades
      query.mockResolvedValueOnce([
        {
          id: 1,
          title: 'Alimentos para crianças',
          description: 'Precisamos de alimentos não perecíveis',
          category: 'alimentos',
          urgency: 'alta',
          status: 'ativa',
          institution_name: 'ONG Esperança',
          created_at: new Date()
        }
      ]);

      const response = await request(app)
        .get('/needs')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.needs).toBeInstanceOf(Array);
      expect(response.body.data.needs.length).toBe(1);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Rota não encontrada');
    });
  });
});
