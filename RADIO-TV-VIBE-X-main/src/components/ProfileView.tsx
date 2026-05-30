import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, MapPin, CreditCard, History, Heart, Bell, Shield, ChevronRight,
  Plus, Edit2, Trash2, Check, X, Copy, ExternalLink, Loader2, Save
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import type { UserProfile } from '../types';

type Tab = 'profile' | 'addresses' | 'payments' | 'orders' | 'donations' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-4 h-4" /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'orders', label: 'Orders', icon: <History className="w-4 h-4" /> },
  { id: 'donations', label: 'Donations', icon: <Heart className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Bell className="w-4 h-4" /> },
];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
  'France', 'Spain', 'Italy', 'Netherlands', 'Japan', 'Mexico', 'Brazil', 'Other'
];

export default function ProfileView() {
  const { currentUser, logout } = useAuth();
  const { profile, isLoading, updateProfile, addShippingAddress, updateShippingAddress, removeShippingAddress, setDefaultShippingAddress, updateCryptoAddress } = useProfile();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editing, setEditing] = useState(false);

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home', fullName: '', addressLine1: '', addressLine2: '',
    city: '', state: '', zipCode: '', country: 'United States', phone: '', isDefault: false
  });

  // Crypto form state
  const [ethAddress, setEthAddress] = useState('');
  const [solAddress, setSolAddress] = useState('');
  const [btcAddress, setBtcAddress] = useState('');

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h2 className="text-2xl font-bold text-white">Sign In Required</h2>
          <p className="text-white/50">Please sign in to access your profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neon-green animate-spin" />
      </div>
    );
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({
        displayName: editName,
        phone: editPhone,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const startEditProfile = () => {
    setEditName(profile?.displayName || '');
    setEditPhone(profile?.phone || '');
    setEditing(true);
  };

  const handleAddAddress = async () => {
    await addShippingAddress(addressForm);
    setShowAddressForm(false);
    setAddressForm({ label: 'Home', fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'United States', phone: '', isDefault: false });
  };

  const handleEditAddress = (addr: typeof addressForm & { id: string }) => {
    setEditingAddressId(addr.id);
    setAddressForm({ label: addr.label, fullName: addr.fullName, addressLine1: addr.addressLine1, addressLine2: addr.addressLine2 || '', city: addr.city, state: addr.state, zipCode: addr.zipCode, country: addr.country, phone: addr.phone, isDefault: addr.isDefault });
    setShowAddressForm(true);
  };

  const handleUpdateAddress = async () => {
    if (!editingAddressId) return;
    await updateShippingAddress(editingAddressId, addressForm);
    setEditingAddressId(null);
    setShowAddressForm(false);
    setAddressForm({ label: 'Home', fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'United States', phone: '', isDefault: false });
  };

  const handleSaveCrypto = async () => {
    if (ethAddress) await updateCryptoAddress('ethereum', ethAddress);
    if (solAddress) await updateCryptoAddress('solana', solAddress);
    if (btcAddress) await updateCryptoAddress('bitcoin', btcAddress);
  };

  const handleToggleNotification = async (key: keyof NonNullable<UserProfile>['notifications']) => {
    if (!profile) return;
    await updateProfile({
      notifications: { ...profile.notifications, [key]: !profile.notifications[key] }
    });
  };

  return (
    <div className="min-h-screen bg-black pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-neon-green/20 flex items-center justify-center text-2xl font-bold text-neon-green overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (profile?.displayName || currentUser.email || 'U')[0].toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.displayName || 'Listener'}</h1>
            <p className="text-white/50 text-sm">{currentUser.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-neon-green text-black'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-white/80">Personal Info</h2>
                  {!editing ? (
                    <button onClick={startEditProfile} className="flex items-center gap-2 text-neon-green text-sm font-bold">
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 text-neon-green text-sm font-bold">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save
                      </button>
                      <button onClick={() => setEditing(false)} className="flex items-center gap-2 text-white/50 text-sm font-bold">
                        <X className="w-4 h-4" /> Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Display Name</label>
                    {editing ? (
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    ) : (
                      <p className="text-white">{profile?.displayName || '—'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Email</label>
                    <p className="text-white">{currentUser.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Phone</label>
                    {editing ? (
                      <input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+1 555 000 0000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    ) : (
                      <p className="text-white">{profile?.phone || '—'}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Member Since</label>
                    <p className="text-white">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Spent', value: `$${(profile?.totalSpent || 0).toFixed(2)}`, color: 'text-neon-blue' },
                  { label: 'Total Donated', value: `$${(profile?.totalDonated || 0).toFixed(2)}`, color: 'text-neon-pink' },
                  { label: 'Orders', value: profile?.orderHistory?.length || 0, color: 'text-neon-green' },
                  { label: 'Donations', value: profile?.donationHistory?.length || 0, color: 'text-neon-green' },
                ].map(stat => (
                  <div key={stat.label} className="glass rounded-2xl p-4 text-center">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-white/40 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ADDRESSES TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white/80">Shipping Addresses</h2>
                {!showAddressForm && (
                  <button onClick={() => { setShowAddressForm(true); setEditingAddressId(null); setAddressForm({ label: 'Home', fullName: '', addressLine1: '', addressLine2: '', city: '', state: '', zipCode: '', country: 'United States', phone: '', isDefault: false }); }}
                    className="flex items-center gap-2 bg-neon-green text-black px-4 py-2 rounded-xl text-sm font-bold">
                    <Plus className="w-4 h-4" /> Add Address
                  </button>
                )}
              </div>

              {showAddressForm && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-6 space-y-4">
                  <h3 className="font-bold text-white">{editingAddressId ? 'Edit Address' : 'New Address'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Label</label>
                      <select value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50">
                        <option>Home</option><option>Work</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Full Name</label>
                      <input value={addressForm.fullName} onChange={e => setAddressForm({ ...addressForm, fullName: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Address Line 1</label>
                      <input value={addressForm.addressLine1} onChange={e => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Address Line 2 (Optional)</label>
                      <input value={addressForm.addressLine2} onChange={e => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">City</label>
                      <input value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">State / Province</label>
                      <input value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">ZIP / Postal Code</label>
                      <input value={addressForm.zipCode} onChange={e => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Country</label>
                      <select value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50">
                        {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">Phone</label>
                      <input value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="+1 555 000 0000"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green/50" />
                    </div>
                    <div className="md:col-span-2 flex items-center gap-3">
                      <input type="checkbox" checked={addressForm.isDefault}
                        onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                        className="w-5 h-5 rounded" />
                      <span className="text-white text-sm">Set as default shipping address</span>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
                      className="flex items-center gap-2 bg-neon-green text-black px-6 py-3 rounded-xl font-bold">
                      <Check className="w-4 h-4" /> {editingAddressId ? 'Update' : 'Save'} Address
                    </button>
                    <button onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}
                      className="flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold">
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Address Cards */}
              {profile?.shippingAddresses?.length === 0 && !showAddressForm && (
                <div className="glass rounded-2xl p-12 text-center">
                  <MapPin className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No shipping addresses yet</p>
                  <p className="text-white/30 text-sm mt-1">Add an address for faster checkout</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.shippingAddresses?.map(addr => (
                  <div key={addr.id} className={`glass rounded-2xl p-5 relative ${addr.isDefault ? 'border-neon-green/50' : ''}`}>
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 text-xs font-bold text-neon-green bg-neon-green/10 px-2 py-1 rounded-lg">Default</span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-bold text-white">{addr.label}</span>
                    </div>
                    <p className="text-white/70 text-sm">{addr.fullName}</p>
                    <p className="text-white/50 text-sm">{addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}</p>
                    <p className="text-white/50 text-sm">{addr.city}, {addr.state} {addr.zipCode}</p>
                    <p className="text-white/50 text-sm">{addr.country}</p>
                    <p className="text-white/50 text-sm mt-1">📞 {addr.phone}</p>
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => handleEditAddress(addr as any)} className="text-neon-green text-sm font-bold flex items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      {!addr.isDefault && (
                        <button onClick={() => setDefaultShippingAddress(addr.id)} className="text-white/50 text-sm font-bold flex items-center gap-1">
                          Set Default
                        </button>
                      )}
                      <button onClick={() => removeShippingAddress(addr.id)} className="text-red-400/70 text-sm font-bold flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              {/* Crypto Addresses */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-neon-green/20 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-neon-green" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Crypto Wallets</h2>
                    <p className="text-white/40 text-xs">Your addresses for receiving payouts & donations</p>
                  </div>
                </div>

                {[
                  { chain: 'Ethereum / Polygon', symbol: 'ETH', key: 'eth', value: ethAddress || profile?.cryptoAddresses?.ethereum || '', set: setEthAddress, placeholder: '0x...' },
                  { chain: 'Solana', symbol: 'SOL', key: 'sol', value: solAddress || profile?.cryptoAddresses?.solana || '', set: setSolAddress, placeholder: 'Solana address...' },
                  { chain: 'Bitcoin', symbol: 'BTC', key: 'btc', value: btcAddress || profile?.cryptoAddresses?.bitcoin || '', set: setBtcAddress, placeholder: 'bc1q...' },
                ].map(crypto => (
                  <div key={crypto.key}>
                    <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1 block">{crypto.chain}</label>
                    <div className="flex gap-2">
                      <input value={crypto.value} onChange={e => crypto.set(e.target.value)} placeholder={crypto.placeholder}
                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-neon-green/50" />
                      {crypto.value && (
                        <button onClick={() => handleCopy(crypto.value, crypto.key)}
                          className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white transition-colors">
                          {copied === crypto.key ? <Check className="w-4 h-4 text-neon-green" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    {profile?.cryptoAddresses?.[crypto.key as keyof typeof profile.cryptoAddresses] && !crypto.value && (
                      <p className="text-neon-green/70 text-xs mt-1 font-mono truncate">
                        Saved: {profile.cryptoAddresses[crypto.key as keyof typeof profile.cryptoAddresses]}
                      </p>
                    )}
                  </div>
                ))}

                <button onClick={handleSaveCrypto} className="flex items-center gap-2 bg-neon-green text-black px-6 py-3 rounded-xl font-bold">
                  <Save className="w-4 h-4" /> Save Crypto Addresses
                </button>
              </div>

              {/* Stripe / Card (placeholder) */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-neon-blue/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-4 h-4 text-neon-blue" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Card Payments</h2>
                    <p className="text-white/40 text-xs">Secure card payments powered by Stripe</p>
                  </div>
                </div>
                {profile?.stripeCustomerId ? (
                  <div className="flex items-center gap-3 bg-neon-green/10 border border-neon-green/20 rounded-xl p-4">
                    <Check className="w-5 h-5 text-neon-green" />
                    <div>
                      <p className="text-white text-sm font-bold">Stripe Account Connected</p>
                      <p className="text-white/50 text-xs font-mono">{profile.stripeCustomerId}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">Card payment setup coming soon</p>
                    <p className="text-white/30 text-xs mt-1">Stripe integration in progress</p>
                  </div>
                )}
              </div>

              {/* Default Payment Method */}
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold text-white mb-3">Default Payment Method</h3>
                <div className="flex gap-3">
                  {(['card', 'crypto'] as const).map(method => (
                    <button key={method}
                      onClick={() => updateProfile({ defaultPaymentMethod: method })}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                        profile?.defaultPaymentMethod === method
                          ? 'bg-neon-green text-black'
                          : 'bg-white/5 text-white/50'
                      }`}>
                      {method === 'card' ? '💳 Card' : '₿ Crypto'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="font-bold text-white/80">Order History</h2>
              {profile?.orderHistory?.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No orders yet</p>
                  <p className="text-white/30 text-sm mt-1">Your purchase history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(profile?.orderHistory || []).map((orderId, i) => (
                    <div key={orderId} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-bold">Order #{orderId.slice(-8)}</p>
                        <p className="text-white/50 text-xs">Order details</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DONATIONS TAB */}
          {activeTab === 'donations' && (
            <div className="space-y-4">
              <h2 className="font-bold text-white/80">Donation History</h2>
              {profile?.donationHistory?.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50">No donations yet</p>
                  <p className="text-white/30 text-sm mt-1">Support VIBE-X and get exclusive perks</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(profile?.donationHistory || []).map((donation, i) => (
                    <div key={i} className="glass rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neon-pink/20 rounded-full flex items-center justify-center">
                          <Heart className="w-5 h-5 text-neon-pink" />
                        </div>
                        <div>
                          <p className="text-white font-bold">{donation.tier} — ${donation.amount}</p>
                          <p className="text-white/50 text-xs">{donation.status}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${donation.status === 'completed' ? 'bg-neon-green/10 text-neon-green' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {donation.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <a href="#/donate" className="block">
                <button className="w-full flex items-center justify-center gap-2 bg-neon-pink/20 border border-neon-pink/30 text-neon-pink py-4 rounded-xl font-bold hover:bg-neon-pink/30 transition-all">
                  <Heart className="w-5 h-5" /> Make a Donation
                </button>
              </a>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <h2 className="font-bold text-white/80">Notification Preferences</h2>
              {profile?.notifications && Object.entries(profile.notifications).map(([key, value]) => (
                <div key={key} className="glass rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-bold text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</p>
                    <p className="text-white/40 text-xs">{key}</p>
                  </div>
                  <button
                    onClick={() => handleToggleNotification(key as keyof NonNullable<UserProfile>['notifications'])}
                    className={`w-12 h-7 rounded-full relative transition-colors ${value ? 'bg-neon-green' : 'bg-white/20'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${value ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              ))}

              <div className="glass rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-white">Account</h3>
                <button onClick={logout} className="w-full text-left text-red-400/70 font-bold py-2 hover:text-red-400 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}