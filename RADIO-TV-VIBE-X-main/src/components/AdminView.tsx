import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  Users, 
  Video, 
  Music, 
  TrendingUp, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  Activity,
  DollarSign,
  Eye,
  LogOut,
  Settings,
  Shield,
  Mail,
  Lock,
  X,
  Image as ImageIcon,
  Clock,
  User,
  Check,
  Loader2,
  Heart
} from 'lucide-react';
import { cn } from '../utils';
// @ts-ignore
// @ts-ignore
import confetti from 'canvas-confetti';

import { useAuth } from '../context/AuthContext';
import { useStation } from '../context/StationContext';
import { Product, DJ, ScheduleEntry, Track } from '../types';

type Tab = 'metrics' | 'shop' | 'schedule' | 'djs' | 'stream' | 'donors' | 'settings';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<Tab>('metrics');
  const { logout } = useAuth();
  const { isLoading } = useStation();

  const tabs = [
    { id: 'metrics', name: 'Metrics', icon: TrendingUp },
    { id: 'shop', name: 'Shop', icon: ShoppingBag },
    { id: 'schedule', name: 'Schedule', icon: Calendar },
    { id: 'djs', name: 'DJs', icon: Users },
    { id: 'stream', name: 'Stream', icon: Video },
    { id: 'donors', name: 'Donors', icon: Heart },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-neon-green" />
          <p className="text-xs font-bold text-white/40 uppercase tracking-[0.2em]">Initializing Station Data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="px-6 pb-20"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="glass rounded-3xl p-4 sticky top-24">
              <div className="flex items-center gap-3 px-4 py-6 mb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-xl bg-neon-green/20 flex items-center justify-center text-neon-green">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-sm uppercase tracking-widest">Admin</h2>
                  <p className="text-[10px] text-white/40 font-mono">STATION OWNER</p>
                </div>
              </div>
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      activeTab === tab.id 
                        ? "bg-neon-green text-black shadow-[0_0_20px_rgba(0,255,0,0.2)]" 
                        : "text-white/60 hover:bg-white/5"
                    )}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                ))}
                
                <div className="pt-4 mt-4 border-t border-white/10">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-grow">
            <div className="glass rounded-[40px] p-8 min-h-[600px]">
              {activeTab === 'metrics' && <MetricsDashboard />}
              {activeTab === 'shop' && <ShopManager />}
              {activeTab === 'schedule' && <ScheduleManager />}
              {activeTab === 'djs' && <DJManager />}
              {activeTab === 'stream' && <StreamManager />}
              {activeTab === 'donors' && <DonorManager />}
              {activeTab === 'settings' && <SettingsManager />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricsDashboard() {
  const stats = [
    { name: 'Total Listeners', value: '42.8k', change: '+12%', icon: Users, color: 'text-neon-blue' },
    { name: 'Avg. Session', value: '48m', change: '+5%', icon: Activity, color: 'text-neon-pink' },
    { name: 'Revenue', value: '$12,450', change: '+18%', icon: DollarSign, color: 'text-neon-green' },
    { name: 'Page Views', value: '156k', change: '+24%', icon: Eye, color: 'text-white' },
  ];

  return (
    <div className="space-y-8">
      <h3 className="text-3xl font-bold tracking-tighter uppercase mb-8">Station Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className={cn("w-10 h-10 rounded-xl glass flex items-center justify-center mb-4", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1">{stat.name}</p>
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
              <span className="text-[10px] font-bold text-neon-green">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass rounded-3xl p-8 h-64 flex items-center justify-center text-white/20 border-dashed border-2">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-mono text-xs uppercase tracking-[0.2em]">Real-time listener chart placeholder</p>
        </div>
      </div>
    </div>
  );
}

function FileUpload({ onUpload, label, accept = "image/*" }: { onUpload: (url: string, file?: File) => void, label: string, accept?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 50MB for IndexedDB safety
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50MB)');
      return;
    }

    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpload(reader.result as string, file);
      setLoading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center ml-4">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</label>
        {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</span>}
      </div>
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-neon-green/50 transition-all group",
          error && "border-red-500/50"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept={accept} 
          className="hidden" 
        />
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-neon-green" />
        ) : (
          <>
            <Plus className="w-6 h-6 text-white/20 group-hover:text-neon-green transition-colors mb-2" />
            <span className="text-[10px] font-bold text-white/30 group-hover:text-white/50 uppercase tracking-widest">Upload File</span>
          </>
        )}
      </div>
    </div>
  );
}

