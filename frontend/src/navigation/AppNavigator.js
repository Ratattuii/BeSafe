import React from 'react';
import { View, Text, StyleSheet } from 'react-native';


const AppNavigator = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Navegaão</Text>
      <Text style={styles.subtitle}>
        A navegação será implementada quando as telas estiverem prontas
      </Text>
      <Text style={styles.info}>
        Telas planejadas:
      </Text>
      <Text style={styles.list}>
        • Login/Cadastro{'\n'}
        • Dashboard (Doador/Receptor){'\n'}
        • Lista de Necessidades{'\n'}
        • Detalhes da Necessidade{'\n'}
        • Chat/Mensagens{'\n'}
        • Perfil do Usuário{'\n'}
        • Configurações
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  info: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#444',
  },
  list: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'left',
  },
});

export default AppNavigator;
