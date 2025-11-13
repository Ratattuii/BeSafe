const jwt = require('jsonwebtoken');
const { queryOne } = require('../database/db');

/**
 * Middleware para verificar o token JWT
 * Adiciona req.user com os dados do usuário
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erro na verificação do JWT:', err.message);
      return res.status(403).json({ message: 'Token inválido ou expirado.' });
    }
    req.user = user; // Adiciona os dados do usuário (id, role) ao request
    next();
  });
};

/**
 * Middleware para verificar o papel (role) do usuário
 * Ex: checkUserRole(['admin', 'receiver'])
 */
const checkUserRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para este recurso.' });
    }
    next();
  };
};

/**
 * Middleware específico para verificar se é Admin
 */
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores.' });
  }
  next();
};

/**
 * Middleware para verificar se o usuário é o dono do recurso ou um admin
 * (Exemplo, pode não ser usado em todas as rotas)
 */
const isOwnerOrAdmin = (paramIdField = 'id') => {
  return (req, res, next) => {
    const resourceId = req.params[paramIdField];
    if (req.user.role === 'admin' || req.user.id.toString() === resourceId) {
      next();
    } else {
      res.status(403).json({ message: 'Acesso negado. Você não é o dono deste recurso nem um admin.' });
    }
  };
};

/**
 * Middleware para verificar se o usuário é o dono de um item (ex: doação, necessidade)
 */
const isOwner = (tableName, paramIdField = 'id') => {
  return async (req, res, next) => {
    const resourceId = req.params[paramIdField];
    const userId = req.user.id;

    try {
      const row = await queryOne(`SELECT user_id FROM ${tableName} WHERE id = ?`, [resourceId]);
      if (!row) {
        return res.status(404).json({ message: 'Recurso não encontrado.' });
      }

      if (row.user_id === userId) {
        next();
      } else {
        res.status(403).json({ message: 'Acesso negado. Você não é o dono deste recurso.' });
      }
    } catch (error) {
      console.error(`Erro ao verificar dono (${tableName}):`, error);
      res.status(500).json({ message: 'Erro interno ao verificar permissões.' });
    }
  };
};

// --- EXPORTAÇÕES (O que estava faltando no seu arquivo) ---
module.exports = {
  authenticateToken,
  checkUserRole,
  isAdmin,
  isOwnerOrAdmin,
  isOwner
};