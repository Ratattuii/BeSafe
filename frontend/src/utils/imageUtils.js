/**
 * Utilitários simples para upload de imagens
 */

/**
 * Detecta o tipo MIME baseado na extensão do arquivo
 */
export const getMimeTypeFromExtension = (filename) => {
  const extension = filename.toLowerCase().split('.').pop();
  
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  
  return mimeTypes[extension] || 'image/jpeg';
};

/**
 * Valida extensão do arquivo de imagem
 */
export const validateImageExtension = (filename) => {
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return validExtensions.includes(extension);
};

/**
 * Gera nome de arquivo seguro para upload
 */
export const generateSafeFilename = (originalName, prefix = 'img') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName ? originalName.substring(originalName.lastIndexOf('.')) : '.jpg';
  
  return `${prefix}_${timestamp}_${random}${extension}`;
};
