require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseApp = null;

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      if (!fs.existsSync(serviceAccountPath)) {
        console.error(`Arquivo de service account não encontrado: ${serviceAccountPath}`);
        console.warn('Verifique se FIREBASE_SERVICE_ACCOUNT_PATH no .env está correto.');
        return null;
      }
      
      const serviceAccount = require(serviceAccountPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
      });
      console.log('Firebase Admin SDK inicializado com arquivo de service account');
    }
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
      });
      console.log('Firebase Admin SDK inicializado com chave de variável de ambiente');
    }
    else {
      const defaultPath = path.resolve(__dirname, '../../serviceAccountKey.json');
      if (fs.existsSync(defaultPath)) {
        const serviceAccount = require(defaultPath);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID
        });
        console.log('Firebase Admin SDK inicializado com arquivo padrão');
      } else {
        console.warn('Firebase não configurado. Configure FIREBASE_SERVICE_ACCOUNT_PATH no .env');
        console.warn('Ou coloque o arquivo serviceAccountKey.json na raiz do backend/');
        return null;
      }
    }

    return firebaseApp;
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error.message);
    console.error('Verifique se o arquivo de service account está correto.');
    return null;
  }
}

function getFirestore() {
  const app = initializeFirebase();
  return app ? admin.firestore() : null;
}

function getAuth() {
  const app = initializeFirebase();
  return app ? admin.auth() : null;
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  admin
};
