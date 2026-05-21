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

  const handleSignInWithGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(firebaseAuth, email, password);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setIsDonor(false);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
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
