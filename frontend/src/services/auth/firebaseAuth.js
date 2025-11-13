import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '../../config/firebase';

/**
 * Serviço de autenticação Firebase
 */
class FirebaseAuthService {
  /**
   * Login com email e senha
   */
  async signInWithEmail(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user,
        token: await userCredential.user.getIdToken()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Registro com email e senha
   */
  async signUpWithEmail(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return {
        success: true,
        user: userCredential.user,
        token: await userCredential.user.getIdToken()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Login com Google
   */
  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      return {
        success: true,
        user: result.user,
        token: await result.user.getIdToken(),
        credential
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Logout
   */
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Observa mudanças no estado de autenticação
   */
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  }

  /**
   * Obtém o usuário atual
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Obtém token do usuário atual
   */
  async getCurrentUserToken() {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
}

export default new FirebaseAuthService();
