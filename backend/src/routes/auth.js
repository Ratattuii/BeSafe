const express = require('express');
const router = express.Router();
const { register, login, loginWithFirebase, me } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { handleUploadError } = require('../middleware/upload');
const { validateRequest } = require('../utils/validation');

/**
 * POST /auth/register
 * Registra um novo usuário
 * Body: { name, email, password, role }
 * File: avatar (opcional)
 */
router.post('/register', handleUploadError, register);

/**
 * POST /auth/login
 * Faz login do usuário
 * Body: { email, password }
 */
router.post('/login', login);

/**
 * POST /auth/firebase
 * Login/Registro com Firebase
 * Body: { firebaseToken, role }
 */
router.post('/firebase', validateRequest('firebaseLogin'), loginWithFirebase);

/**
 * GET /auth/me
 * Retorna dados do usuário logado
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', authenticateToken, me);

module.exports = router;
