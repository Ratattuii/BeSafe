const express = require('express');
const router = express.Router();
const { getUserById, updateUser } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');

/**
 * GET /users/:id
 * Busca usuário por ID
 * Headers: Authorization: Bearer <token>
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * PUT /users/:id
 * Atualiza dados do usuário
 * Body: { name }
 * File: avatar (opcional)
 * Headers: Authorization: Bearer <token>
 */
router.put('/:id', authenticateToken, handleUploadError, updateUser);

module.exports = router;
