require('dotenv').config();
const mysql = require('mysql2/promise');

// Configurações do banco de dados (lê do .env)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'besafe_user',
  password: process.env.DB_PASSWORD || 'besafe_db',
  database: process.env.DB_NAME || 'besafe_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Cria o pool de conexões uma única vez
const pool = mysql.createPool(dbConfig);

/**
 * Cria uma conexão com o banco (para casos especiais)
 */
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    return connection;
  } catch (error) {
    console.error('Erro ao conectar com MySQL:', error.message);
    throw error;
  }
}

/**
 * Executa uma query SQL usando o pool de conexões
 */
async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params); // <--- CORRIGIDO
    return rows;
  } catch (error) {
    console.error('Erro ao executar query:', error.message);
    throw error;
  }
}

/**
 * Executa uma query SQL e retorna apenas o primeiro resultado
 */
async function queryOne(sql, params = []) {
  // Esta função não precisa mudar, pois ela usa a função 'query' corrigida.
  const rows = await query(sql, params);
  return rows[0] || null;
}

/**
 * Testa a conexão com o banco de dados usando o pool
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conectado ao MySQL com sucesso (via pool)');
    connection.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com MySQL:', error.message);
    return false;
  }
}

/**
 * Fecha o pool de conexões
 */
async function closePool() {
  try {
    await pool.end();
    console.log('Pool de conexões MySQL fechado');
  } catch (error) {
    console.error('Erro ao fechar pool de conexões:', error.message);
  }
}

module.exports = {
  dbConfig,
  pool,
  createConnection,
  query,
  queryOne,
  testConnection,
  closePool
};