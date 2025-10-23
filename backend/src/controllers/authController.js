const bcrypt = require('bcrypt');
const { query, queryOne } = require('../database/db');
const { generateToken } = require('../middleware/auth');
const { success, errors } = require('../utils/responses');
const { validateRequired, validateEmail, validatePassword, validateUserRole, runValidations } = require('../utils/validation');
const { getAuth } = require('../config/firebase');

/**
 * Registra um novo usuário
 * POST /auth/register
 */
async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Validações usando utilitários
    const validationError = runValidations(
      validateRequired(['name', 'email', 'password'], { name, email, password }),
      validateEmail(email),
      validatePassword(password),
      validateUserRole(role)
    );
    
    if (validationError) {
      return errors.badRequest(res, validationError);
    }

    // Verifica se email já existe
    const existingUser = await queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      return errors.conflict(res, 'Email já cadastrado');
    }

    // Hash da senha e processa avatar
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    // Insere usuário no banco
    const result = await query(
      'INSERT INTO users (name, email, password, role, avatar) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, avatarPath]
    );

    // Busca o usuário criado (sem a senha)
    const newUser = await queryOne(
      'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // Gera token JWT
    const token = generateToken(newUser);

    return success(res, 'Usuário registrado com sucesso', { user: newUser, token }, 201);

  } catch (error) {
    console.error('Erro no registro:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Faz login do usuário
 * POST /auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validações usando utilitários
    const validationError = validateRequired(['email', 'password'], { email, password });
    if (validationError) {
      return errors.badRequest(res, validationError);
    }

    // Busca usuário no banco
    const user = await queryOne(
      'SELECT id, name, email, password, role, avatar FROM users WHERE email = ?',
      [email]
    );

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return errors.unauthorized(res, 'Email ou senha incorretos');
    }

    // Remove senha e gera token
    delete user.password;
    const token = generateToken(user);

    return success(res, 'Login realizado com sucesso', { user, token });

  } catch (error) {
    console.error('Erro no login:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Retorna dados do usuário logado
 * GET /auth/me
 */
async function me(req, res) {
  try {
    return success(res, 'Dados do usuário', { user: req.user });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error.message);
    return errors.serverError(res);
  }
}

/**
 * Login/Registro com Firebase
 * POST /auth/firebase
 */
async function loginWithFirebase(req, res) {
  try {
    const { firebaseToken, role = 'donor' } = req.body;

    if (!firebaseToken) {
      return errors.badRequest(res, 'Token Firebase requerido');
    }

    const auth = getAuth();
    if (!auth) {
      return errors.serverError(res, 'Firebase não configurado');
    }

    // Verifica o token Firebase
    const decodedToken = await auth.verifyIdToken(firebaseToken);
    const { uid, email, name, email_verified, picture } = decodedToken;

    // Busca usuário existente no banco
    let user = await queryOne(
      'SELECT id, name, email, role, avatar FROM users WHERE email = ?',
      [email]
    );

    if (!user) {
      // Cria novo usuário se não existir
      const avatarPath = picture ? picture : null;
      const result = await query(
        'INSERT INTO users (name, email, password, role, avatar, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [name || email.split('@')[0], email, 'firebase_auth', role, avatarPath, email_verified]
      );

      user = await queryOne(
        'SELECT id, name, email, role, avatar, created_at FROM users WHERE id = ?',
        [result.insertId]
      );
    }

    // Gera token JWT para compatibilidade
    const token = generateToken(user);

    return success(res, 'Login Firebase realizado com sucesso', { 
      user, 
      token,
      firebaseUid: uid 
    });

  } catch (error) {
    console.error('Erro no login Firebase:', error.message);
    
    if (error.code === 'auth/invalid-token') {
      return errors.unauthorized(res, 'Token Firebase inválido');
    }
    
    return errors.serverError(res);
  }
}

module.exports = {
  register,
  login,
  loginWithFirebase,
  me
};
