import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Upload, Image, Music, Package, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useStation } from '../context/StationContext';
import { Product } from '../types';
import { uploadProductFile, generateProductFilePath, generateMusicFilePath } from '../services/storageService';
import { cn } from '../utils';

const CATEGORIES: Product['category'][] = ['apparel', 'accessories', 'digital', 'music', 'swag', 'vinyl'];

interface ProductFormData {
  id: string;
  name: string;
  price: number;
  image: string;
  category: Product['category'];
  isDigital: boolean;
  file?: File;
}

interface AdminProductManagerProps {
  isAdmin: boolean;
}

export default function AdminProductManager({ isAdmin }: AdminProductManagerProps) {
  const { products, updateProducts } = useStation();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    id: '',
    name: '',
    price: 0,
    image: '',
    category: 'apparel',
    isDigital: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="text-center py-12 text-white/40">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p>Admin access required</p>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      price: 0,
      image: '',
      category: 'apparel',
      isDigital: false,
    });
    setImageFile(null);
    setProductFile(null);
    setError(null);
    setSuccess(null);
  };

  const handleAddProduct = () => {
    resetForm();
    setIsAddingProduct(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      isDigital: product.downloadUrl ? true : false,
    });
    setEditingProduct(product);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const updatedProducts = products.filter(p => p.id !== productId);
    await updateProducts(updatedProducts);
    setSuccess('Product deleted successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    if (formData.price <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setIsUploading(true);
    setUploadProgress('Uploading images...');
    setError(null);

    try {
      let imageUrl = formData.image;
      
      // Upload image if changed
      if (imageFile) {
        const timestamp = Date.now();
        const path = `products/${formData.category}/${timestamp}_${imageFile.name}`;
        const result = await uploadProductFile(imageFile, path);
        
        if (!result.success || !result.url) {
          throw new Error(result.error || 'Failed to upload image');
        }
        imageUrl = result.url;
        setUploadProgress('Uploading product file...');
      }

      // Upload product file for digital items
      let downloadUrl = '';
      if (formData.isDigital && productFile) {
        const filePath = formData.category === 'music' 
          ? generateMusicFilePath(formData.name, formData.name, productFile.name)
          : generateProductFilePath(formData.id || `temp_${Date.now()}`, productFile.name);
        
        const result = await uploadProductFile(productFile, filePath);
        if (result.success && result.url) {
          downloadUrl = result.url;
        }
      }

      const productData: Product = {
        id: editingProduct?.id || `prod_${Date.now()}`,
        name: formData.name.trim(),
        price: formData.price,
        image: imageUrl,
        category: formData.category,
        downloadUrl: downloadUrl || undefined,
        shippingRequired: !formData.isDigital,
        stock: formData.isDigital ? undefined : 100, // Default stock for physical
      };

      let updatedProducts: Product[];
      
      if (editingProduct) {
        updatedProducts = products.map(p => p.id === editingProduct.id ? productData : p);
      } else {
        updatedProducts = [...products, productData];
      }

      await updateProducts(updatedProducts);
      
      setSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
      if (editingProduct) {
        setEditingProduct(null);
      } else {
        setIsAddingProduct(false);
      }
      
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tighter uppercase flex items-center gap-3">
            <Package className="w-6 h-6 text-neon-green" />
            Product Manager
          </h3>
          <p className="text-white/50 text-sm mt-1">{products.length} products in catalog</p>
        </div>
        <button
          onClick={handleAddProduct}
          className="flex items-center gap-2 bg-neon-green text-black px-5 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Success/Error Messages */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neon-green/20 border border-neon-green/30 rounded-xl p-4 flex items-center gap-2 text-neon-green"
          >
            <CheckCircle className="w-5 h-5" />
            {success}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-2 text-red-500"
          >
            <AlertCircle className="w-5 h-5" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl overflow-hidden border border-white/10"
          >
            {/* Product Image */}
            <div className="aspect-square relative overflow-hidden bg-white/5">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-12 h-12 text-white/20" />
                </div>
              )}
              {product.downloadUrl && (
                <div className="absolute top-3 right-3 bg-neon-green/90 text-black text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                  Digital
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">
                  {product.category}
                </span>
              </div>
              <h4 className="font-bold text-lg mb-2">{product.name}</h4>
              <p className="text-neon-green font-bold text-xl">${product.price}</p>
              
              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {(isAddingProduct || editingProduct) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingProduct(false);
                setEditingProduct(null);
                resetForm();
              }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-lg max-h-[90vh] overflow-y-auto glass rounded-[40px] p-8 z-[110]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold tracking-tighter uppercase">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button 
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                  className="p-2 hover:text-neon-green transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VIBE-X Limited Tee"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-neon-green transition-colors"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="29.99"
                    min="0.01"
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-neon-green transition-colors"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Product['category'] }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon-green transition-colors appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat} className="bg-dark-bg">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Digital Product Toggle */}
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDigital}
                      onChange={(e) => setFormData(prev => ({ ...prev, isDigital: e.target.checked }))}
                      className="w-5 h-5 rounded border-white/20 bg-white/5 text-neon-green focus:ring-neon-green"
                    />
                    <div>
                      <p className="font-bold text-sm">Digital Product</p>
                      <p className="text-xs text-white/40">No shipping required, customer gets download link</p>
                    </div>
                  </label>
                </div>

                {/* Product Image */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                    <Image className="w-3 h-3 inline mr-1" />
                    Product Image
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.image && (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-white/5">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <div className="bg-white/5 border border-white/10 hover:border-neon-green/50 rounded-xl px-4 py-3 transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        <span className="text-sm">{formData.image ? 'Change Image' : 'Upload Image'}</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Digital Product File */}
                {formData.isDigital && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                      <Music className="w-3 h-3 inline mr-1" />
                      {formData.category === 'music' ? 'Music File' : 'Digital File'}
                    </label>
                    <label className="cursor-pointer block">
                      <input type="file" onChange={handleFileChange} className="hidden" />
                      <div className="bg-white/5 border border-white/10 hover:border-neon-green/50 rounded-xl p-6 transition-colors text-center">
                        {productFile ? (
                          <div className="flex items-center justify-center gap-2 text-neon-green">
                            <CheckCircle className="w-5 h-5" />
                            <span>{productFile.name}</span>
                          </div>
                        ) : (
                          <div className="text-white/40">
                            <Upload className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Click to upload file</p>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="flex items-center gap-3 text-neon-green">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{uploadProgress}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isUploading}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2",
                    "bg-neon-green text-black shadow-[0_0_30px_rgba(0,255,0,0.2)]",
                    "hover:scale-[1.02] active:scale-[0.98] transition-all",
                    "disabled:opacity-50 disabled:hover:scale-100"
                  )}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      UPLOADING...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {editingProduct ? 'UPDATE PRODUCT' : 'ADD PRODUCT'}
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}