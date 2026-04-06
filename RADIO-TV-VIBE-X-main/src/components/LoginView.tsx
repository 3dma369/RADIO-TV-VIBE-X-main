import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils';

export default function LoginView() {
  const { login, verify, isAuthenticated, isVerified } = useAuth();
  const [step, setStep] = useState<'login' | 'verify'>(isAuthenticated && !isVerified ? 'verify' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/admin';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setStep('verify');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verify(code);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[40px] p-10 w-full max-w-md relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/10 blur-3xl -mr-16 -mt-16" />
        
        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-neon-green/20 flex items-center justify-center text-neon-green mb-8 mx-auto">
            {step === 'login' ? <Lock className="w-8 h-8" /> : <ShieldCheck className="w-8 h-8" />}
          </div>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tighter uppercase mb-2">
              {step === 'login' ? 'Admin Access' : 'Verify Identity'}
            </h2>
            <p className="text-white/40 text-sm">
              {step === 'login' 
                ? 'Enter your credentials to manage VIBE-X' 
                : `We've sent a code to ${email}`}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@vibe-x.radio"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-bold text-center uppercase tracking-widest">{error}</p>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-neon-green text-black py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,0,0.2)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      CONTINUE
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-white/20 font-mono">HINT: admin@vibe-x.radio / admin123</p>
              </motion.form>
            ) : (
              <motion.form
                key="verify-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerify}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-4">Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:border-neon-green/50 transition-colors"
                  />
                </div>

                {error && (
                  <p className="text-red-500 text-xs font-bold text-center uppercase tracking-widest">{error}</p>
                )}

                <button
                  disabled={loading}
                  type="submit"
                  className="w-full bg-neon-green text-black py-4 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(0,255,0,0.2)] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      VERIFY & ENTER
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-white/20 font-mono">HINT: 123456</p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
