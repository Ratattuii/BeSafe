const express = require('express'); // Importa o Express
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { createConnection, query } = require('./db'); // Importa as funções de conexão do MySQL

const app = express(); // Cria uma instância do aplicativo Express
const PORT = process.env.PORT || 3001; // Define a porta do servidor, usando 3001 como padrão

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'besafe-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

// Middleware para parsear JSON no corpo das requisições
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de boas-vindas
app.get('/', (req, res) => {
    res.send('🏥 Bem-vindo à API do BeSafe - Sistema de Doações!');
});

// ===========================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ===========================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ erro: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ erro: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Middleware para verificar se o usuário é o proprietário do recurso
const checkOwnership = (req, res, next) => {
    const resourceId = parseInt(req.params.id);
    const userId = req.user.id;

    if (resourceId !== userId && req.user.tipo !== 'admin') {
        return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
};

// Middleware para tratar erros de validação
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ erro: 'Dados inválidos', detalhes: errors.array() });
    }
    next();
};

// ===========================================
// ROTAS DE AUTENTICAÇÃO 🔐
// ===========================================

// Login do usuário
app.post('/api/login', [
    body('email').isEmail().withMessage('Email deve ser válido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        // Buscar usuário no banco de dados MySQL
        const usuarios = await query(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (usuarios.length === 0) {
            return res.status(400).json({ erro: 'Email ou senha incorretos' });
        }

        const usuario = usuarios[0];

        // Verificar senha
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (!senhaValida) {
            return res.status(400).json({ erro: 'Email ou senha incorretos' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                email: usuario.email, 
                tipo: usuario.tipo 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Remover senha da resposta
        const { senha: _, ...usuarioSeguro } = usuario;

        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario: usuarioSeguro
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Cadastro de usuário
app.post('/api/register', [
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('email').isEmail().withMessage('Email deve ser válido'),
    body('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
    body('tipo').isIn(['doador', 'instituicao']).withMessage('Tipo deve ser doador ou instituicao'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { nome, email, senha, tipo, telefone } = req.body;
        
        // Verificar se email já existe no banco de dados
        const usuariosExistentes = await query(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );
        
        if (usuariosExistentes.length > 0) {
            return res.status(400).json({ erro: 'Email já cadastrado' });
        }

        // Hash da senha
        const senhaHash = await bcrypt.hash(senha, 12);

        // Inserir novo usuário no banco de dados
        const result = await query(
            'INSERT INTO usuarios (nome, email, senha, tipo, telefone) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senhaHash, tipo, telefone || null]
        );

        const novoUsuario = {
            id: result.insertId,
            nome,
            email,
            tipo,
            telefone: telefone || null
        };

        // Gerar token JWT
        const token = jwt.sign(
            { 
                id: novoUsuario.id, 
                email: novoUsuario.email, 
                tipo: novoUsuario.tipo 
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            mensagem: 'Usuário cadastrado com sucesso',
            token,
            usuario: novoUsuario
        });

    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Logout (invalidar token - em produção seria feito com blacklist)
app.post('/api/logout', authenticateToken, (req, res) => {
    // Em produção, você adicionaria o token a uma blacklist
    res.json({ mensagem: 'Logout realizado com sucesso' });
});

// Verificar token (rota para validar se o token ainda é válido)
app.get('/api/verify', authenticateToken, async (req, res) => {
    try {
        const usuarios = await query(
            'SELECT id, nome, email, tipo, telefone, created_at, updated_at FROM usuarios WHERE id = ?',
            [req.user.id]
        );
        
        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        res.json({ usuario: usuarios[0] });
    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// ROTAS DE USUÁRIOS 👥
// ===========================================

// Buscar perfil do usuário
app.get('/api/usuarios/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        
        // Verificar se o usuário pode acessar este perfil
        if (req.user.id !== userId && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        const usuarios = await query(
            'SELECT id, nome, email, tipo, telefone, created_at, updated_at FROM usuarios WHERE id = ?',
            [userId]
        );
        
        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        res.json(usuarios[0]);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Editar perfil
app.put('/api/usuarios/:id', [
    authenticateToken,
    body('nome').optional().notEmpty().withMessage('Nome não pode estar vazio'),
    body('email').optional().isEmail().withMessage('Email deve ser válido'),
    body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone deve ser válido'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        
        // Verificar se o usuário pode editar este perfil
        if (req.user.id !== userId && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        // Verificar se o usuário existe
        const usuarios = await query(
            'SELECT id, email FROM usuarios WHERE id = ?',
            [userId]
        );
        
        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        const { nome, email, telefone, senha } = req.body;
        
        // Verificar se o email já está em uso por outro usuário
        if (email && email !== usuarios[0].email) {
            const emailExistente = await query(
                'SELECT id FROM usuarios WHERE email = ? AND id != ?',
                [email, userId]
            );
            
            if (emailExistente.length > 0) {
                return res.status(400).json({ erro: 'Email já cadastrado' });
            }
        }
        
        // Construir query de atualização dinamicamente
        const camposUpdate = [];
        const valoresUpdate = [];
        
        if (nome) {
            camposUpdate.push('nome = ?');
            valoresUpdate.push(nome);
        }
        if (email) {
            camposUpdate.push('email = ?');
            valoresUpdate.push(email);
        }
        if (telefone) {
            camposUpdate.push('telefone = ?');
            valoresUpdate.push(telefone);
        }
        if (senha) {
            const senhaHash = await bcrypt.hash(senha, 12);
            camposUpdate.push('senha = ?');
            valoresUpdate.push(senhaHash);
        }
        
        if (camposUpdate.length > 0) {
            camposUpdate.push('updated_at = CURRENT_TIMESTAMP');
            valoresUpdate.push(userId);
            
            await query(
                `UPDATE usuarios SET ${camposUpdate.join(', ')} WHERE id = ?`,
                valoresUpdate
            );
        }
        
        // Buscar usuário atualizado
        const usuarioAtualizado = await query(
            'SELECT id, nome, email, tipo, telefone, created_at, updated_at FROM usuarios WHERE id = ?',
            [userId]
        );
        
        res.json({
            mensagem: 'Perfil atualizado com sucesso',
            usuario: usuarioAtualizado[0]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Excluir conta
app.delete('/api/usuarios/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);
        
        // Verificar se o usuário pode excluir esta conta
        if (req.user.id !== userId && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        // Verificar se o usuário existe
        const usuarios = await query(
            'SELECT id FROM usuarios WHERE id = ?',
            [userId]
        );
        
        if (usuarios.length === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }
        
        // Excluir usuário (o MySQL cuidará das exclusões em cascata devido às foreign keys)
        await query('DELETE FROM usuarios WHERE id = ?', [userId]);
        
        res.json({ mensagem: 'Conta excluída com sucesso' });
        
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// ROTAS DE INSTITUIÇÕES 🏢
// ===========================================

// Listar todas as instituições
app.get('/api/instituicoes', async (req, res) => {
    try {
        const { categoria, nome, limite = 10, pagina = 1 } = req.query;
        
        // Construir query SQL com filtros
        let whereClause = '';
        let queryParams = [];
        
        if (categoria || nome) {
            const conditions = [];
            if (categoria) {
                conditions.push('categoria LIKE ?');
                queryParams.push(`%${categoria}%`);
            }
            if (nome) {
                conditions.push('nome LIKE ?');
                queryParams.push(`%${nome}%`);
            }
            whereClause = 'WHERE ' + conditions.join(' AND ');
        }
        
        // Contar total de itens
        const countResult = await query(
            `SELECT COUNT(*) as total FROM instituicoes ${whereClause}`,
            queryParams
        );
        const totalItens = countResult[0].total;
        const totalPaginas = Math.ceil(totalItens / limite);
        
        // Buscar instituições com paginação
        const offset = (pagina - 1) * limite;
        const instituicoes = await query(
            `SELECT * FROM instituicoes ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limite), offset]
        );
        
        res.json({
            instituicoes,
            paginacao: {
                paginaAtual: parseInt(pagina),
                totalPaginas,
                totalItens,
                itemsPorPagina: parseInt(limite)
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar instituições:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Detalhes da instituição
app.get('/api/instituicoes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const instituicaoId = parseInt(id);
        
        // Buscar instituição
        const instituicoes = await query(
            'SELECT * FROM instituicoes WHERE id = ?',
            [instituicaoId]
        );
        
        if (instituicoes.length === 0) {
            return res.status(404).json({ erro: 'Instituição não encontrada' });
        }
        
        // Buscar necessidades ativas da instituição
        const necessidades = await query(
            'SELECT * FROM necessidades WHERE instituicao_id = ? AND status = ?',
            [instituicaoId, 'ativa']
        );
        
        res.json({
            ...instituicoes[0],
            necessidades
        });
        
    } catch (error) {
        console.error('Erro ao buscar instituição:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Cadastrar instituição
app.post('/api/instituicoes', [
    authenticateToken,
    body('nome').notEmpty().withMessage('Nome é obrigatório'),
    body('categoria').notEmpty().withMessage('Categoria é obrigatória'),
    body('endereco').notEmpty().withMessage('Endereço é obrigatório'),
    body('telefone').isMobilePhone('pt-BR').withMessage('Telefone deve ser válido'),
    body('email').isEmail().withMessage('Email deve ser válido'),
    handleValidationErrors
], (req, res) => {
    try {
        const { nome, categoria, endereco, telefone, email } = req.body;
        
        // Verificar se só instituições podem cadastrar
        if (req.user.tipo !== 'instituicao') {
            return res.status(403).json({ erro: 'Apenas instituições podem criar este recurso' });
        }
        
        // Verificar se o usuário já tem uma instituição
        const instituicaoExistente = database.instituicoes.find(i => i.userId === req.user.id);
        if (instituicaoExistente) {
            return res.status(400).json({ erro: 'Usuário já possui uma instituição cadastrada' });
        }
        
        const novaInstituicao = {
            id: generateId('instituicoes'),
            nome,
            categoria,
            endereco,
            telefone,
            email,
            userId: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        database.instituicoes.push(novaInstituicao);
        
        res.status(201).json({
            mensagem: 'Instituição cadastrada com sucesso',
            instituicao: novaInstituicao
        });
        
    } catch (error) {
        console.error('Erro ao cadastrar instituição:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Editar dados da instituição
app.put('/api/instituicoes/:id', [
    authenticateToken,
    body('nome').optional().notEmpty().withMessage('Nome não pode estar vazio'),
    body('categoria').optional().notEmpty().withMessage('Categoria não pode estar vazia'),
    body('endereco').optional().notEmpty().withMessage('Endereço não pode estar vazio'),
    body('telefone').optional().isMobilePhone('pt-BR').withMessage('Telefone deve ser válido'),
    body('email').optional().isEmail().withMessage('Email deve ser válido'),
    handleValidationErrors
], (req, res) => {
    try {
        const { id } = req.params;
        const instituicaoId = parseInt(id);
        
        const instituicaoIndex = database.instituicoes.findIndex(i => i.id === instituicaoId);
        
        if (instituicaoIndex === -1) {
            return res.status(404).json({ erro: 'Instituição não encontrada' });
        }
        
        const instituicao = database.instituicoes[instituicaoIndex];
        
        // Verificar se o usuário pode editar esta instituição
        if (instituicao.userId !== req.user.id && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        const dadosAtualizados = { ...req.body, updatedAt: new Date() };
        
        database.instituicoes[instituicaoIndex] = { ...instituicao, ...dadosAtualizados };
        
        res.json({
            mensagem: 'Instituição atualizada com sucesso',
            instituicao: database.instituicoes[instituicaoIndex]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar instituição:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Excluir instituição
app.delete('/api/instituicoes/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const instituicaoId = parseInt(id);
        
        const instituicaoIndex = database.instituicoes.findIndex(i => i.id === instituicaoId);
        
        if (instituicaoIndex === -1) {
            return res.status(404).json({ erro: 'Instituição não encontrada' });
        }
        
        const instituicao = database.instituicoes[instituicaoIndex];
        
        // Verificar se o usuário pode excluir esta instituição
        if (instituicao.userId !== req.user.id && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        // Remover instituição
        database.instituicoes.splice(instituicaoIndex, 1);
        
        // Remover dados relacionados
        database.necessidades = database.necessidades.filter(n => n.instituicaoId !== instituicaoId);
        database.doacoes = database.doacoes.filter(d => d.instituicaoId !== instituicaoId);
        
        res.json({ mensagem: 'Instituição excluída com sucesso' });
        
    } catch (error) {
        console.error('Erro ao excluir instituição:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// ROTAS DE NECESSIDADES 📦
// ===========================================

// Listar todas as necessidades
app.get('/api/necessidades', (req, res) => {
    try {
        const { categoria, prioridade, status = 'ativa', limite = 10, pagina = 1 } = req.query;
        
        let necessidades = database.necessidades.map(n => {
            const instituicao = database.instituicoes.find(i => i.id === n.instituicaoId);
            return {
                ...n,
                instituicao: instituicao ? instituicao.nome : 'Instituição não encontrada'
            };
        });
        
        // Filtros
        if (categoria) {
            necessidades = necessidades.filter(n => {
                const instituicao = database.instituicoes.find(i => i.id === n.instituicaoId);
                return instituicao && instituicao.categoria.toLowerCase().includes(categoria.toLowerCase());
            });
        }
        
        if (prioridade) {
            necessidades = necessidades.filter(n => n.prioridade === prioridade);
        }
        
        if (status) {
            necessidades = necessidades.filter(n => n.status === status);
        }
        
        // Paginação
        const totalItens = necessidades.length;
        const totalPaginas = Math.ceil(totalItens / limite);
        const inicio = (pagina - 1) * limite;
        const fim = inicio + parseInt(limite);
        
        necessidades = necessidades.slice(inicio, fim);
        
        res.json({
            necessidades,
            paginacao: {
                paginaAtual: parseInt(pagina),
                totalPaginas,
                totalItens,
                itemsPorPagina: parseInt(limite)
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar necessidades:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Criar necessidade
app.post('/api/necessidades', [
    authenticateToken,
    body('titulo').notEmpty().withMessage('Título é obrigatório'),
    body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
    body('prioridade').isIn(['baixa', 'media', 'alta']).withMessage('Prioridade deve ser baixa, media ou alta'),
    handleValidationErrors
], (req, res) => {
    try {
        const { titulo, descricao, prioridade } = req.body;
        
        // Verificar se o usuário é uma instituição
        if (req.user.tipo !== 'instituicao') {
            return res.status(403).json({ erro: 'Apenas instituições podem criar necessidades' });
        }
        
        // Buscar a instituição do usuário
        const instituicao = database.instituicoes.find(i => i.userId === req.user.id);
        if (!instituicao) {
            return res.status(400).json({ erro: 'Usuário não possui uma instituição cadastrada' });
        }
        
        const novaNecessidade = {
            id: generateId('necessidades'),
            titulo,
            descricao,
            prioridade,
            status: 'ativa',
            instituicaoId: instituicao.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        database.necessidades.push(novaNecessidade);
        
        res.status(201).json({
            mensagem: 'Necessidade criada com sucesso',
            necessidade: {
                ...novaNecessidade,
                instituicao: instituicao.nome
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar necessidade:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Atualizar necessidade
app.put('/api/necessidades/:id', [
    authenticateToken,
    body('titulo').optional().notEmpty().withMessage('Título não pode estar vazio'),
    body('descricao').optional().notEmpty().withMessage('Descrição não pode estar vazia'),
    body('prioridade').optional().isIn(['baixa', 'media', 'alta']).withMessage('Prioridade deve ser baixa, media ou alta'),
    body('status').optional().isIn(['ativa', 'inativa', 'atendida']).withMessage('Status deve ser ativa, inativa ou atendida'),
    handleValidationErrors
], (req, res) => {
    try {
        const { id } = req.params;
        const necessidadeId = parseInt(id);
        
        const necessidadeIndex = database.necessidades.findIndex(n => n.id === necessidadeId);
        
        if (necessidadeIndex === -1) {
            return res.status(404).json({ erro: 'Necessidade não encontrada' });
        }
        
        const necessidade = database.necessidades[necessidadeIndex];
        
        // Verificar se o usuário pode editar esta necessidade
        const instituicao = database.instituicoes.find(i => i.id === necessidade.instituicaoId);
        if (!instituicao || (instituicao.userId !== req.user.id && req.user.tipo !== 'admin')) {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        const dadosAtualizados = { ...req.body, updatedAt: new Date() };
        
        database.necessidades[necessidadeIndex] = { ...necessidade, ...dadosAtualizados };
        
        res.json({
            mensagem: 'Necessidade atualizada com sucesso',
            necessidade: {
                ...database.necessidades[necessidadeIndex],
                instituicao: instituicao.nome
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar necessidade:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Deletar necessidade
app.delete('/api/necessidades/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const necessidadeId = parseInt(id);
        
        const necessidadeIndex = database.necessidades.findIndex(n => n.id === necessidadeId);
        
        if (necessidadeIndex === -1) {
            return res.status(404).json({ erro: 'Necessidade não encontrada' });
        }
        
        const necessidade = database.necessidades[necessidadeIndex];
        
        // Verificar se o usuário pode excluir esta necessidade
        const instituicao = database.instituicoes.find(i => i.id === necessidade.instituicaoId);
        if (!instituicao || (instituicao.userId !== req.user.id && req.user.tipo !== 'admin')) {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        // Remover necessidade
        database.necessidades.splice(necessidadeIndex, 1);
        
        // Remover doações relacionadas
        database.doacoes = database.doacoes.filter(d => d.necessidadeId !== necessidadeId);
        
        res.json({ mensagem: 'Necessidade excluída com sucesso' });
        
    } catch (error) {
        console.error('Erro ao excluir necessidade:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// ROTAS DE DOAÇÕES 🎁
// ===========================================

// Listar todas as doações
app.get('/api/doacoes', authenticateToken, (req, res) => {
    try {
        const { status, limite = 10, pagina = 1 } = req.query;
        
        let doacoes = database.doacoes.map(d => {
            const doador = database.usuarios.find(u => u.id === d.doadorId);
            const instituicao = database.instituicoes.find(i => i.id === d.instituicaoId);
            const necessidade = database.necessidades.find(n => n.id === d.necessidadeId);
            
            return {
                ...d,
                doador: doador ? doador.nome : 'Doador não encontrado',
                instituicao: instituicao ? instituicao.nome : 'Instituição não encontrada',
                necessidade: necessidade ? necessidade.titulo : 'Necessidade não encontrada'
            };
        });
        
        // Filtrar por usuário (só vê suas próprias doações ou as que recebeu)
        if (req.user.tipo === 'doador') {
            doacoes = doacoes.filter(d => d.doadorId === req.user.id);
        } else if (req.user.tipo === 'instituicao') {
            const instituicao = database.instituicoes.find(i => i.userId === req.user.id);
            if (instituicao) {
                doacoes = doacoes.filter(d => d.instituicaoId === instituicao.id);
            }
        }
        
        // Filtrar por status
        if (status) {
            doacoes = doacoes.filter(d => d.status === status);
        }
        
        // Paginação
        const totalItens = doacoes.length;
        const totalPaginas = Math.ceil(totalItens / limite);
        const inicio = (pagina - 1) * limite;
        const fim = inicio + parseInt(limite);
        
        doacoes = doacoes.slice(inicio, fim);
        
        res.json({
            doacoes,
            paginacao: {
                paginaAtual: parseInt(pagina),
                totalPaginas,
                totalItens,
                itemsPorPagina: parseInt(limite)
            }
        });
        
    } catch (error) {
        console.error('Erro ao listar doações:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Criar doação
app.post('/api/doacoes', [
    authenticateToken,
    body('item').notEmpty().withMessage('Item é obrigatório'),
    body('quantidade').isInt({ min: 1 }).withMessage('Quantidade deve ser um número inteiro positivo'),
    body('instituicaoId').isInt().withMessage('ID da instituição é obrigatório'),
    body('necessidadeId').optional().isInt().withMessage('ID da necessidade deve ser um número inteiro'),
    handleValidationErrors
], (req, res) => {
    try {
        const { item, quantidade, instituicaoId, necessidadeId } = req.body;
        
        // Verificar se o usuário é doador
        if (req.user.tipo !== 'doador') {
            return res.status(403).json({ erro: 'Apenas doadores podem criar doações' });
        }
        
        // Verificar se a instituição existe
        const instituicao = database.instituicoes.find(i => i.id === parseInt(instituicaoId));
        if (!instituicao) {
            return res.status(400).json({ erro: 'Instituição não encontrada' });
        }
        
        // Verificar se a necessidade existe (se fornecida)
        if (necessidadeId) {
            const necessidade = database.necessidades.find(n => n.id === parseInt(necessidadeId));
            if (!necessidade) {
                return res.status(400).json({ erro: 'Necessidade não encontrada' });
            }
            if (necessidade.instituicaoId !== parseInt(instituicaoId)) {
                return res.status(400).json({ erro: 'Necessidade não pertence à instituição informada' });
            }
        }
        
        const novaDoacao = {
            id: generateId('doacoes'),
            item,
            quantidade: parseInt(quantidade),
            status: 'pendente',
            doadorId: req.user.id,
            instituicaoId: parseInt(instituicaoId),
            necessidadeId: necessidadeId ? parseInt(necessidadeId) : null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        database.doacoes.push(novaDoacao);
        
        // Criar notificação para a instituição
        const notificacao = {
            id: generateId('notificacoes'),
            titulo: 'Nova doação recebida',
            descricao: `Você recebeu uma nova doação: ${item} (${quantidade} unidades)`,
            userId: instituicao.userId,
            lida: false,
            createdAt: new Date()
        };
        
        database.notificacoes.push(notificacao);
        
        res.status(201).json({
            mensagem: 'Doação criada com sucesso',
            doacao: {
                ...novaDoacao,
                doador: req.user.nome || 'Doador',
                instituicao: instituicao.nome
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar doação:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Atualizar status da doação
app.put('/api/doacoes/:id', [
    authenticateToken,
    body('status').isIn(['pendente', 'aceita', 'em_transito', 'entregue', 'cancelada']).withMessage('Status deve ser pendente, aceita, em_transito, entregue ou cancelada'),
    handleValidationErrors
], (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const doacaoId = parseInt(id);
        
        const doacaoIndex = database.doacoes.findIndex(d => d.id === doacaoId);
        
        if (doacaoIndex === -1) {
            return res.status(404).json({ erro: 'Doação não encontrada' });
        }
        
        const doacao = database.doacoes[doacaoIndex];
        
        // Verificar permissões
        let podeAtualizar = false;
        
        if (req.user.tipo === 'doador' && doacao.doadorId === req.user.id) {
            // Doador pode cancelar sua própria doação
            podeAtualizar = status === 'cancelada';
        } else if (req.user.tipo === 'instituicao') {
            // Instituição pode aceitar/rejeitar doações para ela
            const instituicao = database.instituicoes.find(i => i.userId === req.user.id);
            if (instituicao && doacao.instituicaoId === instituicao.id) {
                podeAtualizar = true;
            }
        }
        
        if (!podeAtualizar && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        database.doacoes[doacaoIndex] = {
            ...doacao,
            status,
            updatedAt: new Date()
        };
        
        // Criar notificação para o doador se a instituição atualizou
        if (req.user.tipo === 'instituicao') {
            const notificacao = {
                id: generateId('notificacoes'),
                titulo: 'Status da doação atualizado',
                descricao: `Sua doação "${doacao.item}" foi ${status === 'aceita' ? 'aceita' : 'atualizada'}`,
                userId: doacao.doadorId,
                lida: false,
                createdAt: new Date()
            };
            
            database.notificacoes.push(notificacao);
        }
        
        res.json({
            mensagem: 'Status da doação atualizado com sucesso',
            doacao: database.doacoes[doacaoIndex]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar doação:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Cancelar doação
app.delete('/api/doacoes/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const doacaoId = parseInt(id);
        
        const doacaoIndex = database.doacoes.findIndex(d => d.id === doacaoId);
        
        if (doacaoIndex === -1) {
            return res.status(404).json({ erro: 'Doação não encontrada' });
        }
        
        const doacao = database.doacoes[doacaoIndex];
        
        // Verificar se o usuário pode cancelar esta doação
        let podeCancelar = false;
        
        if (req.user.tipo === 'doador' && doacao.doadorId === req.user.id) {
            podeCancelar = true;
        } else if (req.user.tipo === 'instituicao') {
            const instituicao = database.instituicoes.find(i => i.userId === req.user.id);
            podeCancelar = instituicao && doacao.instituicaoId === instituicao.id;
        }
        
        if (!podeCancelar && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        // Remover doação
        database.doacoes.splice(doacaoIndex, 1);
        
        res.json({ mensagem: 'Doação cancelada com sucesso' });
        
    } catch (error) {
        console.error('Erro ao cancelar doação:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// ROTAS DE MENSAGENS (CHAT) 💬
// ===========================================

// Listar conversas do usuário
app.get('/api/mensagens/:userId', authenticateToken, (req, res) => {
    try {
        const { userId } = req.params;
        const userIdInt = parseInt(userId);
        
        // Verificar se o usuário pode acessar estas mensagens
        if (req.user.id !== userIdInt && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        const mensagens = database.mensagens.filter(m => 
            m.remetente === userIdInt || m.destinatario === userIdInt
        );
        
        // Agrupar mensagens por conversa
        const conversas = {};
        mensagens.forEach(msg => {
            const outroUsuario = msg.remetente === userIdInt ? msg.destinatario : msg.remetente;
            if (!conversas[outroUsuario]) {
                const usuario = database.usuarios.find(u => u.id === outroUsuario);
                conversas[outroUsuario] = {
                    userId: outroUsuario,
                    nome: usuario ? usuario.nome : 'Usuário não encontrado',
                    ultimaMensagem: msg.mensagem,
                    data: msg.createdAt,
                    lida: msg.lida
                };
            }
        });
        
        res.json(Object.values(conversas));
        
    } catch (error) {
        console.error('Erro ao listar mensagens:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Enviar mensagem
app.post('/api/mensagens', [
    authenticateToken,
    body('destinatario').isInt().withMessage('Destinatário deve ser um ID válido'),
    body('mensagem').notEmpty().withMessage('Mensagem é obrigatória'),
    handleValidationErrors
], (req, res) => {
    try {
        const { destinatario, mensagem } = req.body;
        
        // Verificar se o destinatário existe
        const usuarioDestinatario = database.usuarios.find(u => u.id === parseInt(destinatario));
        if (!usuarioDestinatario) {
            return res.status(400).json({ erro: 'Destinatário não encontrado' });
        }
        
        const novaMensagem = {
            id: generateId('mensagens'),
            remetente: req.user.id,
            destinatario: parseInt(destinatario),
            mensagem,
            lida: false,
            createdAt: new Date()
        };
        
        database.mensagens.push(novaMensagem);
        
        res.status(201).json({
            mensagem: 'Mensagem enviada com sucesso',
            msg: novaMensagem
        });
        
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Deletar mensagem
app.delete('/api/mensagens/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const mensagemId = parseInt(id);
        
        const mensagemIndex = database.mensagens.findIndex(m => m.id === mensagemId);
        
        if (mensagemIndex === -1) {
            return res.status(404).json({ erro: 'Mensagem não encontrada' });
        }
        
        const mensagem = database.mensagens[mensagemIndex];
        
        // Verificar se o usuário pode deletar esta mensagem
        if (mensagem.remetente !== req.user.id && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        database.mensagens.splice(mensagemIndex, 1);
        
        res.json({ mensagem: 'Mensagem excluída com sucesso' });
        
    } catch (error) {
        console.error('Erro ao excluir mensagem:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// ROTAS DE NOTIFICAÇÕES 🔔
// ===========================================

// Listar notificações do usuário
app.get('/api/notificacoes/:userId', authenticateToken, (req, res) => {
    try {
        const { userId } = req.params;
        const userIdInt = parseInt(userId);
        
        // Verificar se o usuário pode acessar estas notificações
        if (req.user.id !== userIdInt && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        const notificacoes = database.notificacoes.filter(n => n.userId === userIdInt);
        
        res.json(notificacoes);
        
    } catch (error) {
        console.error('Erro ao listar notificações:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Criar notificação (apenas para admins)
app.post('/api/notificacoes', [
    authenticateToken,
    body('titulo').notEmpty().withMessage('Título é obrigatório'),
    body('descricao').notEmpty().withMessage('Descrição é obrigatória'),
    body('userId').isInt().withMessage('ID do usuário é obrigatório'),
    handleValidationErrors
], (req, res) => {
    try {
        const { titulo, descricao, userId } = req.body;
        
        // Apenas admins podem criar notificações arbitrárias
        if (req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Apenas administradores podem criar notificações' });
        }
        
        const novaNotificacao = {
            id: generateId('notificacoes'),
            titulo,
            descricao,
            userId: parseInt(userId),
            lida: false,
            createdAt: new Date()
        };
        
        database.notificacoes.push(novaNotificacao);
        
        res.status(201).json({
            mensagem: 'Notificação criada com sucesso',
            notificacao: novaNotificacao
        });
        
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Marcar notificação como lida
app.put('/api/notificacoes/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const notificacaoId = parseInt(id);
        
        const notificacaoIndex = database.notificacoes.findIndex(n => n.id === notificacaoId);
        
        if (notificacaoIndex === -1) {
            return res.status(404).json({ erro: 'Notificação não encontrada' });
        }
        
        const notificacao = database.notificacoes[notificacaoIndex];
        
        // Verificar se o usuário pode marcar esta notificação
        if (notificacao.userId !== req.user.id && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        database.notificacoes[notificacaoIndex] = {
            ...notificacao,
            lida: true
        };
        
        res.json({
            mensagem: 'Notificação marcada como lida',
            notificacao: database.notificacoes[notificacaoIndex]
        });
        
    } catch (error) {
        console.error('Erro ao marcar notificação:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Excluir notificação
app.delete('/api/notificacoes/:id', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const notificacaoId = parseInt(id);
        
        const notificacaoIndex = database.notificacoes.findIndex(n => n.id === notificacaoId);
        
        if (notificacaoIndex === -1) {
            return res.status(404).json({ erro: 'Notificação não encontrada' });
        }
        
        const notificacao = database.notificacoes[notificacaoIndex];
        
        // Verificar se o usuário pode excluir esta notificação
        if (notificacao.userId !== req.user.id && req.user.tipo !== 'admin') {
            return res.status(403).json({ erro: 'Acesso negado' });
        }
        
        database.notificacoes.splice(notificacaoIndex, 1);
        
        res.json({ mensagem: 'Notificação excluída com sucesso' });
        
    } catch (error) {
        console.error('Erro ao excluir notificação:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// ROTAS DE AVALIAÇÕES ⭐
// ===========================================

// Enviar avaliação
app.post('/api/avaliacoes', [
    authenticateToken,
    body('avaliado').isInt().withMessage('ID do avaliado é obrigatório'),
    body('nota').isInt({ min: 1, max: 5 }).withMessage('Nota deve estar entre 1 e 5'),
    body('comentario').optional().isLength({ max: 500 }).withMessage('Comentário deve ter no máximo 500 caracteres'),
    handleValidationErrors
], (req, res) => {
    try {
        const { avaliado, nota, comentario } = req.body;
        
        // Verificar se o avaliado existe
        const usuarioAvaliado = database.usuarios.find(u => u.id === parseInt(avaliado));
        if (!usuarioAvaliado) {
            return res.status(400).json({ erro: 'Usuário avaliado não encontrado' });
        }
        
        // Verificar se o usuário não está avaliando a si mesmo
        if (req.user.id === parseInt(avaliado)) {
            return res.status(400).json({ erro: 'Você não pode avaliar a si mesmo' });
        }
        
        // Verificar se já existe uma avaliação deste usuário para o avaliado
        const avaliacaoExistente = database.avaliacoes.find(a => 
            a.avaliador === req.user.id && a.avaliado === parseInt(avaliado)
        );
        
        if (avaliacaoExistente) {
            return res.status(400).json({ erro: 'Você já avaliou este usuário' });
        }
        
        const novaAvaliacao = {
            id: generateId('avaliacoes'),
            avaliador: req.user.id,
            avaliado: parseInt(avaliado),
            nota: parseInt(nota),
            comentario: comentario || null,
            createdAt: new Date()
        };
        
        database.avaliacoes.push(novaAvaliacao);
        
        res.status(201).json({
            mensagem: 'Avaliação enviada com sucesso',
            avaliacao: novaAvaliacao
        });
        
    } catch (error) {
        console.error('Erro ao enviar avaliação:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// Ver avaliações do usuário
app.get('/api/avaliacoes/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userIdInt = parseInt(userId);
        
        const avaliacoes = database.avaliacoes.filter(a => a.avaliado === userIdInt);
        
        // Adicionar nome do avaliador
        const avaliacoesCompletas = avaliacoes.map(a => {
            const avaliador = database.usuarios.find(u => u.id === a.avaliador);
            return {
                ...a,
                avaliador: avaliador ? avaliador.nome : 'Usuário não encontrado'
            };
        });
        
        // Calcular média das avaliações
        const totalAvaliacoes = avaliacoesCompletas.length;
        const somaNotas = avaliacoesCompletas.reduce((soma, a) => soma + a.nota, 0);
        const mediaAvaliacoes = totalAvaliacoes > 0 ? (somaNotas / totalAvaliacoes).toFixed(1) : 0;
        
        res.json({
            avaliacoes: avaliacoesCompletas,
            estatisticas: {
                totalAvaliacoes,
                mediaAvaliacoes: parseFloat(mediaAvaliacoes)
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar avaliações:', error);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ===========================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// ===========================================

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ erro: 'Algo deu errado no servidor!' });
});

// Rota para páginas não encontradas
app.use('*', (req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
});

// ===========================================
// INICIALIZAÇÃO DO SERVIDOR
// ===========================================

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Acesse: http://localhost:${PORT}`);
    console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
    console.log('📊 Tabelas do banco já devem estar criadas localmente');
});

module.exports = app; 