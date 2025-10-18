import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { validateImageExtension, generateSafeFilename, getMimeTypeFromExtension } from './imageUtils';

export const requestMediaLibraryPermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        'Precisamos de permissão para acessar suas fotos. Vá nas configurações do app para conceder a permissão.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }
  return true;
};

export const requestCameraPermissions = async () => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Negada',
        'Precisamos de permissão para usar a câmera. Vá nas configurações do app para conceder a permissão.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }
  return true;
};

export const pickImageFromLibrary = async (options = {}) => {
  const hasPermission = await requestMediaLibraryPermissions();
  if (!hasPermission) return null;

  const defaultOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    allowsMultipleSelection: false,
    ...options,
  };

  try {
    const result = await ImagePicker.launchImageLibraryAsync(defaultOptions);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Validação básica e preparação para upload direto ao backend
      if (asset.uri && validateImageExtension(asset.uri)) {
        return {
          ...asset,
          mimeType: getMimeTypeFromExtension(asset.uri),
          safeName: generateSafeFilename(asset.uri)
        };
      }
      
      return asset;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao selecionar imagem:', error);
    Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    return null;
  }
};

export const takePhoto = async (options = {}) => {
  const hasPermission = await requestCameraPermissions();
  if (!hasPermission) return null;

  const defaultOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
    ...options,
  };

  try {
    const result = await ImagePicker.launchCameraAsync(defaultOptions);
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Validação básica e preparação para upload direto ao backend
      if (asset.uri && validateImageExtension(asset.uri)) {
        return {
          ...asset,
          mimeType: getMimeTypeFromExtension(asset.uri),
          safeName: generateSafeFilename(asset.uri)
        };
      }
      
      return asset;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao tirar foto:', error);
    Alert.alert('Erro', 'Não foi possível tirar a foto.');
    return null;
  }
};

export const showImagePickerOptions = (onImageSelected, options = {}) => {
  Alert.alert(
    'Selecionar Imagem',
    'Escolha uma opção',
    [
      {
        text: 'Câmera',
        onPress: async () => {
          const image = await takePhoto(options);
          if (image && onImageSelected) {
            onImageSelected(image);
          }
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const image = await pickImageFromLibrary(options);
          if (image && onImageSelected) {
            onImageSelected(image);
          }
        },
      },
      {
        text: 'Cancelar',
        style: 'cancel',
      },
    ]
  );
};

// Função para validar tipo de arquivo
export const validateImageType = (imageUri) => {
  return validateImageExtension(imageUri);
};

// Função para validar tamanho do arquivo
export const validateImageSize = (imageSize, maxSizeMB = 5) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return imageSize <= maxSizeBytes;
};

// Função para preparar FormData para upload ao backend
export const prepareImageFormData = (imageAsset, fieldName = 'image') => {
  if (!imageAsset || !imageAsset.uri) {
    throw new Error('Asset de imagem inválido');
  }

  const formData = new FormData();
  
  // Para React Native
  if (Platform.OS !== 'web') {
    formData.append(fieldName, {
      uri: imageAsset.uri,
      type: imageAsset.mimeType || getMimeTypeFromExtension(imageAsset.uri),
      name: imageAsset.safeName || generateSafeFilename(imageAsset.uri),
    });
  } else {
    // Para Web - vai precisar ser implementado de forma diferente
    console.warn('Upload de imagem via web precisa ser implementado');
  }

  return formData;
};

export default {
  pickImageFromLibrary,
  takePhoto,
  showImagePickerOptions,
  requestMediaLibraryPermissions,
  requestCameraPermissions,
  validateImageType,
  validateImageSize,
  prepareImageFormData,
};