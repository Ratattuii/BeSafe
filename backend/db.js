const mysql = require('mysql2/promise'); // Importa o mysql2 com suporte a Promises

// Configurações do banco de dados
const dbConfig = {
  host: 'localhost', // Ou o IP/endereço do seu servidor MySQL
  user: 'besafe',      // Seu usuário do MySQL
  password: 'besafe',  // Sua senha do MySQL
  database: 'besafe' // Nome do banco de dados
};

// Função para criar conexão
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Conectado ao MySQL com sucesso!');
    return connection;
  } catch (error) {
    console.error('Erro ao conectar ao MySQL:', error.message);
    console.log('Verifique se o MySQL está rodando e as credenciais estão corretas');
    process.exit(1);
  }
}

// Função para executar queries
async function query(sql, params = []) {
  const connection = await createConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

module.exports = { createConnection, query }; // Exporta as funções de conexão 