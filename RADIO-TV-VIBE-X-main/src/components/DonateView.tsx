import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Zap, Shield, Globe, Copy, Check, ExternalLink, Wallet, X, CreditCard, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '../utils';
// @ts-ignore
import confetti from 'canvas-confetti';

import { useStation } from '../context/StationContext';
import { useAuth } from '../context/AuthContext';

const DONATION_TIERS = [
  { id: '1', name: 'Supporter', amount: 5, perks: ['Discord Badge', 'Shoutout on Air'], icon: Zap, color: 'text-neon-blue' },
  { id: '2', name: 'Vibe Master', amount: 25, perks: ['Discord Badge', 'Shoutout on Air', '10% Merch Discount', 'Exclusive Mixes'], icon: Heart, color: 'text-neon-pink' },
  { id: '3', name: 'Legend', amount: 100, perks: ['Discord Badge', 'Shoutout on Air', '25% Merch Discount', 'Exclusive Mixes', 'Guest List Access'], icon: Shield, color: 'text-neon-green' },
];

const CRYPTO_ADDRESSES = [
  { name: 'Ethereum / Línea / Polygon', address: '0xa6898b0E7d169bFCD53d92287A7034828E7F46E9', icon: 'ETH' },
  { name: 'Bitcoin', address: 'bc1q0zfd97g0gcy96hhmsdqgzrsjcn52y733xvj2rn', icon: 'BTC' },
  { name: 'Solana', address: '5ubc3KwrWZX5sxjZLx6JwgAXDnreYnjzWARAxPKzLJFG', icon: 'SOL' },
  { name: 'Tron', address: 'TMkmBx9WyAPmLbeGivsmhx3fCQxaMExF4p', icon: 'TRX' },
];

