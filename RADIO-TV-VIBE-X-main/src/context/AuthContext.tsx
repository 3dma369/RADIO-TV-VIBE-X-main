import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  verify: (code: string) => Promise<void>;
  logout: () => void;
  updateCredentials: (email: string, password: string) => Promise<void>;
  user: { email: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [credentials, setCredentials] = useState({ email: 'admin@vibe-x.radio', password: 'admin123' });

  const login = async (email: string, password: string) => {
    // Simulated login logic
    if (email === credentials.email && password === credentials.password) {
      setUser({ email });
      // Simulate sending verification code
      console.log('Verification code sent to:', email);
    } else {
      throw new Error('Invalid credentials');
    }
  };

  const verify = async (code: string) => {
    // Simulated verification logic
    if (code === '123456') {
      setIsVerified(true);
    } else {
      throw new Error('Invalid verification code');
    }
  };

  const logout = () => {
    setUser(null);
    setIsVerified(false);
  };

  const updateCredentials = async (email: string, password: string) => {
    // Simulated update logic
    setCredentials({ email, password });
    setUser({ email });
    setIsVerified(false); // Require re-verification after credential change
    console.log('Credentials updated. New verification code sent to:', email);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      isVerified, 
      login, 
      verify, 
      logout, 
      updateCredentials,
      user 
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
