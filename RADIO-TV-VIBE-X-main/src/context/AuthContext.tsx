import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, signInWithEmailAndPassword, createUserWithEmailAndPassword, auth as firebaseAuth } from '../firebaseConfig';
import { signInWithGoogle, logout, onAuthChange } from '../firebaseConfig';

const ADMIN_EMAILS = ['3dma369@proton.me', '3dma369@gmail.com', 'carmencrispinneira@gmail.com'];

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isDonor: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setDonorStatus: (status: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDonor, setIsDonor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = !!currentUser && ADMIN_EMAILS.includes(currentUser.email?.toLowerCase() || '');

  // ── Friendly error translator (shared with toyverse + studio-M) ─────────
  const friendlyAuthError = (e: any): Error => {
    const code = e?.code || '';
    const msg = e?.message || 'Authentication failed';
    const map: Record<string, string> = {
      'auth/api-key-not-valid': '🚨 FIREBASE API KEY REVOKED — Google revoked the deployed API key. Go to Google Cloud Console → rotate + restrict the key → update Firebase env vars → redeploy. See SECURITY_DOCTRINE.md.',
      'auth/operation-not-allowed': '🚨 SIGN-IN METHOD DISABLED — Email/Password and/or Google sign-in is disabled in the Firebase Console. Go to Firebase Console → Authentication → Sign-in method → enable Email/Password and Google.',
      'auth/invalid-credential': 'Invalid email or password. Try again or click "Sign Up" to create an account.',
      'auth/wrong-password': 'Invalid email or password.',
      'auth/user-not-found': 'No account with that email. Click "Sign Up" to create one.',
      'auth/email-already-in-use': 'An account with that email already exists. Try signing in instead.',
      'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed. Try again.',
      'auth/popup-blocked': 'Sign-in popup was blocked. Allow popups for this site.',
      'auth/network-request-failed': 'Network error. Check your connection and try again.',
      'auth/too-many-requests': 'Too many failed attempts. Wait a few minutes and try again.',
      'auth/unauthorized-domain': '🚨 DOMAIN NOT WHITELISTED — This domain is not in the Firebase authorized domains list. Go to Firebase Console → Authentication → Settings → Authorized domains → add this domain.',
      'auth/configuration-not-found': '🚨 FIREBASE NOT CONFIGURED — Firebase project is missing auth config. Check .env or Firebase env vars.',
    };
    if (code === 'auth/api-key-not-valid' || msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      return new Error(map['auth/api-key-not-valid'] + ' [code: ' + code + ']');
    }
    if (code in map) return new Error(map[code] + ' [code: ' + code + ']');
    return new Error(`[${code}] ${msg}`);
  };

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      throw friendlyAuthError(error);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      throw friendlyAuthError(error);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      throw friendlyAuthError(error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDonor(false);
    } catch (error: any) {
      console.error("Logout error:", error);
      throw friendlyAuthError(error);
    }
  };

  const setDonorStatus = (status: boolean) => {
    setIsDonor(status);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser,
      isAuthenticated: !!currentUser,
      isDonor,
      isAdmin,
      isLoading,
      signInWithGoogle: handleSignInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout: handleLogout,
      setDonorStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
