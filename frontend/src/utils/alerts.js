import { Alert } from 'react-native';

/**
 * Utilitários para alertas padronizados
 */

/**
 * Alert de erro simples
 */
export const showError = (message) => {
  Alert.alert('Erro', message);
};

/**
 * Alert de sucesso simples
 */
export const showSuccess = (message) => {
  Alert.alert('Sucesso', message);
};

/**
 * Alert de confirmação
 */
export const showConfirmation = (title, message, onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancelar', onPress: onCancel, style: 'cancel' },
      { text: 'Confirmar', onPress: onConfirm }
    ]
  );
};

/**
 * Alert de desenvolvimento (funcionalidade não implementada)
 */
export const showDevAlert = (feature) => {
  Alert.alert(feature, 'Funcionalidade em desenvolvimento');
};
