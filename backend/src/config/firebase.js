const admin = require('firebase-admin');

// Inicializa Firebase Admin SDK
let firebaseApp = null;

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Verifica se há credenciais de service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Se a chave está em variável de ambiente (JSON string)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Para desenvolvimento local com arquivo de credenciais
      const serviceAccount = require('../../serviceAccountKey.json');
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });
    } else {
      console.warn('Firebase não configurado. Configure FIREBASE_PROJECT_ID e credenciais.');
      return null;
    }

    console.log('Firebase Admin SDK inicializado com sucesso');
    return firebaseApp;
  } catch (error) {
    console.error('Erro ao inicializar Firebase Admin SDK:', error.message);
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
