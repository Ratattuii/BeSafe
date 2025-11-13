const { query, queryOne } = require('../database/db');
const pushNotifications = require('../services/pushNotifications');

// --- FUNÇÕES DE GERENCIAMENTO DE USUÁRIO ---

const getAllUsers = async (req, res) => {
  try {
    const users = await query('SELECT id, name, email, role, created_at, avatar FROM users ORDER BY created_at DESC');
    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários.' });
  }
};

const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['donor', 'receiver', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'Papel (role) inválido.' });
  }

  try {
    const result = await query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.json({ message: 'Papel do usuário atualizado com sucesso.' });
  } catch (error) {
    console.error('Erro ao atualizar papel do usuário:', error);
    res.status(500).json({ message: 'Erro ao atualizar papel do usuário.' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Adicionar lógica para deletar dependências (doações, necessidades, etc.) se necessário (ON DELETE CASCADE)
    const result = await query('DELETE FROM users WHERE id = ?', [id]);
    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    }
    res.json({ message: 'Usuário deletado com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ message: 'Erro ao deletar usuário.' });
  }
};

// --- FUNÇÕES DE ESTATÍSTICAS ---

const getAdminStats = async (req, res) => {
  try {
    const userCountResult = await query('SELECT COUNT(*) as userCount FROM users');
    const institutionCountResult = await query('SELECT COUNT(*) as institutionCount FROM institutions');
    const needsCountResult = await query('SELECT COUNT(*) as needsCount FROM needs');
    const donationsCountResult = await query('SELECT COUNT(*) as donationsCount FROM donations');
    
    res.json({
      userCount: userCountResult[0]?.userCount || 0,
      institutionCount: institutionCountResult[0]?.institutionCount || 0,
      needsCount: needsCountResult[0]?.needsCount || 0,
      donationsCount: donationsCountResult[0]?.donationsCount || 0
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas do admin:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas.' });
  }
};

// --- FUNÇÕES DE ALERTA DE DESASTRE ---

// IMPORTANTE: O nome da função é "sendGlobalDisasterAlert"
const sendGlobalDisasterAlert = async (req, res) => {
  const { title, body } = req.body;
  
  if (!title || !body) {
    return res.status(400).json({ message: 'Título e corpo são obrigatórios.' });
  }

  try {
    const message = {
      notification: {
        title: `🚨 ALERTA BESAFE: ${title}`,
        body: body,
      },
      topic: 'all_users', // Envia para todos os usuários inscritos no tópico
    };

    // Salva o alerta no banco de dados
    const result = await query(
      'INSERT INTO disaster_alerts (title, message, sent_by) VALUES (?, ?, ?)',
      [title, body, req.user.id] // req.user.id vem do middleware authenticateToken
    );
    
    // Envia a notificação push
    const response = await pushNotifications.sendPushNotification(message);

    res.status(201).json({ 
      message: 'Alerta de desastre enviado com sucesso!', 
      alertId: result.insertId,
      firebaseResponse: response 
    });
  } catch (error) {
    console.error('Erro ao enviar alerta de desastre:', error);
    res.status(500).json({ message: 'Erro ao enviar alerta de desastre.', error: error.message });
  }
};

const getAlertHistory = async (req, res) => {
  try {
    const alerts = await query(
      `SELECT da.*, u.name AS sent_by_name 
       FROM disaster_alerts da
       JOIN users u ON da.sent_by = u.id
       ORDER BY da.created_at DESC
       LIMIT 50`
    );
    res.json(alerts);
  } catch (error) {
    console.error('Erro ao buscar histórico de alertas:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico de alertas.' });
  }
};

const getAlertStats = async (req, res) => {
  try {
    const [{ count }] = await query('SELECT COUNT(*) as count FROM disaster_alerts');
    res.json({ totalAlerts: count || 0 });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de alertas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de alertas.' });
  }
};


// IMPORTANTE: A EXPORTAÇÃO no final do arquivo
module.exports = {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
  sendGlobalDisasterAlert, // <-- Nome correto (com "Global")
  getAlertHistory,
  getAlertStats
};  