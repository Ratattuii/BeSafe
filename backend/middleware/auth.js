// ==============================================
// MIDDLEWARE DE AUTENTICAÇÃO - BESAFE
// ==============================================

const jwt = require('jsonwebtoken')
const { query } = require('../config/database')

const JWT_SECRET = process.env.JWT_SECRET || 'besafe_secret_key_2024'
const JWT_EXPIRES_IN = '24h'

// ==============================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ==============================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        return res.status(401).json({ 
            erro: 'Token de acesso requerido',
            codigo: 'TOKEN_REQUIRED'
        })
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                erro: 'Token inválido ou expirado',
                codigo: 'TOKEN_INVALID'
            })
        }
        req.user = user
        next()
    })
}

// ==============================================
// MIDDLEWARE DE AUTORIZAÇÃO
// ==============================================

// Verificar se usuário é proprietário do recurso
const checkOwnership = (req, res, next) => {
    const resourceId = parseInt(req.params.id)
    const userId = req.user.id

    if (resourceId !== userId && req.user.tipo !== 'admin') {
        return res.status(403).json({ 
            erro: 'Acesso negado - você não tem permissão para este recurso',
            codigo: 'ACCESS_DENIED'
        })
    }
    next()
}

// Verificar se usuário é admin
const requireAdmin = (req, res, next) => {
    if (req.user.tipo !== 'admin') {
        return res.status(403).json({ 
            erro: 'Acesso negado - apenas administradores',
            codigo: 'ADMIN_REQUIRED'
        })
    }
    next()
}

// Verificar se usuário é instituição
const requireInstitution = (req, res, next) => {
    if (req.user.tipo !== 'instituicao' && req.user.tipo !== 'admin') {
        return res.status(403).json({ 
            erro: 'Acesso negado - apenas instituições',
            codigo: 'INSTITUTION_REQUIRED'
        })
    }
    next()
}

// Verificar se usuário é doador
const requireDonor = (req, res, next) => {
    if (req.user.tipo !== 'doador' && req.user.tipo !== 'admin') {
        return res.status(403).json({ 
            erro: 'Acesso negado - apenas doadores',
            codigo: 'DONOR_REQUIRED'
        })
    }
    next()
}

// ==============================================
// MIDDLEWARE OPCIONAL DE AUTENTICAÇÃO
// ==============================================

// Autenticação opcional (não falha se não tiver token)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
        req.user = null
        return next()
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            req.user = null
        } else {
            req.user = user
        }
        next()
    })
}

// ==============================================
// FUNÇÕES UTILITÁRIAS
// ==============================================

// Gerar token JWT
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            tipo: user.tipo,
            nome: user.nome
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    )
}

// Verificar se token é válido
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET)
    } catch (error) {
        return null
    }
}

// Middleware para verificar se usuário ainda existe no banco
const checkUserExists = async (req, res, next) => {
    try {
        const users = await query(
            'SELECT id, nome, email, tipo, ativo FROM usuarios WHERE id = ?',
            [req.user.id]
        )

        if (users.length === 0) {
            return res.status(404).json({
                erro: 'Usuário não encontrado',
                codigo: 'USER_NOT_FOUND'
            })
        }

        const user = users[0]
        
        if (!user.ativo) {
            return res.status(403).json({
                erro: 'Usuário desativado',
                codigo: 'USER_DEACTIVATED'
            })
        }

        // Atualizar dados do usuário na requisição
        req.user = { ...req.user, ...user }
        next()
        
    } catch (error) {
        console.error('Erro ao verificar usuário:', error)
        return res.status(500).json({
            erro: 'Erro interno do servidor',
            codigo: 'INTERNAL_ERROR'
        })
    }
}

module.exports = {
    authenticateToken,
    optionalAuth,
    checkOwnership,
    requireAdmin,
    requireInstitution,
    requireDonor,
    checkUserExists,
    generateToken,
    verifyToken,
    JWT_SECRET
} 