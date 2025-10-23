import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { showError } from '../utils/alerts';
import { colors, spacing, fontSizes, fontWeights, borderRadius, shadows } from '../styles/globalStyles';

const AdminAlertsScreen = () => {
  const navigation = useNavigation();
  const { user, isAuthenticated, getUserRole } = useAuth();
  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    severity: 'info',
  });
  const [loading, setLoading] = useState(false);
  const [alertHistory, setAlertHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (isAuthenticated() && getUserRole() === 'admin') {
      fetchAlertHistory();
      fetchAlertStats();
    } else {
      Alert.alert('Acesso Negado', 'Você não tem permissão para acessar esta área.');
      navigation.navigate('Home');
    }
  }, [user, isAuthenticated, getUserRole]);

  const fetchAlertHistory = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/admin/alerts/history?limit=10');
      if (response.success) {
        setAlertHistory(response.data.alerts);
      } else {
        showError(response.message || 'Erro ao carregar histórico de alertas.');
      }
    } catch (error) {
      console.error('Erro ao buscar histórico de alertas:', error);
      showError('Erro de conexão ao carregar histórico.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchAlertStats = async () => {
    try {
      const response = await api.get('/admin/alerts/stats');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas de alertas:', error);
    }
  };

  const handleSendAlert = async () => {
    if (!alertForm.title.trim()) {
      showError('Título é obrigatório.');
      return;
    }

    if (!alertForm.message.trim()) {
      showError('Mensagem é obrigatória.');
      return;
    }

    Alert.alert(
      'Confirmar Envio',
      `Deseja enviar este alerta para todos os usuários?\n\nTítulo: ${alertForm.title}\nSeveridade: ${alertForm.severity}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const response = await api.post('/admin/alerts/disaster', alertForm);
              if (response.success) {
                Alert.alert(
                  'Sucesso!',
                  `Alerta enviado para ${response.data.alert.recipientsCount} usuários.`,
                  [{ text: 'OK', onPress: () => {
                    setAlertForm({ title: '', message: '', severity: 'info' });
                    fetchAlertHistory();
                    fetchAlertStats();
                  }}]
                );
              } else {
                showError(response.message || 'Erro ao enviar alerta.');
              }
            } catch (error) {
              console.error('Erro ao enviar alerta:', error);
              showError('Erro de conexão ao enviar alerta.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return colors.error;
      case 'warning': return colors.warning;
      case 'info': return colors.info;
      default: return colors.gray500;
    }
  };

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'warning': return 'Aviso';
      case 'info': return 'Informativo';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alertas de Desastre</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Estatísticas */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Estatísticas</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalAlerts}</Text>
                <Text style={styles.statLabel}>Total de Alertas</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalRecipients}</Text>
                <Text style={styles.statLabel}>Destinatários</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.criticalAlerts}</Text>
                <Text style={styles.statLabel}>Críticos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.warningAlerts}</Text>
                <Text style={styles.statLabel}>Avisos</Text>
              </View>
            </View>
          </View>
        )}

        {/* Formulário de Alerta */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Enviar Novo Alerta</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título:</Text>
            <TextInput
              style={styles.input}
              value={alertForm.title}
              onChangeText={(text) => setAlertForm({ ...alertForm, title: text })}
              placeholder="Ex: Alerta de Enchente"
              maxLength={255}
              accessible={true}
              accessibilityLabel="Título do alerta"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Severidade:</Text>
            <View style={styles.severityGroup}>
              {['info', 'warning', 'critical'].map((severity) => (
                <TouchableOpacity
                  key={severity}
                  style={[
                    styles.severityButton,
                    alertForm.severity === severity && styles.severityButtonSelected,
                    { borderColor: getSeverityColor(severity) }
                  ]}
                  onPress={() => setAlertForm({ ...alertForm, severity })}
                  accessible={true}
                  accessibilityLabel={`Severidade ${getSeverityText(severity)}`}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.severityText,
                    alertForm.severity === severity && styles.severityTextSelected,
                    { color: alertForm.severity === severity ? colors.white : getSeverityColor(severity) }
                  ]}>
                    {getSeverityText(severity)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Mensagem:</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={alertForm.message}
              onChangeText={(text) => setAlertForm({ ...alertForm, message: text })}
              placeholder="Descreva o alerta de desastre..."
              multiline
              numberOfLines={4}
              maxLength={2000}
              accessible={true}
              accessibilityLabel="Mensagem do alerta"
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendAlert}
            disabled={loading}
            accessible={true}
            accessibilityLabel={loading ? "Enviando alerta" : "Enviar alerta de desastre"}
            accessibilityRole="button"
            accessibilityState={{ busy: loading }}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.sendButtonText}>Enviar Alerta Agora</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Histórico */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Histórico de Alertas</Text>
          
          {loadingHistory ? (
            <ActivityIndicator color={colors.primary} style={styles.historyLoading} />
          ) : alertHistory.length === 0 ? (
            <Text style={styles.noHistoryText}>Nenhum alerta enviado ainda.</Text>
          ) : (
            alertHistory.map((alert) => (
              <View key={alert.id} style={styles.historyItem}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>{alert.title}</Text>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}>
                    <Text style={styles.severityBadgeText}>{getSeverityText(alert.severity)}</Text>
                  </View>
                </View>
                <Text style={styles.historyMessage}>{alert.message}</Text>
                <View style={styles.historyFooter}>
                  <Text style={styles.historyDate}>{formatDate(alert.sent_at)}</Text>
                  <Text style={styles.historyRecipients}>{alert.recipients_count} destinatários</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonText: {
    fontSize: fontSizes.xl,
    color: colors.primary,
    fontWeight: fontWeights.bold,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
  },
  scrollContent: {
    padding: spacing.md,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  statsTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  formTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.small,
    padding: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  severityGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  severityButton: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 2,
    borderRadius: borderRadius.small,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  severityButtonSelected: {
    backgroundColor: colors.primary,
  },
  severityText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  severityTextSelected: {
    color: colors.white,
  },
  sendButton: {
    backgroundColor: colors.error,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
  },
  historyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    ...shadows.small,
  },
  historyTitle: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  historyLoading: {
    marginVertical: spacing.lg,
  },
  noHistoryText: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.lg,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.small,
  },
  severityBadgeText: {
    fontSize: fontSizes.xs,
    color: colors.white,
    fontWeight: fontWeights.bold,
  },
  historyMessage: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyDate: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
  },
  historyRecipients: {
    fontSize: fontSizes.xs,
    color: colors.gray500,
  },
});

export default AdminAlertsScreen;
