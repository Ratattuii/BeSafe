const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

// Cria os diretórios de uploads se não existirem
const uploadDirs = {
  avatars: path.join(__dirname, '../../uploads/avatars'),
  needs: path.join(__dirname, '../../uploads/needs'),
  institutions: path.join(__dirname, '../../uploads/institutions'),
  donations: path.join(__dirname, '../../uploads/donations'),
};

Object.values(uploadDirs).forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuração do multer para diferentes tipos de upload
const createStorage = (uploadPath, prefix) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      // Gera nome único: timestamp + random + extensão original
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, prefix + '-' + uniqueSuffix + extension);
    }
  });
};

// Storages para diferentes tipos de arquivo
const avatarStorage = createStorage(uploadDirs.avatars, 'avatar');
const needStorage = createStorage(uploadDirs.needs, 'need');
const institutionStorage = createStorage(uploadDirs.institutions, 'institution');
const donationStorage = createStorage(uploadDirs.donations, 'donation');

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos'), false);
  }
};

// Configurações do multer para diferentes tipos
const avatarUpload = multer({
  storage: avatarStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

const needUpload = multer({
  storage: needStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

const institutionUpload = multer({
  storage: institutionStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

const donationUpload = multer({
  storage: donationStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  }
});

/**
 * Middleware para upload de avatar
 */
const uploadAvatar = avatarUpload.single('avatar');

/**
 * Middleware personalizado para tratar erros de upload
 */
function handleUploadError(req, res, next) {
  uploadAvatar(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Arquivo muito grande. Máximo 5MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Erro no upload: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Se chegou até aqui, upload ok ou sem arquivo
    next();
  });
}

/**
 * Middleware para upload de múltiplas imagens de necessidades
 */
const uploadNeedImages = needUpload.array('images', 5); // Até 5 imagens

/**
 * Middleware para upload de logo de instituição
 */
const uploadInstitutionLogo = institutionUpload.single('logo');

/**
 * Middleware para upload de comprovante de doação
 */
const uploadDonationProof = donationUpload.array('proofs', 3); // Até 3 comprovantes

/**
 * Middleware personalizado para tratar erros de upload múltiplo
 */
function handleMultipleUploadError(req, res, next) {
  uploadNeedImages(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Arquivo muito grande. Máximo 5MB por imagem.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Máximo de 5 imagens permitidas.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'Erro no upload: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    // Se chegou até aqui, upload ok ou sem arquivo
    next();
  });
}

/**
 * Remove um arquivo do sistema
 * @param {string} filePath - Caminho do arquivo
 */
function deleteFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log('Arquivo removido:', filePath);
    } catch (error) {
      console.error('Erro ao remover arquivo:', error.message);
    }
  }
}

module.exports = {
  handleUploadError,
  handleMultipleUploadError,
  uploadNeedImages,
  uploadInstitutionLogo,
  uploadDonationProof,
  deleteFile
};