function DeleteButton({ onDelete, confirmMessage, onConfirmingChange }: { onDelete: () => void, confirmMessage: string, onConfirmingChange?: (isConfirming: boolean) => void }) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirmStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(true);
    onConfirmingChange?.(true);
  };

  const handleConfirmCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirming(false);
    onConfirmingChange?.(false);
  };

  const handleConfirmAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
    setIsConfirming(false);
    onConfirmingChange?.(false);
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mr-2">Sure?</span>
        <button 
          onClick={handleConfirmAction}
          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
          title="Confirm Delete"
        >
          <Check className="w-4 h-4" />
        </button>
        <button 
          onClick={handleConfirmCancel}
          className="p-2 glass rounded-lg hover:bg-white/10 transition-all"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleConfirmStart}
      className="p-2 glass rounded-lg hover:text-red-500 transition-all group/del"
      title={confirmMessage}
    >
      <Trash2 className="w-4 h-4 group-hover/del:scale-110 transition-transform" />
    </button>
  );
}

function ShopManager() {
  const { products, updateProducts } = useStation();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      image: uploadedImageUrl || formData.get('image') as string,
      category: formData.get('category') as Product['category'],
    };

    if (editingProduct) {
      updateProducts(products.map(p => p.id === editingProduct.id ? productData : p));
    } else {
      updateProducts([...products, productData]);
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    setUploadedImageUrl('');
  };

  const handleDelete = (id: string) => {
    updateProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-bold tracking-tighter uppercase">Manage Products</h3>
        <button 
          onClick={() => { setEditingProduct(null); setUploadedImageUrl(''); setIsModalOpen(true); }}
          className="bg-neon-green text-black px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ADD PRODUCT
        </button>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img src={product.image} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
              <div>
                <h4 className="font-bold text-sm">{product.name}</h4>
                <p className="text-xs text-white/40">${product.price} • {product.category}</p>
              </div>
            </div>
            <div className={cn(
              "flex gap-2 items-center transition-opacity",
              confirmingId === product.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <button 
                onClick={() => { setEditingProduct(product); setUploadedImageUrl(product.image); setIsModalOpen(true); }}
                className="p-2 glass rounded-lg hover:text-neon-green transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <DeleteButton 
                onDelete={() => handleDelete(product.id)} 
                confirmMessage="Delete Product" 
                onConfirmingChange={(isConfirming) => setConfirmingId(isConfirming ? product.id : null)}
              />
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Product Name</label>
            <input name="name" defaultValue={editingProduct?.name} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Price ($)</label>
              <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Category</label>
              <select name="category" defaultValue={editingProduct?.category || 'apparel'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50">
                <option value="apparel">Apparel</option>
                <option value="accessories">Accessories</option>
                <option value="digital">Digital</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Image URL</label>
              <input 
                name="image" 
                value={uploadedImageUrl} 
                onChange={(e) => setUploadedImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
              />
            </div>
            <FileUpload label="Or Upload Image" onUpload={setUploadedImageUrl} />
          </div>

          {uploadedImageUrl && (
            <div className="mt-2 flex justify-center">
              <img src={uploadedImageUrl} className="w-20 h-20 rounded-xl object-cover border border-white/10" referrerPolicy="no-referrer" />
            </div>
          )}

          <button type="submit" className="w-full bg-neon-green text-black py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> SAVE PRODUCT
          </button>
        </form>
      </Modal>
    </div>
  );
}

function ScheduleManager() {
  const { schedule, updateSchedule, djs } = useStation();
  const [editingSlot, setEditingSlot] = useState<ScheduleEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const slotData: ScheduleEntry = {
      id: editingSlot?.id || Date.now().toString(),
      day: formData.get('day') as string,
      time: formData.get('time') as string,
      djId: formData.get('djId') as string,
      showName: formData.get('showName') as string,
    };

    if (editingSlot) {
      updateSchedule(schedule.map(s => s.id === editingSlot.id ? slotData : s));
    } else {
      updateSchedule([...schedule, slotData]);
    }
    setIsModalOpen(false);
    setEditingSlot(null);
  };

  const handleDelete = (id: string) => {
    updateSchedule(schedule.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-bold tracking-tighter uppercase">Weekly Schedule</h3>
        <button 
          onClick={() => { setEditingSlot(null); setIsModalOpen(true); }}
          className="bg-neon-green text-black px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ADD SLOT
        </button>
      </div>

      <div className="space-y-4">
        {days.map((day) => {
          const daySlots = schedule.filter(s => s.day === day);
          if (daySlots.length === 0) return null;
          return (
            <div key={day} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h4 className="font-bold text-neon-green uppercase tracking-widest text-sm mb-4">{day}</h4>
              <div className="space-y-3">
                {daySlots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between text-sm glass p-3 rounded-xl">
                    <div className="flex items-center gap-4">
                      <Clock className="w-4 h-4 text-white/30" />
                      <span>{slot.time} • {slot.showName} ({djs.find(d => d.id === slot.djId)?.name})</span>
                    </div>
                    <div className={cn(
                      "flex gap-2 items-center transition-opacity",
                      confirmingId === slot.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}>
                      <button onClick={() => { setEditingSlot(slot); setIsModalOpen(true); }} className="hover:text-neon-green p-2"><Edit2 className="w-3 h-3" /></button>
                      <DeleteButton 
                        onDelete={() => handleDelete(slot.id)} 
                        confirmMessage="Delete Slot" 
                        onConfirmingChange={(isConfirming) => setConfirmingId(isConfirming ? slot.id : null)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSlot ? "Edit Slot" : "Add Slot"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Day</label>
              <select name="day" defaultValue={editingSlot?.day || 'Monday'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50">
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Time</label>
              <input name="time" placeholder="20:00 - 22:00" defaultValue={editingSlot?.time} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Show Name</label>
            <input name="showName" defaultValue={editingSlot?.showName} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">DJ</label>
            <select name="djId" defaultValue={editingSlot?.djId || djs[0]?.id} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50">
              {djs.map(dj => <option key={dj.id} value={dj.id}>{dj.name}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-neon-green text-black py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> SAVE SLOT
          </button>
        </form>
      </Modal>
    </div>
  );
}

function DJManager() {
  const { djs, updateDJs } = useStation();
  const [editingDJ, setEditingDJ] = useState<DJ | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const djData: DJ = {
      id: editingDJ?.id || Date.now().toString(),
      name: formData.get('name') as string,
      bio: formData.get('bio') as string,
      image: uploadedImageUrl || formData.get('image') as string,
      specialty: formData.get('specialty') as string,
      socials: {
        twitter: formData.get('twitter') as string,
        instagram: formData.get('instagram') as string,
        soundcloud: formData.get('soundcloud') as string,
      }
    };

    if (editingDJ) {
      updateDJs(djs.map(d => d.id === editingDJ.id ? djData : d));
    } else {
      updateDJs([...djs, djData]);
    }
    setIsModalOpen(false);
    setEditingDJ(null);
    setUploadedImageUrl('');
  };

  const handleDelete = (id: string) => {
    updateDJs(djs.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-3xl font-bold tracking-tighter uppercase">DJ Roster</h3>
        <button 
          onClick={() => { setEditingDJ(null); setUploadedImageUrl(''); setIsModalOpen(true); }}
          className="bg-neon-green text-black px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ADD DJ
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {djs.map((dj) => (
          <div key={dj.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={dj.image} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div>
                <span className="font-bold text-sm block">{dj.name}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest">{dj.specialty}</span>
              </div>
            </div>
            <div className={cn(
              "flex gap-2 items-center transition-opacity",
              confirmingId === dj.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              <button onClick={() => { setEditingDJ(dj); setUploadedImageUrl(dj.image); setIsModalOpen(true); }} className="p-2 glass rounded-lg hover:text-neon-green"><Edit2 className="w-4 h-4" /></button>
              <DeleteButton 
                onDelete={() => handleDelete(dj.id)} 
                confirmMessage="Remove DJ" 
                onConfirmingChange={(isConfirming) => setConfirmingId(isConfirming ? dj.id : null)}
              />
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDJ ? "Edit DJ" : "Add DJ"}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Name</label>
              <input name="name" defaultValue={editingDJ?.name} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Specialty</label>
              <input name="specialty" defaultValue={editingDJ?.specialty} placeholder="Jungle / DnB" required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bio</label>
            <textarea name="bio" defaultValue={editingDJ?.bio} required rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50 resize-none" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Image URL</label>
              <input 
                name="image" 
                value={uploadedImageUrl} 
                onChange={(e) => setUploadedImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
              />
            </div>
            <FileUpload label="Or Upload Photo" onUpload={setUploadedImageUrl} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Twitter</label>
              <input name="twitter" defaultValue={editingDJ?.socials.twitter} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-neon-green/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Instagram</label>
              <input name="instagram" defaultValue={editingDJ?.socials.instagram} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-neon-green/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">SoundCloud</label>
              <input name="soundcloud" defaultValue={editingDJ?.socials.soundcloud} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-neon-green/50" />
            </div>
          </div>
          <button type="submit" className="w-full bg-neon-green text-black py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> SAVE DJ
          </button>
        </form>
      </Modal>
    </div>
  );
}

function StreamManager() {
  const { streamSource, updateStreamSource, playlist, updatePlaylist } = useStation();
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string>('');
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string>('');
  const [uploadedVisualUrl, setUploadedVisualUrl] = useState<string>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackDuration, setTrackDuration] = useState('');
  const [trackGenre, setTrackGenre] = useState('');

  const handleSourceUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateStreamSource({
      ...streamSource,
      url: formData.get('url') as string,
    });
    alert('Stream source updated!');
  };

  const extractTrackData = (url: string, file?: File) => {
    if (!file) return;
    
    // Attempt basic ID3/Filename parsing "Artist - Title"
    const nameStr = file.name.replace(/\.[^/.]+$/, ""); // strip extension
    const nameParts = nameStr.split('-');
    
    if (nameParts.length >= 2) {
      if (!trackArtist) setTrackArtist(nameParts[0].trim());
      if (!trackTitle) setTrackTitle(nameParts.slice(1).join('-').trim());
    } else {
      if (!trackTitle) setTrackTitle(nameStr);
    }

    // Auto audio duration
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration)) return;
      const mins = Math.floor(audio.duration / 60);
      const secs = Math.floor(audio.duration % 60);
      const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
      if (!trackDuration) setTrackDuration(formatted);
    });
  };

  const handleCombinedUpload = (url: string, file?: File) => {
    setUploadedMediaUrl(url);
    extractTrackData(url, file);
  };

  const handleAudioUpload = (url: string, file?: File) => {
    setUploadedAudioUrl(url);
    extractTrackData(url, file);
  };

  const handleTrackSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const trackData: Track = {
      id: editingTrack?.id || Date.now().toString(),
      title: formData.get('title') as string,
      artist: formData.get('artist') as string,
      duration: formData.get('duration') as string,
      genre: formData.get('genre') as string,
      videoUrl: uploadedMediaUrl || formData.get('videoUrl') as string,
      audioUrl: uploadedAudioUrl || formData.get('audioUrl') as string,
      visualUrl: uploadedVisualUrl || formData.get('visualUrl') as string,
    };

    if (editingTrack) {
      updatePlaylist(playlist.map(t => t.id === editingTrack.id ? trackData : t));
    } else {
      updatePlaylist([...playlist, trackData]);
    }
    setIsModalOpen(false);
    setEditingTrack(null);
    setUploadedMediaUrl('');
    setUploadedAudioUrl('');
    setUploadedVisualUrl('');
  };

  const handleTrackDelete = (id: string) => {
    updatePlaylist(playlist.filter(t => t.id !== id));
  };

  const openModal = (track: Track | null = null) => {
    setEditingTrack(track);
    setUploadedMediaUrl(track?.videoUrl || '');
    setUploadedAudioUrl(track?.audioUrl || '');
    setUploadedVisualUrl(track?.visualUrl || '');
    setTrackTitle(track?.title || '');
    setTrackArtist(track?.artist || '');
    setTrackDuration(track?.duration || '');
    setTrackGenre(track?.genre || '');
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-3xl font-bold tracking-tighter uppercase mb-8">Stream Configuration</h3>
        <div className="space-y-6">
          <form onSubmit={handleSourceUpdate} className="space-y-4">
            <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Live Stream Source (RTMP/HLS/Video Link)</label>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                name="url"
                type="text" 
                defaultValue={streamSource.url}
                placeholder="https://stream.provider.com/live/vibe-x" 
                className="flex-grow bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-neon-green/50 transition-colors"
              />
              <button type="submit" className="bg-neon-green text-black px-8 py-4 rounded-2xl font-bold text-sm shadow-[0_0_20px_rgba(0,255,0,0.2)]">
                UPDATE SOURCE
              </button>
            </div>
          </form>

          <div className="h-px bg-white/10" />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-bold tracking-tight uppercase">Auto-Pilot Playlist (24/7)</h4>
              <button 
                onClick={() => openModal()}
                className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:border-neon-green/50 transition-all"
              >
                ADD MEDIA LINK
              </button>
            </div>
            <p className="text-sm text-white/40">These links will play automatically in sequence when no live stream is detected. Supports MP3, MP4, and YouTube/Vimeo links.</p>
            
            <div className="space-y-3">
              {playlist.map((item, idx) => (
                <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-white/30 font-mono text-[10px]">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <div className="flex gap-2 mt-1">
                        {item.videoUrl && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded font-mono text-white/40 uppercase">Combined</span>
                        )}
                        {item.audioUrl && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-neon-blue/20 text-neon-blue rounded font-mono uppercase">Audio</span>
                        )}
                        {item.visualUrl && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-neon-pink/20 text-neon-pink rounded font-mono uppercase">Visual</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex gap-2 items-center transition-opacity",
                    confirmingId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}>
                    <button onClick={() => openModal(item)} className="p-2 hover:text-neon-green"><Edit2 className="w-3 h-3" /></button>
                    <DeleteButton 
                      onDelete={() => handleTrackDelete(item.id)} 
                      confirmMessage="Remove Track" 
                      onConfirmingChange={(isConfirming) => setConfirmingId(isConfirming ? item.id : null)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTrack ? "Edit Track" : "Add Track"}>
        <form onSubmit={handleTrackSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Title</label>
              <input name="title" value={trackTitle} onChange={e => setTrackTitle(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Artist</label>
              <input name="artist" value={trackArtist} onChange={e => setTrackArtist(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Duration</label>
              <input name="duration" placeholder="4:20" value={trackDuration} onChange={e => setTrackDuration(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Genre</label>
              <input name="genre" value={trackGenre} onChange={e => setTrackGenre(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
          </div>
          
          <div className="h-px bg-white/10 my-4" />
          
          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-neon-green uppercase tracking-widest">Option A: Combined Video/Audio</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Video URL</label>
                <input 
                  name="videoUrl" 
                  value={uploadedMediaUrl} 
                  onChange={(e) => setUploadedMediaUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
                />
              </div>
              <FileUpload label="Upload Combined" onUpload={handleCombinedUpload} accept="video/*" />
            </div>
          </div>

          <div className="h-px bg-white/10 my-4" />

          <div className="space-y-4">
            <h5 className="text-[10px] font-bold text-neon-blue uppercase tracking-widest">Option B: Separate Audio & Visual</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Audio URL</label>
                <input 
                  name="audioUrl" 
                  value={uploadedAudioUrl} 
                  onChange={(e) => setUploadedAudioUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
                />
              </div>
              <FileUpload label="Upload Audio" onUpload={handleAudioUpload} accept="audio/*" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Visual URL</label>
                <input 
                  name="visualUrl" 
                  value={uploadedVisualUrl} 
                  onChange={(e) => setUploadedVisualUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
                />
              </div>
              <FileUpload label="Upload Visual" onUpload={setUploadedVisualUrl} accept="video/*,image/*" />
            </div>
          </div>

          <button type="submit" className="w-full bg-neon-green text-black py-4 rounded-xl font-bold mt-4 flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> SAVE TRACK
          </button>
        </form>
      </Modal>
    </div>
  );
}

function DonorManager() {
  const [donors, setDonors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/donors')
      .then(res => res.json())
      .then(data => {
        setDonors(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-neon-green" /></div>;

  return (
    <div className="space-y-6">
      <h3 className="text-3xl font-bold tracking-tighter uppercase mb-8">Donor Roster</h3>
      <div className="grid gap-4">
        {donors.length === 0 ? (
          <p className="text-white/30 text-center py-12 glass rounded-3xl">No donations recorded yet.</p>
        ) : donors.map((donor) => (
          <div key={donor.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-neon-pink">
                <Heart className="w-6 h-6 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold">{donor.name || 'Anonymous'}</h4>
                  <span className="px-2 py-0.5 bg-neon-green/20 text-neon-green text-[8px] font-bold rounded uppercase tracking-widest">{donor.tier}</span>
                </div>
                <p className="text-xs text-white/40 font-mono">{donor.walletAddress.slice(0, 10)}...</p>
              </div>
            </div>
            
            <div className="flex-grow max-w-md">
              <p className="text-xs text-white/60 italic">"{donor.message || 'No message left.'}"</p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Discord Status</p>
              <div className="flex items-center gap-2 text-neon-blue">
                <span className="font-bold text-xs">{donor.discord || 'Not Provided'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsManager() {
  const { user, updateCredentials } = useAuth();
  const { wallets, updateWallets } = useStation();
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [isUpdatingAccount, setIsUpdatingAccount] = useState(false);
  const [localWallets, setLocalWallets] = useState(wallets);

  useEffect(() => {
    if (wallets && wallets.length > 0) {
      setLocalWallets(wallets);
    }
  }, [wallets]);

  const handleWalletChange = (id: string, address: string) => {
    setLocalWallets(prev => prev.map(w => w.id === id ? { ...w, address } : w));
  };

  const saveWallets = () => {
    updateWallets(localWallets);
    alert('Crypto addresses updated successfully!');
  };

  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAccount(true);
    try {
      await updateCredentials(email, password || 'admin123');
      alert('Account updated successfully!');
      setPassword('');
    } catch (error: any) {
      alert('Error updating account: ' + error.message);
    } finally {
      setIsUpdatingAccount(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-12 pb-20">
      {/* Wallet Management Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-neon-green" />
          <h3 className="text-3xl font-bold tracking-tighter uppercase">Treasury Wallets</h3>
        </div>
        <p className="text-white/40 text-sm">Update the addresses where users send crypto donations. Changes reflect on the Donate page instantly.</p>
        
        <div className="grid gap-4">
          {localWallets.map((wallet) => (
            <div key={wallet.id} className="glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 group hover:border-white/20 transition-all">
              <div className="w-16 h-16 rounded-xl bg-black/40 flex items-center justify-center font-bold text-neon-green border border-white/5">
                {wallet.icon}
              </div>
              <div className="flex-grow space-y-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{wallet.name} Address</label>
                <input 
                  value={wallet.address}
                  onChange={(e) => handleWalletChange(wallet.id, e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono focus:border-neon-green/50 outline-none text-white/80" 
                  placeholder="Paste address here..."
                />
              </div>
            </div>
          ))}
          <button 
            onClick={saveWallets}
            className="bg-neon-green text-black px-8 py-4 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            UPDATE TREASURY ADDRESSES
          </button>
        </div>
      </section>

      {/* Account Section */}
      <section className="pt-12 border-t border-white/10 space-y-8">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-white/60" />
          <h3 className="text-3xl font-bold tracking-tighter uppercase">Admin Security</h3>
        </div>
        
        <form onSubmit={handleAccountUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input 
                type="password" 
                placeholder="Leave blank to keep current"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" 
              />
            </div>
          </div>
          <button 
            type="submit"
            disabled={isUpdatingAccount}
            className="md:col-span-2 bg-white text-black py-4 rounded-xl font-bold hover:bg-neon-green transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUpdatingAccount ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            SAVE ACCOUNT CHANGES
          </button>
        </form>
      </section>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-full max-w-lg h-fit glass rounded-[40px] p-8 z-[110] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold tracking-tighter uppercase">{title}</h3>
              <button onClick={onClose} className="p-2 hover:text-neon-green transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
