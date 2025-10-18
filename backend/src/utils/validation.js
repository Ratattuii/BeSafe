/**
 * Utilitários para validação de dados
 */

/**
 * Valida campos obrigatórios
 */
const validateRequired = (fields, data) => {
  const missing = fields.filter(field => !data[field] || !data[field].toString().trim());
  if (missing.length > 0) {
    return `Campos obrigatórios: ${missing.join(', ')}`;
  }
  return null;
};

/**
 * Valida formato de email
 */
const validateEmail = (email) => {
  if (!email || !email.includes('@')) {
    return 'Email inválido';
  }
  return null;
};

/**
 * Valida senha mínima
 */
const validatePassword = (password, minLength = 6) => {
  if (!password || password.length < minLength) {
    return `Senha deve ter pelo menos ${minLength} caracteres`;
  }
  return null;
};

/**
 * Valida se é um tipo de usuário válido
 */
const validateUserRole = (role) => {
  if (!['donor', 'institution'].includes(role)) {
    return 'Tipo de usuário inválido';
  }
  return null;
};

/**
 * Executa múltiplas validações e retorna o primeiro erro
 */
const runValidations = (...validations) => {
  for (const validation of validations) {
    if (validation) return validation;
  }
  return null;
};

module.exports = {
  validateRequired,
  validateEmail,
  validatePassword,
  validateUserRole,
  runValidations
};
