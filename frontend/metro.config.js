// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Configuração do transformer para lidar melhor com imagens
// Isso ajuda a evitar erros do jimp-compact ao processar imagens corrompidas
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // Desabilita o processamento automático de imagens que pode causar erros
  assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
};

module.exports = config;

