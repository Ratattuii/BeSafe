const mysql = require('mysql2/promise');

// Configurações do banco de dados
const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'besafe_user',
  password: 'besafe_db',
  database: 'besafe_db'
};

/**
 * Cria uma conexão com o banco
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
 * Testa a conexão com o banco de dados
 */
async function testConnection() {
  try {
    const connection = await createConnection();
    console.log('Conectado ao MySQL com sucesso');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com MySQL:', error.message);
    return false;
  }
}

module.exports = {
  dbConfig,
  createConnection,
  query,
  queryOne,
  testConnection
};