import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Calendar, 
  Users, 
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
  Heart,
  Tag,
  ListMusic,
  Play,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Radio,
  FolderOpen,
  Upload,
  Folder,
  FileAudio,
  Image,
  Film,
  RefreshCw,
  Copy,
  ExternalLink,
  Megaphone,
  PlayCircle,
  PauseCircle,
  SkipForward
} from 'lucide-react';
import { cn } from '../utils';
import VisualsManager from './VisualsManager';
import CommercialsManager from './CommercialsManager';
import { ImageUploadField } from './ImageUploadField';
import { AdminDashboard } from '../../admin-suite/AdminDashboard';
import { OpsConsole } from '../../empire-ops/OpsConsole';
import ConsentManager from './ConsentManager';
// @ts-ignore
// Lazy-load confetti to prevent page crash on initialization errors
const Confetti = React.lazy(() => import('canvas-confetti'));

import { db, storage } from '../firebaseConfig';
import { vibeXConfig } from '../../admin.config';
import { vibeXOpsConfig } from '../../empire.config';
import { useAuth } from '../context/AuthContext';
import { useStation } from '../context/StationContext';
import { Product, DJ, ScheduleEntry, Track } from '../types';
import { uploadToStorage, deleteFromStorage, listFolder, sanitizePathSegment } from '../firebaseConfig';
import SourcesManager from './SourcesManager';
import { Server } from 'lucide-react';

type Tab = 'metrics' | 'shop' | 'schedule' | 'djs' | 'playlist' | 'visuals' | 'commercials' | 'storage' | 'donors' | 'settings' | 'sources';

