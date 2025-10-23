// Configuração global do Jest para testes do BeSafe
const path = require('path');

module.exports = {
  // Diretório raiz dos testes
  rootDir: path.resolve(__dirname, '..'),
  
  // Padrões de arquivos de teste
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],
  
  // Diretórios a serem ignorados
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/uploads/'
  ],
  
  // Configuração do ambiente de teste
  testEnvironment: 'node',
  
  // Setup antes de todos os testes
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Timeout para testes (30 segundos)
  testTimeout: 30000,
  
  // Configuração de cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Arquivo principal não precisa de cobertura
    '!src/database/db.js', // Arquivo de conexão não precisa de cobertura
    '!**/node_modules/**'
  ],
  
  // Diretórios de cobertura
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Limite mínimo de cobertura (opcional)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Configuração de módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Configuração de transformação
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Configuração de verbose
  verbose: true,
  
  // Configuração de clearMocks
  clearMocks: true,
  
  // Configuração de restoreMocks
  restoreMocks: true
};
