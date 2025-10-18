const express = require('express');
const router = express.Router();
const { 
  searchAll, 
  searchNeeds, 
  searchInstitutions, 
  getSearchSuggestions,
  getSearchStats 
} = require('../controllers/searchController');

/**
 * GET /search
 * Busca geral (necessidades e instituições)
 * Query params: q, category, urgency, location, limit, offset
 */
router.get('/', searchAll);

/**
 * GET /search/needs
 * Busca apenas necessidades
 * Query params: q, category, urgency, location, sort, limit, offset
 */
router.get('/needs', searchNeeds);

/**
 * GET /search/institutions
 * Busca apenas instituições
 * Query params: q, institution_type, activity_area, location, verified_only, limit, offset
 */
router.get('/institutions', searchInstitutions);

/**
 * GET /search/suggestions
 * Busca sugestões de autocomplete
 * Query params: q, type
 */
router.get('/suggestions', getSearchSuggestions);

/**
 * GET /search/stats
 * Retorna estatísticas de busca
 */
router.get('/stats', getSearchStats);

module.exports = router;
