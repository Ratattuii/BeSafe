const fs = require('fs');
const path = require('path');

const validPNGBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const assetsDir = path.join(__dirname, '../assets');
const images = [
  'icon.png',
  'splash.png',
  'adaptive-icon.png',
  'favicon.png'
];

console.log('Criando imagens PNG placeholder válidas...');

images.forEach(imageName => {
  const imagePath = path.join(assetsDir, imageName);
  const imageBuffer = Buffer.from(validPNGBase64, 'base64');
  
  try {
    fs.writeFileSync(imagePath, imageBuffer);
    console.log(`✅ Criado: ${imageName}`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${imageName}:`, error.message);
  }
});

console.log('\n✅ Todas as imagens placeholder foram criadas!');
console.log('Agora você pode substituí-las por imagens reais quando necessário.');

