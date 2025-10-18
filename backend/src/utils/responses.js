/**
 * Utilitários para respostas HTTP padronizadas
 */

/**
 * Resposta de sucesso padronizada
 */
const success = (res, message, data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    ...(data && { data })
  });
};

/**
 * Resposta de erro padronizada
 */
const error = (res, message, status = 400) => {
  return res.status(status).json({
    success: false,
    message
  });
};

/**
 * Respostas de erro comuns
 */
const errors = {
  badRequest: (res, message = 'Dados inválidos') => error(res, message, 400),
  unauthorized: (res, message = 'Não autorizado') => error(res, message, 401),
  forbidden: (res, message = 'Acesso negado') => error(res, message, 403),
  notFound: (res, message = 'Não encontrado') => error(res, message, 404),
  conflict: (res, message = 'Conflito') => error(res, message, 409),
  serverError: (res, message = 'Erro interno do servidor') => error(res, message, 500)
};

module.exports = {
  success,
  error,
  errors
};
