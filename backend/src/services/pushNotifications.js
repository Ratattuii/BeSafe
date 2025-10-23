const admin = require('firebase-admin');
const { query, queryOne } = require('../database/db');
const { success, errors } = require('../utils/responses');

/**
 * Serviço de Push Notifications usando Firebase Cloud Messaging
 */
class PushNotificationService {
  constructor() {
    this.messaging = null;
    this.initializeMessaging();
  }

  initializeMessaging() {
    try {
      if (admin.apps.length > 0) {
        this.messaging = admin.messaging();
        console.log('FCM inicializado com sucesso');
      } else {
        console.error('Firebase Admin não foi inicializado');
      }
    } catch (error) {
      console.error('Erro ao inicializar FCM:', error.message);
    }
  }

  /**
   * Envia alerta global para todos os usuários
   * @param {string} title - Título do alerta
   * @param {string} body - Corpo da mensagem
   * @param {object} data - Dados adicionais
   * @param {string} severity - Severidade do alerta
   */
  async sendGlobalAlert(title, body, data = {}, severity = 'info') {
    try {
      if (!this.messaging) {
        throw new Error('FCM não inicializado');
      }

      // Buscar todos os tokens FCM ativos dos usuários
      const users = await query(`
        SELECT fcm_token FROM users 
        WHERE fcm_token IS NOT NULL 
        AND fcm_token != '' 
        AND is_active = TRUE
      `);

      if (users.length === 0) {
        console.log('Nenhum token FCM encontrado');
        return { success: false, message: 'Nenhum usuário com token FCM encontrado' };
      }

      const tokens = users.map(user => user.fcm_token).filter(token => token);

      if (tokens.length === 0) {
        return { success: false, message: 'Nenhum token FCM válido encontrado' };
      }

      // Configurar a mensagem
      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: 'disaster_alert',
          severity: severity,
          timestamp: new Date().toISOString(),
          ...data,
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'disaster_alerts',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: title,
                body: body,
              },
            },
          },
        },
        tokens: tokens,
      };

      // Enviar para todos os tokens
      const response = await this.messaging.sendMulticast(message);
      
      console.log(`Alerta enviado: ${response.successCount} sucessos, ${response.failureCount} falhas`);

      // Processar tokens inválidos
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Falha no token ${tokens[idx]}:`, resp.error);
            if (resp.error?.code === 'messaging/invalid-registration-token' ||
                resp.error?.code === 'messaging/registration-token-not-registered') {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        // Remover tokens inválidos do banco
        if (invalidTokens.length > 0) {
          await this.removeInvalidTokens(invalidTokens);
        }
      }

      return {
        success: true,
        message: `Alerta enviado para ${response.successCount} usuários`,
        data: {
          successCount: response.successCount,
          failureCount: response.failureCount,
          totalTokens: tokens.length,
        },
      };

    } catch (error) {
      console.error('Erro ao enviar alerta global:', error.message);
      return {
        success: false,
        message: 'Erro ao enviar alerta: ' + error.message,
      };
    }
  }

  /**
   * Envia notificação para usuários específicos
   * @param {Array} userIds - IDs dos usuários
   * @param {string} title - Título da notificação
   * @param {string} body - Corpo da mensagem
   * @param {object} data - Dados adicionais
   */
  async sendTargetedNotification(userIds, title, body, data = {}) {
    try {
      if (!this.messaging) {
        throw new Error('FCM não inicializado');
      }

      if (!userIds || userIds.length === 0) {
        return { success: false, message: 'Nenhum usuário especificado' };
      }

      // Buscar tokens dos usuários específicos
      const placeholders = userIds.map(() => '?').join(',');
      const users = await query(`
        SELECT fcm_token FROM users 
        WHERE id IN (${placeholders})
        AND fcm_token IS NOT NULL 
        AND fcm_token != '' 
        AND is_active = TRUE
      `, userIds);

      if (users.length === 0) {
        return { success: false, message: 'Nenhum token FCM encontrado para os usuários especificados' };
      }

      const tokens = users.map(user => user.fcm_token).filter(token => token);

      const message = {
        notification: {
          title: title,
          body: body,
        },
        data: {
          type: 'targeted_notification',
          timestamp: new Date().toISOString(),
          ...data,
        },
        tokens: tokens,
      };

      const response = await this.messaging.sendMulticast(message);
      
      return {
        success: true,
        message: `Notificação enviada para ${response.successCount} usuários`,
        data: {
          successCount: response.successCount,
          failureCount: response.failureCount,
        },
      };

    } catch (error) {
      console.error('Erro ao enviar notificação direcionada:', error.message);
      return {
        success: false,
        message: 'Erro ao enviar notificação: ' + error.message,
      };
    }
  }

  /**
   * Remove tokens FCM inválidos do banco de dados
   * @param {Array} invalidTokens - Array de tokens inválidos
   */
  async removeInvalidTokens(invalidTokens) {
    try {
      for (const token of invalidTokens) {
        await query('UPDATE users SET fcm_token = NULL WHERE fcm_token = ?', [token]);
        console.log(`Token inválido removido: ${token.substring(0, 20)}...`);
      }
    } catch (error) {
      console.error('Erro ao remover tokens inválidos:', error.message);
    }
  }

  /**
   * Registra ou atualiza token FCM de um usuário
   * @param {number} userId - ID do usuário
   * @param {string} fcmToken - Token FCM
   */
  async registerUserToken(userId, fcmToken) {
    try {
      if (!fcmToken || fcmToken.trim() === '') {
        return { success: false, message: 'Token FCM inválido' };
      }

      await query('UPDATE users SET fcm_token = ? WHERE id = ?', [fcmToken, userId]);
      
      return { success: true, message: 'Token FCM registrado com sucesso' };
    } catch (error) {
      console.error('Erro ao registrar token FCM:', error.message);
      return { success: false, message: 'Erro ao registrar token FCM' };
    }
  }

  /**
   * Remove token FCM de um usuário
   * @param {number} userId - ID do usuário
   */
  async unregisterUserToken(userId) {
    try {
      await query('UPDATE users SET fcm_token = NULL WHERE id = ?', [userId]);
      return { success: true, message: 'Token FCM removido com sucesso' };
    } catch (error) {
      console.error('Erro ao remover token FCM:', error.message);
      return { success: false, message: 'Erro ao remover token FCM' };
    }
  }
}

// Instância singleton do serviço
const pushNotificationService = new PushNotificationService();

module.exports = pushNotificationService;
