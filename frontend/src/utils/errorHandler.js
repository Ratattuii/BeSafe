/**
 * Utilitários para tratamento global de erros
 */

/**
 * Trata erros relacionados ao upload de imagens
 */
export const handleImageError = (error) => {
  console.warn('Erro de imagem tratado:', error.message);
  
  // Erros comuns de upload
  if (error.message.includes('Network request failed')) {
    console.warn('Erro de rede no upload - verifique conexão');
    return { handled: true, message: 'Erro de conexão. Verifique sua internet.' };
  }
  
  if (error.message.includes('File too large')) {
    console.warn('Arquivo muito grande para upload');
    return { handled: true, message: 'Imagem muito grande. Máximo 5MB.' };
  }
  
  if (error.message.includes('Invalid file type')) {
    console.warn('Tipo de arquivo inválido');
    return { handled: true, message: 'Tipo de arquivo não suportado.' };
  }
  
  return { handled: false };
};

/**
 * Wrapper seguro para operações de upload
 */
export const safeUploadOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    const handled = handleImageError(error);
    if (handled.handled) {
      throw new Error(handled.message);
    }
    throw error;
  }
};

/**
 * Configurar tratamento global de erros não capturados
 */
export const setupGlobalErrorHandling = () => {
  // Para React Native
  if (typeof global !== 'undefined' && global.ErrorUtils) {
    const originalHandler = global.ErrorUtils.getGlobalHandler();
    
    global.ErrorUtils.setGlobalHandler((error, isFatal) => {
      const handled = handleImageError(error);
      
      if (!handled.handled) {
        // Se não foi um erro de imagem tratável, usar handler original
        if (originalHandler) {
          originalHandler(error, isFatal);
        } else {
          console.error('Erro global não tratado:', error);
        }
      }
    });
  }
  
  // Para Web
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && typeof event.reason === 'object') {
        const handled = handleImageError(event.reason);
        if (handled.handled) {
          event.preventDefault();
        }
      }
    });
  }
};