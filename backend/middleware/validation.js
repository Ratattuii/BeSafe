// ==============================================
// MIDDLEWARE DE VALIDAÇÃO - BESAFE
// ==============================================

const { body, param, query, validationResult } = require('express-validator')

// ==============================================
// MIDDLEWARE PARA TRATAR ERROS DE VALIDAÇÃO
// ==============================================

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req)
    
    if (!errors.isEmpty()) {
        const formattedErrors = errors.array().map(error => ({
            campo: error.path,
            valor: error.value,
            mensagem: error.msg
        }))
        
        return res.status(400).json({
            erro: 'Dados inválidos',
            codigo: 'VALIDATION_ERROR',
            detalhes: formattedErrors
        })
    }
    
    next()
}

// ==============================================
// VALIDAÇÕES DE AUTENTICAÇÃO
// ==============================================

const validateLogin = [
    body('email')
        .isEmail()
        .withMessage('Email deve ser um endereço válido')
        .normalizeEmail(),
    body('senha')
        .isLength({ min: 6 })
        .withMessage('Senha deve ter pelo menos 6 caracteres'),
    handleValidationErrors
]

const validateRegister = [
    body('nome')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres')
        .matches(/^[a-zA-ZÀ-ÿ\s]+$/)
        .withMessage('Nome deve conter apenas letras e espaços'),
    body('email')
        .isEmail()
        .withMessage('Email deve ser um endereço válido')
        .normalizeEmail(),
    body('senha')
        .isLength({ min: 6, max: 100 })
        .withMessage('Senha deve ter entre 6 e 100 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'),
    body('tipo')
        .isIn(['doador', 'instituicao'])
        .withMessage('Tipo deve ser "doador" ou "instituicao"'),
    body('telefone')
        .optional()
        .isMobilePhone('pt-BR')
        .withMessage('Telefone deve ser um número válido'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio deve ter no máximo 500 caracteres'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE USUÁRIO
// ==============================================

const validateUpdateUser = [
    body('nome')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('telefone')
        .optional()
        .isMobilePhone('pt-BR')
        .withMessage('Telefone deve ser um número válido'),
    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio deve ter no máximo 500 caracteres'),
    body('endereco')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Endereço deve ter no máximo 200 caracteres'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE INSTITUIÇÃO
// ==============================================

const validateCreateInstitution = [
    body('nome')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Nome da instituição deve ter entre 3 e 100 caracteres'),
    body('descricao')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Descrição deve ter entre 10 e 1000 caracteres'),
    body('cnpj')
        .optional()
        .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
        .withMessage('CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'),
    body('endereco')
        .trim()
        .isLength({ min: 10, max: 200 })
        .withMessage('Endereço deve ter entre 10 e 200 caracteres'),
    body('telefone')
        .isMobilePhone('pt-BR')
        .withMessage('Telefone deve ser um número válido'),
    body('categoria')
        .isIn(['ong', 'abrigo', 'hospital', 'escola', 'outro'])
        .withMessage('Categoria deve ser válida'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE DOAÇÃO
// ==============================================

const validateCreateDonation = [
    body('item')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Item deve ter entre 3 e 100 caracteres'),
    body('categoria')
        .isIn(['alimentos', 'roupas', 'medicamentos', 'materiais', 'brinquedos', 'outros'])
        .withMessage('Categoria deve ser válida'),
    body('quantidade')
        .isInt({ min: 1 })
        .withMessage('Quantidade deve ser um número positivo'),
    body('descricao')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Descrição deve ter no máximo 500 caracteres'),
    body('condicao')
        .isIn(['novo', 'usado_bom', 'usado_regular'])
        .withMessage('Condição deve ser válida'),
    body('data_validade')
        .optional()
        .isISO8601()
        .withMessage('Data de validade deve ser uma data válida'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE NECESSIDADE
// ==============================================

const validateCreateNeed = [
    body('item')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Item deve ter entre 3 e 100 caracteres'),
    body('categoria')
        .isIn(['alimentos', 'roupas', 'medicamentos', 'materiais', 'brinquedos', 'outros'])
        .withMessage('Categoria deve ser válida'),
    body('quantidade')
        .isInt({ min: 1 })
        .withMessage('Quantidade deve ser um número positivo'),
    body('descricao')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Descrição deve ter entre 10 e 500 caracteres'),
    body('urgencia')
        .isIn(['baixa', 'media', 'alta', 'urgente'])
        .withMessage('Urgência deve ser válida'),
    body('data_limite')
        .optional()
        .isISO8601()
        .withMessage('Data limite deve ser uma data válida'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE MENSAGEM
// ==============================================

const validateSendMessage = [
    body('destinatario_id')
        .isInt({ min: 1 })
        .withMessage('ID do destinatário deve ser um número válido'),
    body('conteudo')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Mensagem deve ter entre 1 e 1000 caracteres'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE PARÂMETROS
// ==============================================

const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID deve ser um número positivo'),
    handleValidationErrors
]

const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Página deve ser um número positivo'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limite deve ser entre 1 e 100'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE BUSCA
// ==============================================

const validateSearch = [
    query('q')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Termo de busca deve ter entre 1 e 100 caracteres'),
    query('categoria')
        .optional()
        .isIn(['alimentos', 'roupas', 'medicamentos', 'materiais', 'brinquedos', 'outros'])
        .withMessage('Categoria deve ser válida'),
    query('urgencia')
        .optional()
        .isIn(['baixa', 'media', 'alta', 'urgente'])
        .withMessage('Urgência deve ser válida'),
    handleValidationErrors
]

// ==============================================
// VALIDAÇÕES DE AVALIAÇÃO
// ==============================================

const validateCreateRating = [
    body('avaliado_id')
        .isInt({ min: 1 })
        .withMessage('ID do usuário avaliado deve ser válido'),
    body('estrelas')
        .isInt({ min: 1, max: 5 })
        .withMessage('Avaliação deve ser entre 1 e 5 estrelas'),
    body('comentario')
        .optional()
        .trim()
        .isLength({ max: 300 })
        .withMessage('Comentário deve ter no máximo 300 caracteres'),
    handleValidationErrors
]

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validateUpdateUser,
    validateCreateInstitution,
    validateCreateDonation,
    validateCreateNeed,
    validateSendMessage,
    validateId,
    validatePagination,
    validateSearch,
    validateCreateRating
} 