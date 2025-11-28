const { query, queryOne } = require('../database/db');
const { deleteFile } = require('../middleware/upload');
const path = require('path');

/**
 * Busca usuário por ID
 * GET /users/:id
 */
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    // Validação básica
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuário inválido'
      });
    }

    // Busca usuário no banco (sem senha)
    const user = await queryOne(
      'SELECT id, name, email, role, avatar, description, address, created_at FROM users WHERE id = ?',
      [id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: user
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

/**
 * Atualiza dados do usuário
 * PUT /users/:id
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;

    const { name, description, address } = req.body;

    // Validações básicas
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuário inválido'
      });
    }

    // Verifica se usuário pode editar (só pode editar a si mesmo)
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'Você só pode editar seu próprio perfil'
      });
    }

    // Busca usuário atual
    const currentUser = await queryOne(
      'SELECT id, name, avatar FROM users WHERE id = ?',
      [id]
    );

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Prepara dados para atualização
    let updateFields = [];
    let updateValues = [];

    // Atualiza nome se fornecido (e não for undefined)
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name.trim());
    }
    
    // Atualiza descrição se fornecida (e não for undefined)
    if (description !== undefined) {
      const finalDescription = description === 'null' ? null : description;
      updateFields.push('description = ?');
      updateValues.push(finalDescription);
    }

    // Atualiza endereço se fornecido (e não for undefined)
    if (address !== undefined) {
      const finalAddress = address === 'null' ? null : address;
      updateFields.push('address = ?');
      updateValues.push(finalAddress);
    }

    // Atualiza avatar se enviado
    if (req.file) {
      // Remove avatar antigo se existir
      if (currentUser.avatar) {
        const oldAvatarPath = path.join(__dirname, '../../', currentUser.avatar);
        deleteFile(oldAvatarPath);
      }

      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      updateFields.push('avatar = ?');
      updateValues.push(avatarPath);
    }

    // Verifica se há dados para atualizar
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum dado válido para atualizar'
      });
    }

    // Adiciona timestamp de atualização
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    // Executa atualização
    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Busca usuário atualizado
    // ATUALIZADO: Buscar todos os campos
    const updatedUser = await queryOne(
      'SELECT id, name, email, role, avatar, description, address, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    console.log(`✅ Usuário atualizado: ${updatedUser.email}`);

    res.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
}

module.exports = {
  getUserById,
  updateUser
};