// Google SVG icon
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function DonateView() {
  const { walletAddress, walletNetwork, walletBalance, walletConnecting, walletError, connectWallet, sendNativeDonation, setDonorTier } = useStation();
  const { currentUser, isAuthenticated, isDonor, signInWithGoogle } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<typeof DONATION_TIERS[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form state
  const [donorName, setDonorName] = useState('');
  const [discordHandle, setDiscordHandle] = useState('');
  const [shoutoutMessage, setShoutoutMessage] = useState('');

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleTierSelect = (tier: typeof DONATION_TIERS[0]) => {
    // If not logged in, prompt login first
    if (!isAuthenticated) {
      setSelectedTier(tier);
      setIsModalOpen(true);
      return;
    }
    setSelectedTier(tier);
    setIsModalOpen(true);
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
      // After login, the modal stays open and user can proceed with donation
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCompleteDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;

    setIsProcessing(true);
    setTxHash(null);

    // Vibe-X treasury address (Ethereum / EVM)
    const TREASURY_ADDRESS = '0xa6898b0E7d169bFCD53d92287A7034828E7F46E9';

    // If user has MetaMask connected, fire a real on-chain transaction
    let hash: string | null = null;
    const ethPriceUsd = 3000; // TODO: pull live price from oracle; static for now
    const amountEth = (selectedTier.amount / ethPriceUsd).toFixed(6);

    if (walletAddress && (window as any).ethereum) {
      try {
        hash = await sendNativeDonation(TREASURY_ADDRESS, amountEth);
        setTxHash(hash);
      } catch (err: any) {
        setIsProcessing(false);
        alert(`Donation failed: ${err?.message || err}\n\nYou can still copy our wallet address and send manually.`);
        return;
      }
    }

    const donorData = {
      walletAddress: walletAddress || 'Not Connected',
      name: donorName,
      discord: discordHandle,
      message: shoutoutMessage,
      tier: selectedTier.name,
      amount: selectedTier.amount,
      txHash: hash,
      network: walletNetwork || null,
      timestamp: Date.now()
    };

    try {
      await fetch('/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(donorData)
      });

      setDonorTier(selectedTier.name);

      confetti({
        particleCount: 200,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#00FF00', '#FF00FF', '#00FFFF']
      });

      setIsModalOpen(false);
      setIsProcessing(false);
      setSelectedTier(null);
      setDonorName('');
      setDiscordHandle('');
      setShoutoutMessage('');
      
      alert(`LEGEND! Thank you for supporting VIBE-X at the ${selectedTier.name} level. Your perks are now active!`);
    } catch (error) {
      console.error('Donation sync failed', error);
      setIsProcessing(false);
      alert('Payment processing failed. Please try again.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="px-6 pb-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 neon-text uppercase">Support the Vibe</h2>
          <p className="text-white/50 max-w-2xl mx-auto text-lg">
            VIBE-X is community-funded. Your support keeps the servers running, the DJs playing, and the underground alive.
          </p>
        </div>

        {/* Show donor badge if already donated */}
        {isDonor && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 glass rounded-full border-neon-green/30">
              <CheckCircle className="w-5 h-5 text-neon-green" />
              <span className="text-neon-green font-bold text-sm uppercase tracking-widest">You're a Legend Supporter!</span>
            </div>
          </div>
        )}

        {/* Donation Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {DONATION_TIERS.map((tier) => (
            <div key={tier.id} className="glass rounded-3xl p-8 flex flex-col group hover:border-neon-green/30 transition-all">
              <div className={cn("w-16 h-16 rounded-2xl glass flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", tier.color)}>
                <tier.icon className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2 uppercase tracking-tight">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold tracking-tighter">${tier.amount}</span>
                <span className="text-white/30 text-sm font-bold uppercase tracking-widest">/ month</span>
              </div>
              <ul className="space-y-4 mb-10 flex-grow">
                {tier.perks.map((perk, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-white/60">
                    <div className="w-1.5 h-1.5 bg-neon-green rounded-full" />
                    {perk}
                  </li>
                ))}
              </ul>
              <button 
                onClick={() => handleTierSelect(tier)}
                className="w-full py-4 rounded-2xl font-bold bg-white/5 border border-white/10 hover:bg-neon-green hover:text-black hover:border-neon-green transition-all uppercase tracking-widest text-xs"
              >
                Choose Tier
              </button>
            </div>
          ))}
        </div>

        {/* Web3 Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="glass rounded-[40px] p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-green/10 blur-[100px] -mr-32 -mt-32" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="w-8 h-8 text-neon-green" />
                <h3 className="text-3xl font-bold tracking-tighter uppercase">Web3 Donations</h3>
              </div>
              <p className="text-white/50 mb-10">Prefer crypto? Send your support directly to our treasury addresses. We accept major tokens on multiple chains.</p>
              
              <div className="space-y-4">
                {CRYPTO_ADDRESSES.map((crypto) => (
                  <div key={crypto.name} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl glass flex items-center justify-center font-bold text-xs text-white/40">
                        {crypto.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{crypto.name}</p>
                        <p className="text-sm font-mono text-white/80 truncate max-w-[150px] md:max-w-[250px]">{crypto.address}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleCopy(crypto.address)}
                      className="p-3 glass rounded-xl hover:text-neon-green transition-all"
                    >
                      {copied === crypto.address ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-neon-blue/20 flex items-center justify-center text-neon-blue">
                  <Globe className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold uppercase tracking-tight">Global Impact</h4>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Your donations help us license music from independent artists, upgrade our streaming hardware, and host community events worldwide. Every bit helps us stay independent and ad-free.
              </p>
            </div>
            
            <div className="glass rounded-3xl p-8 border-neon-pink/20">
              <div className="flex items-center gap-4 mb-6 text-neon-pink">
                <Heart className="w-6 h-6 fill-current" />
                <h4 className="text-xl font-bold uppercase tracking-tight">Supporter Wall</h4>
              </div>
              <div className="flex flex-wrap gap-3">
                {['Alice_X', 'BobTheBuilder', 'CryptoKing', 'JungleJim', 'BassQueen', 'LoungeLizard', 'TechnoTom'].map((name) => (
                  <span key={name} className="px-3 py-1 glass rounded-full text-[10px] font-bold uppercase tracking-widest text-white/40">
                    {name}
                  </span>
                ))}
                <span className="px-3 py-1 border border-dashed border-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/20">
                  + 142 others
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Donation Modal */}
      <AnimatePresence>
        {isModalOpen && selectedTier && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg h-fit glass rounded-[40px] p-8 z-[110] shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold tracking-tighter uppercase">
                    {isAuthenticated ? `Join as ${selectedTier.name}` : 'Sign In to Continue'}
                  </h3>
                  <p className="text-neon-green text-sm font-bold">${selectedTier.amount} One-time Donation</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:text-neon-green transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!isAuthenticated ? (
                <div className="text-center py-6 space-y-6">
                  <p className="text-white/50 text-sm">Create your account to securely process your donation and unlock your perks.</p>
                  <button 
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="w-full bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    {isLoggingIn ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <GoogleIcon />
                        CONTINUE WITH GOOGLE
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-white/20 font-mono">Your account is created automatically on sign-in. No password needed.</p>
                </div>
              ) : (
                <form onSubmit={handleCompleteDonation} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Public Name (for the Wall)</label>
                    <input 
                      value={donorName} 
                      onChange={e => setDonorName(e.target.value)} 
                      required 
                      placeholder="e.g. BassHead_99"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Discord Handle (for Badge)</label>
                    <input 
                      value={discordHandle} 
                      onChange={e => setDiscordHandle(e.target.value)} 
                      required 
                      placeholder="e.g. vibe_master#1234"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Shoutout Message</label>
                    <textarea 
                      value={shoutoutMessage} 
                      onChange={e => setShoutoutMessage(e.target.value)} 
                      rows={2}
                      placeholder="Show some love to the station..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50 resize-none" 
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 mt-6">
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Web3 Wallet</h4>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      {walletAddress ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 font-black text-[10px]">MM</div>
                            <div className="flex-grow">
                              <p className="text-xs font-bold text-white/90 font-mono">{walletAddress.slice(0, 8)}…{walletAddress.slice(-6)}</p>
                              <p className="text-[10px] text-neon-green">
                                Connected via MetaMask{walletNetwork ? ` • ${walletNetwork}` : ''}{walletBalance ? ` • ${walletBalance} ETH` : ''}
                              </p>
                            </div>
                          </div>
                          {txHash && (
                            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="block text-[10px] text-neon-blue hover:underline font-mono truncate">
                              ✓ Tx: {txHash}
                            </a>
                          )}
                          <p className="text-[9px] text-white/30">Click CONFIRM &amp; DONATE to send {selectedTier ? (selectedTier.amount / 3000).toFixed(6) : '0'} ETH from your wallet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-6 h-6 text-white/20" />
                            <div className="flex-grow">
                              <p className="text-xs font-bold">No wallet connected</p>
                              <p className="text-[10px] text-white/30">Install MetaMask for one-click crypto donations</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => connectWallet()}
                            disabled={walletConnecting}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {walletConnecting ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> CONNECTING…</>
                            ) : (
                              <>🦊 Connect MetaMask</>
                            )}
                          </button>
                          {walletError && <p className="text-[10px] text-red-400">{walletError}</p>}
                          <p className="text-[9px] text-white/30 text-center">
                            Or use the wallet addresses on the donate page (BTC / SOL / TRX supported too)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full bg-neon-green text-black py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> PROCESSING...</>
                    ) : (
                      <>CONFIRM & DONATE ${selectedTier.amount}</>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}