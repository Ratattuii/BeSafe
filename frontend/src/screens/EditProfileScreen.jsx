import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../styles/globalStyles';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
// Você pode querer importar seu ImagePicker aqui, se já o tiver configurado
// import { showImagePickerOptions } from '../utils/ImagePicker'; 

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth(); // Usaremos updateProfile do AuthContext

  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.address || '');
  const [description, setDescription] = useState(user?.description || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [newAvatarFile, setNewAvatarFile] = useState(null); // Para o arquivo da imagem
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Efeito para garantir que os dados estejam preenchidos se o usuário for carregado
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLocation(user.address || '');
      setDescription(user.description || '');
      setAvatar(user.avatar || null);
    }
  }, [user]);

  const handleImagePick = () => {
    // Lógica para escolher a imagem (exemplo com alerta)
    Alert.alert(
      'Alterar Foto',
      'Funcionalidade de upload de imagem ainda não implementada.'
    );
  };

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        name,
        address: location || null,
        description: description || null,
      };

      // O 'updateProfile' (que adicionaremos ao AuthContext)
      // deve ser inteligente o suficiente para lidar com o upload de arquivos
      const response = await updateProfile(userData, newAvatarFile);

      if (response.success) {
        Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
        navigation.goBack();
      } else {
        Alert.alert('Erro', response.message || 'Não foi possível atualizar o perfil.');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Editar Perfil</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      {renderHeader()}
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatar || `https://via.placeholder.com/120x120/FFDDAA/888888?text=${name?.charAt(0) || 'U'}` }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePick}>
            <Text style={styles.imagePickerButtonText}>Alterar foto de perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Nome *</Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.textInputError]}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Localização</Text>
            <TextInput
              style={styles.textInput}
              value={location}
              onChangeText={setLocation}
              placeholder="Ex: São Paulo, SP"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Descrição</Text>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Fale um pouco sobre você..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Salvar Alterações</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: colors.textPrimary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.secondary,
    marginBottom: 16,
  },
  imagePickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  imagePickerButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    paddingHorizontal: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  textInputError: {
    borderColor: colors.error,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 4,
  },
  submitContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
});

export default EditProfileScreen;