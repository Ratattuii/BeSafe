const { getAuth } = require('../config/firebase');
const { errors } = require('../utils/responses');

/**
 * Middleware para verificar token Firebase
 * Verifica se o token Firebase é válido e retorna dados do usuário
 */
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return errors.unauthorized(res, 'Token Firebase requerido');
    }

    const auth = getAuth();
    if (!auth) {
      return errors.serverError(res, 'Firebase não configurado');
    }

    // Verifica o token Firebase
    const decodedToken = await auth.verifyIdToken(token);
    
    // Adiciona dados do usuário Firebase na requisição
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email.split('@')[0],
      email_verified: decodedToken.email_verified,
      picture: decodedToken.picture
    };

    next();
  } catch (error) {
    console.error('Erro na verificação do token Firebase:', error.message);
    
    if (error.code === 'auth/invalid-token') {
      return errors.unauthorized(res, 'Token Firebase inválido');
    }
    if (error.code === 'auth/token-expired') {
      return errors.unauthorized(res, 'Token Firebase expirado');
    }
    
    return errors.serverError(res, 'Erro na autenticação Firebase');
  }
}

/**
 * Middleware híbrido: aceita tanto JWT quanto Firebase
 * Tenta Firebase primeiro, depois JWT como fallback
 */
async function authenticateHybrid(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return errors.unauthorized(res, 'Token de acesso requerido');
    }

    // Tenta Firebase primeiro
    const auth = getAuth();
    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(token);
        req.firebaseUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email.split('@')[0],
          email_verified: decodedToken.email_verified,
          picture: decodedToken.picture
        };
        req.authType = 'firebase';
        return next();
      } catch (firebaseError) {
        // Se Firebase falhar, continua para JWT
        console.log('Token não é Firebase, tentando JWT...');
      }
    }

    // Fallback para JWT
    const jwt = require('jsonwebtoken');
    const { queryOne } = require('../database/db');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await queryOne(
      'SELECT id, name, email, role, avatar FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return errors.unauthorized(res, 'Usuário não encontrado');
    }

    req.user = user;
    req.authType = 'jwt';
    next();

  } catch (error) {
    console.error('Erro na autenticação híbrida:', error.message);
    return errors.unauthorized(res, 'Token inválido');
  }
}

module.exports = {
  verifyFirebaseToken,
  authenticateHybrid
};
