// ==============================================
// CONFIGURAÇÃO DO BANCO DE DADOS - BESAFE
// ==============================================

const mysql = require('mysql2/promise')

// Configurações do banco
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'besafe_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
}

// Pool de conexões
const pool = mysql.createPool(dbConfig)

// Função para testar conexão
const testConnection = async () => {
    try {
        const connection = await pool.getConnection()
        console.log('✅ Conectado ao banco de dados MySQL')
        await connection.ping()
        connection.release()
        return true
    } catch (error) {
        console.error('❌ Erro ao conectar com banco de dados:', error.message)
        return false
    }
}

// Função helper para queries
const query = async (sql, params = []) => {
    try {
        const [rows] = await pool.execute(sql, params)
        return rows
    } catch (error) {
        console.error('❌ Erro na query:', error.message)
        throw error
    }
}

// Função para transações
const transaction = async (callback) => {
    const connection = await pool.getConnection()
    
    try {
        await connection.beginTransaction()
        const result = await callback(connection)
        await connection.commit()
        return result
    } catch (error) {
        await connection.rollback()
        throw error
    } finally {
        connection.release()
    }
}

// Fechar pool de conexões (para testes)
const closePool = async () => {
    await pool.end()
}

module.exports = {
    pool,
    query,
    transaction,
    testConnection,
    closePool
} 