export default function AdminView() {
  const [activeTab, setActiveTab] = useState<Tab>('metrics');
  const { logout, currentUser } = useAuth();
  const { isLoading } = useStation();

  const tabs = [
    { id: 'metrics', name: 'Metrics', icon: TrendingUp },
    { id: 'shop', name: 'Shop', icon: ShoppingBag },
    { id: 'schedule', name: 'Schedule', icon: Calendar },
    { id: 'djs', name: 'DJs', icon: Users },
    { id: 'playlist', name: 'Playlist', icon: ListMusic },
    { id: 'visuals', name: 'Visuals', icon: ImageIcon },
    { id: 'commercials', name: 'Commercials', icon: Megaphone },
    { id: 'storage', name: 'Storage', icon: FolderOpen },
    { id: 'donors', name: 'Donors', icon: Heart },
    { id: 'sources', name: 'Sources', icon: Server },
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
              {activeTab === 'metrics' && (
                <div className="space-y-8">
                  <AdminDashboard config={vibeXConfig} currentUser={currentUser ? { fullName: currentUser.displayName, email: currentUser.email, id: currentUser.uid } : null} db={db} />
                  <ConsentManager />
                </div>
              )}
              {activeTab === 'shop' && <OpsConsole config={vibeXOpsConfig} db={db} storage={storage} />}
              {activeTab === 'schedule' && <ScheduleManager />}
              {activeTab === 'djs' && <DJManager />}
              {activeTab === 'playlist' && <PlaylistManager />}
              {activeTab === 'visuals' && <VisualsManager />}
              {activeTab === 'commercials' && <CommercialsManager />}
              {activeTab === 'storage' && <StorageManager />}
              {activeTab === 'donors' && <DonorManager />}
              {activeTab === 'sources' && <SourcesManager />}
              {activeTab === 'settings' && <SettingsManager />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}


function FileUpload({ onUpload, label, accept = "image/*", storageFolder = "music" }: {
  onUpload: (url: string, file?: File) => void;
  label: string;
  accept?: string;
  storageFolder?: string;  // 'music' | 'products' | 'dj-photos' | 'thumbnails' | etc.
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 500MB for music/video files via Firebase Storage
    if (file.size > 500 * 1024 * 1024) {
      setError('File too large (max 500MB)');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress('Uploading to Firebase...');

    try {
      // Build storage path based on the folder hint
      const safeName = sanitizePathSegment(file.name.replace(/\.[^/.]+$/, ''));
      const ext = file.name.split('.').pop() || 'bin';
      const path = `${storageFolder}/${safeName}-${Date.now()}.${ext}`;

      const url = await uploadToStorage(path, file);
      setProgress('Done!');
      onUpload(url, file);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed — check Firebase Storage rules');
    } finally {
      setLoading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center ml-4">
        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{label}</label>
        {error && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</span>}
      </div>
      <div
        onClick={() => !loading && fileInputRef.current?.click()}
        className={cn(
          "w-full bg-white/5 border border-white/10 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-neon-green/50 transition-all group",
          error && "border-red-500/50",
          loading && "cursor-wait opacity-60"
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
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-neon-green" />
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{progress || 'Uploading...'}</span>
          </div>
        ) : (
          <>
            <Plus className="w-6 h-6 text-white/20 group-hover:text-neon-green transition-colors mb-2" />
            <span className="text-[10px] font-bold text-white/30 group-hover:text-white/50 uppercase tracking-widest">Upload to Firebase</span>
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
  const [uploadedImagePath, setUploadedImagePath] = useState<string>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  /** Strip undefined values before sending to Firestore (v9 rejects them). */
function cleanProduct(p: Product): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const discountPct = parseFloat((formData.get('discountPercent') as string) || '0');
    const ratingVal = parseFloat((formData.get('rating') as string) || '0');
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.get('name') as string,
      price: parseFloat(formData.get('price') as string),
      image: uploadedImageUrl || formData.get('image') as string,
      category: formData.get('category') as Product['category'],
      stock: parseInt((formData.get('stock') as string) || '0', 10),
      discountPercent: isNaN(discountPct) ? 0 : discountPct,
      rating: isNaN(ratingVal) ? 0 : Math.max(0, Math.min(5, ratingVal)),
      info: (formData.get('info') as string) || '',
    };
    if (uploadedImagePath) productData.imagePath = uploadedImagePath;
    else delete productData.imagePath;

    // Clean all products in the array (other products may have undefined fields from old Firestore docs)
    const cleanedProducts = products.map(p =>
      p.id === editingProduct?.id
        ? cleanProduct(productData)
        : cleanProduct(p as Product)
    );

    if (editingProduct) {
      updateProducts(cleanedProducts as any);
    } else {
      updateProducts([...cleanedProducts, cleanProduct(productData)] as any);
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
          onClick={() => { setEditingProduct(null); setUploadedImageUrl(''); setUploadedImagePath(''); setIsModalOpen(true); }}
          className="bg-neon-green text-black px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> ADD PRODUCT
        </button>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <div key={product.id} className="group bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <img src={product.image} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" referrerPolicy="no-referrer" />
              <div className="min-w-0">
                <h4 className="font-bold text-sm truncate">{product.name}</h4>
                <p className="text-xs text-white/40">
                  ${product.price}
                  {product.discountPercent ? <span className="ml-1 text-neon-green">−{product.discountPercent}%</span> : null}
                  {' • '}{product.category}
                  {product.stock !== undefined ? ` • ${product.stock} in stock` : ''}
                  {product.rating ? ` • ★${product.rating}` : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center flex-shrink-0 opacity-100">
              <button
                onClick={() => { setEditingProduct(product); setUploadedImageUrl(product.image); setUploadedImagePath((product as any).imagePath || ''); setIsModalOpen(true); }}
                className="p-2 glass rounded-lg hover:text-neon-green transition-all flex items-center gap-1.5 text-xs font-bold"
                aria-label={`Edit ${product.name}`}
              >
                <Edit2 className="w-4 h-4" /> EDIT
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

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProduct(null); setUploadedImageUrl(''); setUploadedImagePath(''); }} title={editingProduct ? "Edit Product" : "Add Product"}>
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
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Quantity (Stock)</label>
              <input name="stock" type="number" min="0" defaultValue={editingProduct?.stock ?? 0} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Category</label>
              <select name="category" defaultValue={editingProduct?.category || 'apparel'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50">
                <option value="apparel">Apparel</option>
                <option value="accessories">Accessories</option>
                <option value="digital">Digital</option>
                <option value="music">Music</option>
                <option value="swag">Swag</option>
                <option value="vinyl">Vinyl</option>
                <option value="ticket">Ticket</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Discount (%)</label>
              <input name="discountPercent" type="number" min="0" max="100" step="1" defaultValue={editingProduct?.discountPercent ?? 0} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Rating (0–5)</label>
              <input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={editingProduct?.rating ?? 0} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Product Info / Description</label>
            <textarea
              name="info"
              defaultValue={editingProduct?.info || ''}
              rows={3}
              placeholder="Marketing copy, sizing, specs, anything you want shoppers to know…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50 resize-y"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Image URL</label>
            <input
              name="image"
              value={uploadedImageUrl}
              onChange={(e) => { setUploadedImageUrl(e.target.value); setUploadedImagePath(''); }}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50"
            />
          </div>

          <ImageUploadField
              label="🖼️ Upload Image (drag-drop or click) — uploads to your Mac"
              collection="vibe_x_products"
              docId={editingProduct?.id || 'new'}
              value={uploadedImageUrl}
              storagePath={uploadedImagePath}
              onChange={(d) => {
                setUploadedImageUrl(d.url || '');
                setUploadedImagePath(d.path || '');
              }}
            />

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
  const [uploadedImagePath, setUploadedImagePath] = useState<string>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const djData: DJ = {
      id: editingDJ?.id || Date.now().toString(),
      name: formData.get('name') as string,
      bio: formData.get('bio') as string,
      image: uploadedImageUrl || formData.get('image') as string,
      imagePath: uploadedImagePath || undefined,
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
          onClick={() => { setEditingDJ(null); setUploadedImageUrl(''); setUploadedImagePath(''); setIsModalOpen(true); }}
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
              <button onClick={() => { setEditingDJ(dj); setUploadedImageUrl(dj.image); setUploadedImagePath(dj.imagePath || ''); setIsModalOpen(true); }} className="p-2 glass rounded-lg hover:text-neon-green"><Edit2 className="w-4 h-4" /></button>
              <DeleteButton 
                onDelete={() => handleDelete(dj.id)} 
                confirmMessage="Remove DJ" 
                onConfirmingChange={(isConfirming) => setConfirmingId(isConfirming ? dj.id : null)}
              />
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingDJ(null); setUploadedImageUrl(''); setUploadedImagePath(''); }} title={editingDJ ? "Edit DJ" : "Add DJ"}>
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
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Image URL</label>
            <input
              name="image"
              value={uploadedImageUrl}
              onChange={(e) => { setUploadedImageUrl(e.target.value); setUploadedImagePath(''); }}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50"
            />
          </div>

          <ImageUploadField
              label="🖼️ Upload Photo (drag-drop or click) — uploads to your Mac"
              collection="vibe_x_djs"
              docId={editingDJ?.id || 'new'}
              value={uploadedImageUrl}
              storagePath={uploadedImagePath}
              onChange={(d) => {
                setUploadedImageUrl(d.url || '');
                setUploadedImagePath(d.path || '');
              }}
            />

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

function PlaylistManager() {
  const { playlist, updatePlaylist } = useStation();
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
  const [trackMood, setTrackMood] = useState<Track['mood']>(undefined);
  const [filterMood, setFilterMood] = useState<Track['mood'] | 'all'>('all');
  const [editingOrder, setEditingOrder] = useState(false);

  const MOODS = [
    { id: 'jungle-dnb',  label: 'Jungle-DnB' },
    { id: 'house',       label: 'House' },
    { id: 'trance',      label: 'Trance' },
    { id: 'alternative', label: 'Alternative' },
    { id: 'jazz',        label: 'Jazz' },
    { id: 'blues',       label: 'Blues' },
    { id: 'mc-theme',    label: 'M&C Theme' },
    { id: 'eighties-nineties-2000s', label: '80 / 90 / 2000' },
    { id: 'chill', label: 'Image' },
  ] as const;

  const filteredPlaylist = filterMood === 'all' ? playlist : playlist.filter(t => t.mood === filterMood);

  const moveTrack = (fromIdx: number, direction: 'up' | 'down') => {
    const newPlaylist = [...filteredPlaylist];
    const actualFrom = playlist.findIndex(t => t.id === newPlaylist[fromIdx].id);
    const actualTo = direction === 'up' ? actualFrom - 1 : actualFrom + 1;
    if (actualTo < 0 || actualTo >= playlist.length) return;
    const newArr = [...playlist];
    [newArr[actualFrom], newArr[actualTo]] = [newArr[actualTo], newArr[actualFrom]];
    updatePlaylist(newArr);
  };

  const removeTrack = (id: string) => {
    updatePlaylist(playlist.filter(t => t.id !== id));
  };

  const extractTrackData = (url: string, file?: File) => {
    if (!file) return;
    const nameStr = file.name.replace(/\.[^/.]+$/, "");
    const nameParts = nameStr.split('-');
    setTrackTitle(prev => {
      if (prev) return prev;
      if (nameParts.length >= 2) {
        return nameParts.slice(1).join('-').trim();
      }
      return nameStr;
    });
    setTrackArtist(prev => {
      if (prev) return prev;
      if (nameParts.length >= 2) {
        return nameParts[0].trim();
      }
      return '';
    });
    // Only auto-detect duration for audio files
    if (!file.type.startsWith('audio/')) return;
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      if (!isFinite(audio.duration)) return;
      const mins = Math.floor(audio.duration / 60);
      const secs = Math.floor(audio.duration % 60);
      const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
      setTrackDuration(prev => prev || formatted);
    });
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
      mood: trackMood,
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
    setTrackMood(undefined);
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
    setTrackMood(track?.mood || undefined);
    setIsModalOpen(true);
  };

  const handleTrackDelete = (id: string) => {
    updatePlaylist(playlist.filter(t => t.id !== id));
  };

  const moodBadgeColor = (mood: string) => {
    const map: Record<string, string> = {
      relax: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      working: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      exercise: 'bg-red-500/20 text-red-400 border-red-500/30',
      home: 'bg-green-500/20 text-green-400 border-green-500/30',
      chilling: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'getting-ready': 'bg-neon-green/20 text-neon-green border-neon-green/30',
    };
    return map[mood] || 'bg-white/10 text-white/40 border-white/10';
  };

  const getMediaTypeBadge = (item: Track) => {
    if (item.videoUrl) return <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded font-mono text-white/40 uppercase">Video</span>;
    if (item.audioUrl && item.visualUrl) return <span className="text-[8px] px-1.5 py-0.5 bg-neon-blue/20 text-neon-blue rounded font-mono uppercase">Audio+Visual</span>;
    if (item.audioUrl) return <span className="text-[8px] px-1.5 py-0.5 bg-neon-green/20 text-neon-green rounded font-mono uppercase">Audio</span>;
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="sticky top-20 z-30 -mx-8 px-8 pt-2 pb-4 bg-dark-bg/95 backdrop-blur-md border-b border-white/10">
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-3xl font-bold tracking-tighter uppercase mb-2 text-white">Playlist Manager</h3>
            <p className="text-sm text-white/60">{playlist.length} tracks — drag to reorder, tag with moods</p>
          </div>
          <div className="flex items-center gap-2">
            {playlist.length > 1 && (
              <button
                onClick={() => setEditingOrder(!editingOrder)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                  editingOrder ? 'bg-neon-green text-black border-neon-green' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'
                )}
              >
                <ListMusic className="w-4 h-4" /> {editingOrder ? 'Done Reordering' : 'Reorder Tracks'}
              </button>
            )}
            <button onClick={() => openModal()} className="bg-neon-green text-black px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
              <Plus className="w-4 h-4" /> ADD TRACK
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Filter:</span>
        <button
          onClick={() => setFilterMood('all')}
          className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
            filterMood === 'all' ? 'bg-neon-green text-black border-neon-green' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'
          )}
        >All ({playlist.length})</button>
        {MOODS.map(mood => {
          const count = playlist.filter(t => t.mood === mood.id).length;
          return (
            <button
              key={mood.id}
              onClick={() => setFilterMood(mood.id)}
              className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                filterMood === mood.id ? 'bg-neon-green text-black border-neon-green' : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30'
              )}
            >
              {mood.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Track list */}
      <div className="space-y-2">
        {filteredPlaylist.length === 0 && (
          <div className="text-center py-16 text-white/30">
            <ListMusic className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm uppercase tracking-widest font-bold">No tracks{filterMood !== 'all' ? ` tagged as ${filterMood}` : ''}</p>
            <p className="text-[10px] mt-2">Click "ADD TRACK" to add music and tag it with a mood</p>
          </div>
        )}
        {filteredPlaylist.map((item, idx) => {
          const actualIdx = playlist.findIndex(t => t.id === item.id);
          return (
            <div 
              key={item.id} 
              className={cn(
                "bg-white/5 border rounded-2xl p-4 flex items-center gap-4 group transition-all",
                confirmingId === item.id ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 hover:border-white/20'
              )}
            >
              {/* Reorder mode: drag handle + move buttons */}
              {editingOrder && (
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => moveTrack(idx, 'up')}
                    disabled={actualIdx === 0}
                    className="p-1 text-white/30 hover:text-white disabled:opacity-20"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <div className="cursor-grab text-white/20 hover:text-white/50 p-1">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <button 
                    onClick={() => moveTrack(idx, 'down')}
                    disabled={actualIdx === playlist.length - 1}
                    className="p-1 text-white/30 hover:text-white disabled:opacity-20"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Index / Play button */}
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex-shrink-0">
                {editingOrder ? (
                  <span className="text-white/30 font-mono text-xs">{actualIdx + 1}</span>
                ) : (
                  <button 
                    onClick={() => window.open(item.videoUrl || item.audioUrl, '_blank')}
                    className="w-full h-full flex items-center justify-center text-white/30 hover:text-neon-green transition-colors"
                    title="Preview track"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                )}
              </div>

              {/* Track info */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold truncate text-white">{item.title}</p>
                  <span className="text-white/60 text-xs font-mono">{item.duration}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] text-white/70 font-bold">{item.artist}</span>
                  <span className="text-white/30">•</span>
                  <span className="text-[10px] text-white/60">{item.genre}</span>
                  {getMediaTypeBadge(item)}
                  {item.mood && (
                    <span className={cn('text-[8px] px-1.5 py-0.5 rounded border uppercase font-bold tracking-widest', moodBadgeColor(item.mood))}>
                      {MOODS.find(m => m.id === item.mood)?.label}
                    </span>
                  )}
                  {!item.mood && (
                    <span className="text-[8px] text-white/20 italic">Untagged</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={cn("flex items-center gap-2 transition-opacity", confirmingId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
                {editingOrder ? (
                  <>
                    <button 
                      onClick={() => moveTrack(idx, 'up')}
                      className="p-2 text-white/30 hover:text-neon-green disabled:opacity-20"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => moveTrack(idx, 'down')}
                      className="p-2 text-white/30 hover:text-neon-green disabled:opacity-20"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openModal(item)} className="p-2 hover:text-neon-green" title="Edit track">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setConfirmingId(item.id); }} className="p-2 hover:text-red-400" title="Delete track">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Delete confirm */}
              {confirmingId === item.id && (
                <div className="flex items-center gap-2 animate-fade-in">
                  <span className="text-[10px] text-red-400 font-bold">Delete?</span>
                  <button 
                    onClick={() => removeTrack(item.id)}
                    className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500/30 transition-all"
                  >
                    Yes, Remove
                  </button>
                  <button 
                    onClick={() => setConfirmingId(null)}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-white/40 text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      {playlist.length > 0 && (
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span><span className="font-mono font-bold text-white/70">{playlist.length}</span> total tracks</span>
            <span>•</span>
            {MOODS.map(mood => {
              const count = playlist.filter(t => t.mood === mood.id).length;
              if (count === 0) return null;
              return <span key={mood.id}><span className="font-mono font-bold text-white/70">{count}</span> {mood.label}</span>;
            })}
          </div>
          <button onClick={() => openModal()} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold hover:border-neon-green/30 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> ADD TRACK
          </button>
        </div>
      )}

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

          {/* Mood selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Mood Tag</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTrackMood(undefined)}
                className={cn("p-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                  !trackMood ? 'border-neon-green bg-neon-green/10 text-neon-green' : 'border-white/10 bg-white/5 text-white/40 hover:border-white/30'
                )}
              >None</button>
              {MOODS.map(mood => (
                <button
                  key={mood.id}
                  type="button"
                  onClick={() => setTrackMood(mood.id)}
                  className={cn("p-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all",
                    trackMood === mood.id ? 'border-neon-green bg-neon-green/10 text-neon-green' : 'border-white/10 bg-white/5 text-white/40 hover:border-white/30'
                  )}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-white/10 my-4" />

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Video / Media</label>
              <input name="videoUrl" value={uploadedMediaUrl} onChange={e => setUploadedMediaUrl(e.target.value)} placeholder="https://... (full music video)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />
              <FileUpload
                label="Or upload video (mp4/webm/mov — up to 500MB)"
                accept="video/*"
                onUpload={(url, file) => {
                  setUploadedMediaUrl(url);
                  extractTrackData(url, file);
                }}
              />
              {uploadedMediaUrl && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-white/40">
                  <span className="font-mono truncate">{uploadedMediaUrl}</span>
                  <button type="button" onClick={() => setUploadedMediaUrl('')} className="text-red-400 hover:text-red-300">×</button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Audio</label>
              <input name="audioUrl" value={uploadedAudioUrl} onChange={e => setUploadedAudioUrl(e.target.value)} placeholder="https://... (mp3, wav, aac)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />

              {/* Browse Local Server folder picker */}
              <LocalServerBrowser
                folder="Music"
                accept={/\.(mp3|m4a|aac|ogg|wav)$/i}
                label="🎧 Browse local Mac music library"
                onPick={(url, name) => {
                  setUploadedAudioUrl(url.startsWith('http') ? url : `http://10.0.0.161:344${url}`);
                  extractTrackData(url, undefined);
                }}
              />

              <FileUpload
                label="Or upload audio (mp3/wav/aac — up to 500MB)"
                accept="audio/*"
                onUpload={(url, file) => {
                  setUploadedAudioUrl(url);
                  extractTrackData(url, file);
                }}
              />
              {uploadedAudioUrl && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-white/40">
                  <span className="font-mono truncate">{uploadedAudioUrl}</span>
                  <button type="button" onClick={() => setUploadedAudioUrl('')} className="text-red-400 hover:text-red-300">×</button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Visual / Cover Art</label>
              <input name="visualUrl" value={uploadedVisualUrl} onChange={e => setUploadedVisualUrl(e.target.value)} placeholder="https://... (album art, jpg/png)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neon-green/50" />

              {/* Browse Local Server folder picker — for visuals */}
              <LocalServerBrowser
                folder="Logos"
                accept={/\.(png|jpg|jpeg|webp|gif|svg)$/i}
                label="🖼️  Browse local Mac logos folder"
                onPick={(url) => setUploadedVisualUrl(url.startsWith('http') ? url : `http://10.0.0.161:344${url}`)}
              />
              <LocalServerBrowser
                folder="Videos"
                accept={/\.(mp4|webm|mov)$/i}
                label="🎬 Browse local Mac video clips folder"
                onPick={(url) => setUploadedMediaUrl(url.startsWith('http') ? url : `http://10.0.0.161:344${url}`)}
              />
              <FileUpload
                label="Or upload cover art (jpg/png/webp — up to 500MB)"
                accept="image/*"
                onUpload={(url, file) => {
                  setUploadedVisualUrl(url);
                  extractTrackData(url, file);
                }}
              />
              {uploadedVisualUrl && (
                <div className="mt-2 flex items-center gap-3">
                  <img src={uploadedVisualUrl} alt="cover" className="w-16 h-16 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
                  <button type="button" onClick={() => setUploadedVisualUrl('')} className="text-red-400 hover:text-red-300 text-[10px] font-bold uppercase tracking-widest">Remove</button>
                </div>
              )}
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

function StorageManager() {
  const [activeFolder, setActiveFolder] = useState<string>('visuals');
  const [files, setFiles] = useState<{name: string; url: string; size: string; fullPath: string; updated: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number; total: number; pct: number; name: string} | null>(null);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);

  const STORAGE_FOLDERS = [
    { id: 'music', label: 'Music', icon: FileAudio, accept: 'audio/*,video/*,.mp3,.wav,.aac,.flac,.m4a', extensions: '.mp3, .wav, .aac, .mp4' },
    { id: 'visuals', label: 'Visuals', icon: Film, accept: 'video/*', extensions: '.mp4, .webm, .mov' },
    { id: 'logos', label: 'Logos', icon: ImageIcon, accept: 'image/png,image/jpeg,image/svg+xml,image/webp', extensions: '.png, .jpg, .svg, .webp' },
    { id: 'thumbnails', label: 'Thumbnails', icon: Image, accept: 'image/png,image/jpeg,image/webp', extensions: '.png, .jpg, .webp' },
    { id: 'ads', label: 'Ads', icon: Film, accept: 'video/*', extensions: '.mp4, .webm' },
    { id: 'banners', label: 'Banners', icon: Image, accept: 'image/png,image/jpeg,image/webp', extensions: '.png, .jpg, .webp' },
  ];

  const folder = STORAGE_FOLDERS.find(f => f.id === activeFolder)!;

  const refresh = async () => {
    setLoading(true);
    try {
      const items = await listFolder(`${activeFolder}/`);
      setFiles(items.map(item => ({
        name: item.name,
        url: item.url,
        size: item.size ? `${(item.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
        fullPath: item.fullPath,
        updated: item.updated,
      })));
    } catch (err: any) {
      // Permission denied / not signed in / etc.
      setFiles([]);
      setMessage({ type: 'error', text: `Could not list /${activeFolder}/: ${err?.message || 'auth required'}` });
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, [activeFolder]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    setUploading(true);
    setMessage(null);
    let successCount = 0;
    let failCount = 0;
    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const safeName = sanitizePathSegment(file.name.replace(/\.[^/.]+$/, ''));
        const ext = file.name.split('.').pop() || 'bin';
        const path = `${activeFolder}/${safeName}-${Date.now()}.${ext}`;
        setUploadProgress({ current: i + 1, total: uploadedFiles.length, pct: 0, name: file.name });
        try {
          await uploadToStorage(path, file, (pct) => {
            setUploadProgress({ current: i + 1, total: uploadedFiles.length, pct, name: file.name });
          });
          successCount++;
        } catch (err: any) {
          failCount++;
          console.error(`Upload ${file.name} failed:`, err);
        }
      }
      if (failCount === 0) {
        setMessage({ type: 'success', text: `${successCount} file(s) uploaded to /${activeFolder}/` });
      } else if (successCount === 0) {
        setMessage({ type: 'error', text: `All ${failCount} upload(s) failed — check Firebase Storage rules and your auth` });
      } else {
        setMessage({ type: 'error', text: `${successCount} uploaded, ${failCount} failed` });
      }
      await refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Upload failed' });
    }
    setUploading(false);
    setUploadProgress(null);
    (e.target as HTMLInputElement).value = '';
  }

  async function handleDelete(file: { fullPath: string; name: string }) {
    if (!confirm(`Delete ${file.name}? This cannot be undone.`)) return;
    setDeletingPath(file.fullPath);
    try {
      await deleteFromStorage(file.fullPath);
      setMessage({ type: 'success', text: `Deleted ${file.name}` });
      await refresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: `Delete failed: ${err?.message || 'permission denied'}` });
    }
    setDeletingPath(null);
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url).then(
      () => setMessage({ type: 'success', text: 'URL copied to clipboard' }),
      () => setMessage({ type: 'error', text: 'Copy failed — select & copy manually' })
    );
  }

  const Icon = folder.icon;
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Storage Manager</h3>
        <label className={cn("flex items-center gap-2 px-4 py-2 bg-neon-green text-black rounded-xl text-sm font-bold transition-colors",
          uploading ? "opacity-50 cursor-wait" : "cursor-pointer hover:bg-neon-green/90"
        )}>
          <Upload className="w-4 h-4" />
          {uploading ? 'Uploading…' : 'Upload File'}
          <input
            type="file"
            multiple
            accept={folder.accept}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && uploadProgress && (
        <div className="glass rounded-xl p-4 mb-4 border border-neon-green/30">
          <div className="flex items-center gap-3 text-neon-green mb-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-bold">
              Uploading {uploadProgress.current}/{uploadProgress.total}: {uploadProgress.name}
            </span>
            <span className="ml-auto text-xs font-mono">{uploadProgress.pct}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-neon-green h-full transition-all duration-200"
              style={{ width: `${uploadProgress.pct}%` }}
            />
          </div>
        </div>
      )}
      {message && (
        <div className={cn("glass rounded-xl p-4 mb-4 border",
          message.type === 'success' ? 'border-neon-green/30 text-neon-green' : 'border-red-500/30 text-red-400'
        )}>
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        {STORAGE_FOLDERS.map(f => {
          const FIcon = f.icon;
          return (
            <button key={f.id} onClick={() => setActiveFolder(f.id)}
              className={cn("glass rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:border-neon-green/30",
                activeFolder === f.id ? "border-neon-green bg-neon-green/10" : "border-white/10")}>
              <FIcon className={cn("w-5 h-5", activeFolder === f.id ? "text-neon-green" : "text-white/40")} />
              <span className="text-xs font-bold uppercase tracking-wider">{f.label}</span>
            </button>
          );
        })}
      </div>

      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
          <Icon className="w-5 h-5 text-neon-green" />
          <div>
            <h4 className="font-bold">/{activeFolder}/</h4>
            <p className="text-xs text-white/40">{folder.extensions}</p>
          </div>
          <button onClick={refresh} disabled={loading} className="ml-auto p-2 glass rounded-lg hover:bg-white/5 transition-colors" title="Refresh">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <span className="text-xs font-mono text-white/30">{files.length} files</span>
        </div>
        {loading ? (
          <div className="flex items-center gap-3 text-white/40 text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading files...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <Icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No files in /{activeFolder}/</p>
            <p className="text-xs mt-1 text-white/20">Upload files using the button above</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {files.map(file => (
              <div key={file.fullPath} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                <Icon className="w-4 h-4 text-white/40 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-mono truncate">{file.name}</p>
                  <p className="text-xs text-white/30">
                    {file.size}
                    {file.updated && <span className="ml-2">· {new Date(file.updated).toLocaleDateString()}</span>}
                  </p>
                </div>
                <button onClick={() => copyUrl(file.url)} className="p-2 glass rounded-lg hover:text-neon-green transition-colors" title="Copy URL">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-2 glass rounded-lg hover:text-neon-green transition-colors" title="Open in new tab">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(file)}
                  disabled={deletingPath === file.fullPath}
                  className="p-2 glass rounded-lg hover:text-red-400 transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingPath === file.fullPath ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        )}
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

// ───────────────────────────────────────────────────────────────────────────
// LocalServerBrowser — collapsible file/folder picker that talks to the
// Mac's local music server (music-server.cjs running on port 344)
// Walks folder tree, lets admin pick a file and write its URL into the form.
// ───────────────────────────────────────────────────────────────────────────
const LOCAL_SERVER_BASES = [
  `http://localhost:344`,
  `http://10.0.0.161:344`,
  `http://10.0.0.83:344`,
  `http://333Es-Mac-mini.local:344`,
];

function LocalServerBrowser({ folder, accept, label, onPick }: {
  folder: string;
  accept: RegExp;
  label: string;
  onPick: (url: string, name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [serverBase, setServerBase] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [currentPath, setCurrentPath] = useState(folder);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ensureServer = async () => {
    if (serverBase || checking) return serverBase;
    setChecking(true);
    for (const base of LOCAL_SERVER_BASES) {
      try {
        const r = await fetch(`${base}/__health`, { signal: AbortSignal.timeout(1500) });
        if (r.ok) { setServerBase(base); setChecking(false); return base; }
      } catch {}
    }
    setChecking(false);
    setErr('Local server not reachable — make sure music-server.cjs is running on the Mac (port 344).');
    return null;
  };

  const loadFolder = async (path: string) => {
    const base = serverBase || await ensureServer();
    if (!base) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch(`${base}/__list/${encodeURI(path)}`, { signal: AbortSignal.timeout(4000) });
      const data = await r.json();
      setItems(data.items || []);
      setCurrentPath(path);
    } catch (e: any) {
      setErr(`Failed to list ${path}: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const base = await ensureServer();
      if (base) await loadFolder(folder);
    }
  };

  const filtered = items.filter(i => i.type === 'folder' || accept.test(i.name));

  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button type="button" onClick={onOpen} className="w-full px-3 py-2 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors text-left">
        <span className="text-xs text-white/70 font-bold">{label}</span>
        <span className="text-[10px] text-white/40 uppercase tracking-widest">{open ? '▲ Close' : '▼ Browse'}</span>
      </button>
      {open && (
        <div className="p-3 bg-black/40 max-h-72 overflow-y-auto">
          {checking && <p className="text-[10px] text-white/40">Reaching Mac local server…</p>}
          {err && <p className="text-[10px] text-red-400">{err}</p>}
          {loading && <p className="text-[10px] text-white/40">Loading {currentPath}…</p>}
          {!loading && serverBase && (
            <>
              <div className="text-[9px] text-white/30 font-mono mb-2">📁 {currentPath}/ &nbsp;•&nbsp; {serverBase}</div>
              {currentPath !== folder && (
                <button type="button" onClick={() => loadFolder(folder)} className="block w-full text-left px-2 py-1 text-[10px] text-neon-green hover:bg-white/5 rounded">← Back to {folder}</button>
              )}
              {filtered.length === 0 && <p className="text-[10px] text-white/40 px-2 py-1">No matching files in this folder.</p>}
              {filtered.map((it) => (
                <div key={it.name} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white/5 rounded">
                  {it.type === 'folder' ? (
                    <button type="button" onClick={() => loadFolder(`${currentPath}/${it.name}`)} className="flex-1 text-left text-xs text-neon-blue font-mono">
                      📁 {it.name}/
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onPick(it.url, it.name)}
                        className="flex-1 text-left text-xs text-white/80 font-mono truncate hover:text-neon-green"
                        title={it.url}
                      >
                        🎵 {it.name}
                      </button>
                      <span className="text-[9px] text-white/30 font-mono">{(it.size / 1024 / 1024).toFixed(1)} MB</span>
                      <button
                        type="button"
                        onClick={() => window.open(`${serverBase}${it.url}`, '_blank')}
                        className="text-[9px] text-white/30 hover:text-neon-green px-1"
                        title="Preview"
                      >
                        ▶
                      </button>
                    </>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
