import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Zap, Shield, Globe, Copy, Check, ExternalLink, Wallet, X, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '../utils';
// @ts-ignore
import confetti from 'canvas-confetti';

import { useStation } from '../context/StationContext';

const DONATION_TIERS = [
  { id: '1', name: 'Supporter', amount: 5, perks: ['Discord Badge', 'Shoutout on Air'], icon: Zap, color: 'text-neon-blue' },
  { id: '2', name: 'Vibe Master', amount: 25, perks: ['Discord Badge', 'Shoutout on Air', '10% Merch Discount', 'Exclusive Mixes'], icon: Heart, color: 'text-neon-pink' },
  { id: '3', name: 'Legend', amount: 100, perks: ['Discord Badge', 'Shoutout on Air', '25% Merch Discount', 'Exclusive Mixes', 'Guest List Access'], icon: Shield, color: 'text-neon-green' },
];

const CRYPTO_ADDRESSES = [
  { name: 'Ethereum / Polygon', address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', icon: 'ETH' },
  { name: 'Solana', address: '7xKX8C2n2P4G6X7Y8Z9A1B2C3D4E5F6G7H8I9J0K', icon: 'SOL' },
  { name: 'Bitcoin', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', icon: 'BTC' },
];

export default function DonateView() {
  const { walletAddress, connectWallet, setDonorTier } = useStation();
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<typeof DONATION_TIERS[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
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
    setSelectedTier(tier);
    setIsModalOpen(true);
  };

  const handleCompleteDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;
    
    setIsProcessing(true);
    
    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const donorData = {
      walletAddress: walletAddress || 'Not Connected',
      name: donorName,
      discord: discordHandle,
      message: shoutoutMessage,
      tier: selectedTier.name,
      amount: selectedTier.amount,
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
                  <h3 className="text-2xl font-bold tracking-tighter uppercase">Join as {selectedTier.name}</h3>
                  <p className="text-neon-green text-sm font-bold">${selectedTier.amount} One-time Donation</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:text-neon-green transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {!walletAddress ? (
                <div className="text-center py-6">
                  <Wallet className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-sm text-white/50 mb-6">Please connect your wallet first to secure your membership and perks.</p>
                  <button 
                    onClick={connectWallet}
                    className="bg-neon-green text-black px-8 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto"
                  >
                    CONNECT WALLET
                  </button>
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
                    <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Payment Information</h4>
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                      <CreditCard className="w-6 h-6 text-white/20" />
                      <div className="flex-grow">
                        <p className="text-xs font-bold">Secure Mock Payment</p>
                        <p className="text-[10px] text-white/30 truncate">Using Wallet: {walletAddress}</p>
                      </div>
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
