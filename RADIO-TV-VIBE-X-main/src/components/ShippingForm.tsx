import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Phone, User, CheckCircle, AlertCircle } from 'lucide-react';
import { ShippingAddress } from '../services/orderService';
import { cn } from '../utils';

interface ShippingFormProps {
  onSubmit: (address: ShippingAddress) => void;
  onCancel: () => void;
  initialData?: ShippingAddress;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

interface FormErrors {
  fullName?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
}

export default function ShippingForm({ onSubmit, onCancel, initialData }: ShippingFormProps) {
  const [formData, setFormData] = useState<ShippingAddress>(
    initialData || {
      fullName: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phone: '',
    }
  );

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Please enter your full name';
        return undefined;
      case 'addressLine1':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 5) return 'Please enter a valid address';
        return undefined;
      case 'city':
        if (!value.trim()) return 'City is required';
        return undefined;
      case 'state':
        if (!value) return 'State is required';
        return undefined;
      case 'zipCode':
        if (!value.trim()) return 'ZIP code is required';
        if (!/^\d{5}(-\d{4})?$/.test(value.trim()) && formData.country === 'US') {
          return 'Please enter a valid US ZIP code';
        }
        return undefined;
      case 'country':
        if (!value) return 'Country is required';
        return undefined;
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        // Allow various phone formats
        const cleanedPhone = value.replace(/\D/g, '');
        if (cleanedPhone.length < 10) return 'Please enter a valid phone number';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let hasErrors = false;

    const requiredFields = ['fullName', 'addressLine1', 'city', 'state', 'zipCode', 'country', 'phone'];
    
    requiredFields.forEach(field => {
      const value = formData[field as keyof ShippingAddress] || '';
      const error = validateField(field, value);
      if (error) {
        newErrors[field as keyof FormErrors] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setTouched({
      fullName: true,
      addressLine1: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      phone: true,
    });

    return !hasErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Clean up the data before submitting
      const cleanedData: ShippingAddress = {
        fullName: formData.fullName.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2?.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state,
        zipCode: formData.zipCode.trim(),
        country: formData.country,
        phone: formData.phone.trim(),
      };
      onSubmit(cleanedData);
    }
  };

  const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    if (touched.phone) {
      const error = validateField('phone', formatted);
      setErrors(prev => ({ ...prev, phone: error }));
    }
  };

  const isUS = formData.country === 'US';

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Full Name */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
          <User className="w-3 h-3 inline mr-1" />
          Full Name
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="John Doe"
          className={cn(
            "w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20",
            "focus:outline-none focus:border-neon-green transition-colors",
            errors.fullName && touched.fullName ? "border-red-500" : "border-white/10"
          )}
        />
        <AnimatePresence>
          {errors.fullName && touched.fullName && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-500 text-xs mt-1 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.fullName}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Address Line 1 */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
          <MapPin className="w-3 h-3 inline mr-1" />
          Address
        </label>
        <input
          type="text"
          name="addressLine1"
          value={formData.addressLine1}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="123 Main Street"
          className={cn(
            "w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20",
            "focus:outline-none focus:border-neon-green transition-colors",
            errors.addressLine1 && touched.addressLine1 ? "border-red-500" : "border-white/10"
          )}
        />
        <AnimatePresence>
          {errors.addressLine1 && touched.addressLine1 && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-500 text-xs mt-1 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.addressLine1}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Address Line 2 */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
          Apartment, Suite, etc. (optional)
        </label>
        <input
          type="text"
          name="addressLine2"
          value={formData.addressLine2 || ''}
          onChange={handleChange}
          placeholder="Apt 4B"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-neon-green transition-colors"
        />
      </div>

      {/* Country */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
          Country
        </label>
        <select
          name="country"
          value={formData.country}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "w-full bg-white/5 border rounded-xl px-4 py-3 text-white",
            "focus:outline-none focus:border-neon-green transition-colors appearance-none cursor-pointer",
            errors.country && touched.country ? "border-red-500" : "border-white/10"
          )}
        >
          {COUNTRIES.map(country => (
            <option key={country.code} value={country.code} className="bg-dark-bg">
              {country.name}
            </option>
          ))}
        </select>
        <AnimatePresence>
          {errors.country && touched.country && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-500 text-xs mt-1 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.country}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* City, State, ZIP - Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* City */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
            City
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Los Angeles"
            className={cn(
              "w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20",
              "focus:outline-none focus:border-neon-green transition-colors",
              errors.city && touched.city ? "border-red-500" : "border-white/10"
            )}
          />
          <AnimatePresence>
            {errors.city && touched.city && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-xs mt-1"
              >
                {errors.city}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* State (US) or Region (other countries) */}
        {isUS ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
              State
            </label>
            <select
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              className={cn(
                "w-full bg-white/5 border rounded-xl px-4 py-3 text-white",
                "focus:outline-none focus:border-neon-green transition-colors appearance-none cursor-pointer",
                errors.state && touched.state ? "border-red-500" : "border-white/10"
              )}
            >
              <option value="" className="bg-dark-bg">Select</option>
              {US_STATES.map(state => (
                <option key={state} value={state} className="bg-dark-bg">{state}</option>
              ))}
            </select>
            <AnimatePresence>
              {errors.state && touched.state && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.state}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
              Region / Province
            </label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Region"
              className={cn(
                "w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20",
                "focus:outline-none focus:border-neon-green transition-colors",
                errors.state && touched.state ? "border-red-500" : "border-white/10"
              )}
            />
            <AnimatePresence>
              {errors.state && touched.state && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-500 text-xs mt-1"
                >
                  {errors.state}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ZIP Code */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
            {isUS ? 'ZIP Code' : 'Postal Code'}
          </label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={isUS ? '90001' : 'A1A 1A1'}
            maxLength={isUS ? 10 : 15}
            className={cn(
              "w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20",
              "focus:outline-none focus:border-neon-green transition-colors",
              errors.zipCode && touched.zipCode ? "border-red-500" : "border-white/10"
            )}
          />
          <AnimatePresence>
            {errors.zipCode && touched.zipCode && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-xs mt-1"
              >
                {errors.zipCode}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
          <Phone className="w-3 h-3 inline mr-1" />
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handlePhoneChange}
          onBlur={handleBlur}
          placeholder="(555) 123-4567"
          className={cn(
            "w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder-white/20",
            "focus:outline-none focus:border-neon-green transition-colors",
            errors.phone && touched.phone ? "border-red-500" : "border-white/10"
          )}
        />
        <AnimatePresence>
          {errors.phone && touched.phone && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-500 text-xs mt-1 flex items-center gap-1"
            >
              <AlertCircle className="w-3 h-3" />
              {errors.phone}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl font-bold text-white/60 hover:text-white hover:border-white/30 transition-all"
        >
          CANCEL
        </button>
        <button
          type="submit"
          className="flex-1 bg-neon-green text-black py-3 rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          CONTINUE TO PAYMENT
        </button>
      </div>
    </motion.form>
  );
}