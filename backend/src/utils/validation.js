const Joi = require('joi');

// Schemas de validação Joi
const schemas = {
  // Registro de usuário
  register: Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
      'string.min': 'Nome deve ter pelo menos 2 caracteres',
      'string.max': 'Nome deve ter no máximo 255 caracteres',
      'any.required': 'Nome é obrigatório'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter formato válido',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().min(6).max(100).required().messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.max': 'Senha deve ter no máximo 100 caracteres',
      'any.required': 'Senha é obrigatória'
    }),
    role: Joi.string().valid('donor', 'institution').required().messages({
      'any.only': 'Role deve ser "donor" ou "institution"',
      'any.required': 'Role é obrigatório'
    })
  }),

  // Login
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email deve ter formato válido',
      'any.required': 'Email é obrigatório'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Senha é obrigatória'
    })
  }),

  // Login Firebase
  firebaseLogin: Joi.object({
    firebaseToken: Joi.string().required().messages({
      'any.required': 'Token Firebase é obrigatório'
    }),
    role: Joi.string().valid('donor', 'institution').default('donor')
  }),

  // Criação de necessidade
  need: Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
      'string.min': 'Título deve ter pelo menos 3 caracteres',
      'string.max': 'Título deve ter no máximo 255 caracteres',
      'any.required': 'Título é obrigatório'
    }),
    description: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Descrição deve ter pelo menos 10 caracteres',
      'string.max': 'Descrição deve ter no máximo 2000 caracteres',
      'any.required': 'Descrição é obrigatória'
    }),
    urgency: Joi.string().valid('baixa', 'media', 'alta', 'critica').required().messages({
      'any.only': 'Urgência deve ser: baixa, media, alta ou critica',
      'any.required': 'Urgência é obrigatória'
    }),
    type: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Tipo deve ter pelo menos 2 caracteres',
      'string.max': 'Tipo deve ter no máximo 100 caracteres',
      'any.required': 'Tipo é obrigatório'
    }),
    quantity: Joi.number().positive().required().messages({
      'number.positive': 'Quantidade deve ser positiva',
      'any.required': 'Quantidade é obrigatória'
    }),
    unit: Joi.string().max(50).optional(),
    location: Joi.string().max(255).optional(),
    goal_quantity: Joi.number().positive().optional()
  }),

  // Criação de doação
  donation: Joi.object({
    need_id: Joi.number().integer().positive().required().messages({
      'number.positive': 'ID da necessidade deve ser positivo',
      'any.required': 'ID da necessidade é obrigatório'
    }),
    quantity: Joi.number().positive().required().messages({
      'number.positive': 'Quantidade deve ser positiva',
      'any.required': 'Quantidade é obrigatória'
    }),
    unit: Joi.string().max(50).optional(),
    message: Joi.string().max(1000).optional()
  }),

  // Avaliação
  review: Joi.object({
    donation_id: Joi.number().integer().positive().required().messages({
      'number.positive': 'ID da doação deve ser positivo',
      'any.required': 'ID da doação é obrigatório'
    }),
    reviewed_id: Joi.number().integer().positive().required().messages({
      'number.positive': 'ID do usuário avaliado deve ser positivo',
      'any.required': 'ID do usuário avaliado é obrigatório'
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.min': 'Avaliação deve ser entre 1 e 5',
      'number.max': 'Avaliação deve ser entre 1 e 5',
      'any.required': 'Avaliação é obrigatória'
    }),
    comment: Joi.string().max(1000).optional(),
    review_type: Joi.string().valid('donor_to_institution', 'institution_to_donor', 'delivery_quality').required().messages({
      'any.only': 'Tipo de avaliação inválido',
      'any.required': 'Tipo de avaliação é obrigatório'
    })
  }),

  // Zona de risco/abrigo
  zone: Joi.object({
    latitude: Joi.number().min(-90).max(90).required().messages({
      'number.min': 'Latitude deve estar entre -90 e 90',
      'number.max': 'Latitude deve estar entre -90 e 90',
      'any.required': 'Latitude é obrigatória'
    }),
    longitude: Joi.number().min(-180).max(180).required().messages({
      'number.min': 'Longitude deve estar entre -180 e 180',
      'number.max': 'Longitude deve estar entre -180 e 180',
      'any.required': 'Longitude é obrigatória'
    }),
    radius: Joi.number().integer().min(10).max(10000).required().messages({
      'number.min': 'Raio deve estar entre 10 e 10000 metros',
      'number.max': 'Raio deve estar entre 10 e 10000 metros',
      'any.required': 'Raio é obrigatório'
    }),
    type: Joi.string().valid('risco', 'abrigo').required().messages({
      'any.only': 'Tipo deve ser "risco" ou "abrigo"',
      'any.required': 'Tipo é obrigatório'
    }),
    description: Joi.string().max(1000).optional(),
    severity: Joi.string().valid('baixa', 'media', 'alta', 'critica').default('media')
  }),

  // Alerta de desastre
  disasterAlert: Joi.object({
    title: Joi.string().min(3).max(255).required().messages({
      'string.min': 'Título deve ter pelo menos 3 caracteres',
      'string.max': 'Título deve ter no máximo 255 caracteres',
      'any.required': 'Título é obrigatório'
    }),
    message: Joi.string().min(10).max(2000).required().messages({
      'string.min': 'Mensagem deve ter pelo menos 10 caracteres',
      'string.max': 'Mensagem deve ter no máximo 2000 caracteres',
      'any.required': 'Mensagem é obrigatória'
    }),
    severity: Joi.string().valid('info', 'warning', 'critical').default('info')
  })
};

/**
 * Middleware genérico para validação de requisições
 * @param {string} schemaName - Nome do schema a ser usado
 */
function validateRequest(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Schema de validação não encontrado'
      });
    }

    const { error, value } = schema.validate(req.body, { 
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true // Remove campos não definidos no schema
    });

    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errorMessages
      });
    }

    // Substitui req.body pelos dados validados
    req.body = value;
    next();
  };
}

// Funções de validação existentes (mantidas para compatibilidade)
function validateRequired(fields, data) {
  for (const field of fields) {
    if (!data[field]) {
      return `Campo ${field} é obrigatório`;
    }
  }
  return null;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email inválido';
  }
  return null;
}

function validatePassword(password) {
  if (password.length < 6) {
    return 'Senha deve ter pelo menos 6 caracteres';
  }
  return null;
}

function validateUserRole(role) {
  if (!['donor', 'institution', 'admin'].includes(role)) {
    return 'Role inválido';
  }
  return null;
}

function runValidations(...validations) {
  for (const validation of validations) {
    if (validation) {
      return validation;
    }
  }
  return null;
}

module.exports = {
  schemas,
  validateRequest,
  validateRequired,
  validateEmail,
  validatePassword,
  validateUserRole,
  runValidations
};