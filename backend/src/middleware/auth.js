const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/db');
const { errors } = require('../utils/responses');

/**
 * Middleware para verificar autenticação JWT
 */
async function authenticateToken(req, res, next) {
  try {
    // Busca o token no header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return errors.unauthorized(res, 'Token de acesso requerido');
    }

    // Verifica e decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Busca o usuário no banco para garantir que ainda existe
    const user = await queryOne(
      'SELECT id, name, email, role, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return errors.unauthorized(res, 'Usuário não encontrado');
    }

    // Adiciona o usuário na requisição
    req.user = user;
    next();

  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return errors.unauthorized(res, 'Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
      return errors.unauthorized(res, 'Token expirado');
    }
    
    return errors.serverError(res);
  }
}

/**
 * Gera um token JWT para o usuário
 * @param {object} user - Dados do usuário
 * @returns {string} Token JWT
 */
function generateToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d' // Token válido por 7 dias
  });
}

module.exports = {
  authenticateToken,
  generateToken
};