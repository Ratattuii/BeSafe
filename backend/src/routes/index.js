const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const donationRoutes = require('./donations');
const followRoutes = require('./follows');
const institutionRoutes = require('./institutions');
const mapRoutes = require('./map');
const messageRoutes = require('./messages');
const needRoutes = require('./needs');
const notificationRoutes = require('./notifications');
const reviewRoutes = require('./reviews');
const searchRoutes = require('./search');
const userRoutes = require('./users');
const offerRoutes = require('./offers');

// Rotas públicas
router.use('/auth', authRoutes);

// Rotas protegidas (requerem autenticação)
router.use('/admin', adminRoutes);
router.use('/donations', donationRoutes);
router.use('/follows', followRoutes);
router.use('/institutions', institutionRoutes);
router.use('/map', mapRoutes);
router.use('/messages', messageRoutes);
router.use('/needs', needRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/search', searchRoutes);
router.use('/users', userRoutes);
router.use('/offers', offerRoutes); 

module.exports = router;