/**
 * Utilitários para validação no frontend
 */

/**
 * Valida email
 */
export const validateEmail = (email) => {
  if (!email?.trim()) return 'Email é obrigatório';
  if (!email.includes('@')) return 'Email inválido';
  return null;
};

/**
 * Valida senha
 */
export const validatePassword = (password, minLength = 6) => {
  if (!password?.trim()) return 'Senha é obrigatória';
  if (password.length < minLength) return `Senha deve ter pelo menos ${minLength} caracteres`;
  return null;
};

/**
 * Valida campo obrigatório
 */
export const validateRequired = (value, fieldName) => {
  if (!value?.trim()) return `${fieldName} é obrigatório`;
  return null;
};

/**
 * Valida confirmação de senha
 */
export const validatePasswordConfirmation = (password, confirmPassword) => {
  if (password !== confirmPassword) return 'Senhas não coincidem';
  return null;
};

/**
 * Executa validações e retorna o primeiro erro
 */
export const runValidations = (...validations) => {
  for (const validation of validations) {
    if (validation) return validation;
  }
  return null;
};
