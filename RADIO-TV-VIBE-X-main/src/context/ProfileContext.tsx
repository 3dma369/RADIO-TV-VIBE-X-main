import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, ShippingAddress } from '../types';
import { db, collection, doc, getDoc, setDoc, updateDoc, serverTimestamp } from '../firebaseConfig';
import { useAuth } from './AuthContext';

interface ProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addShippingAddress: (address: Omit<ShippingAddress, 'id'>) => Promise<void>;
  updateShippingAddress: (addressId: string, address: Partial<ShippingAddress>) => Promise<void>;
  removeShippingAddress: (addressId: string) => Promise<void>;
  setDefaultShippingAddress: (addressId: string) => Promise<void>;
  updateCryptoAddress: (chain: 'ethereum' | 'solana' | 'bitcoin', address: string) => Promise<void>;
  addDonationRecord: (tier: string, amount: number, status: string) => Promise<void>;
  addOrderToHistory: (orderId: string, total: number) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const DEFAULT_NOTIFICATIONS = {
  emailNewMusic: true,
  emailOrders: true,
  emailDonations: true,
  pushNewMusic: false,
  pushOrders: true,
  pushLiveShows: true,
};

const DEFAULT_PROFILE: Omit<UserProfile, 'id' | 'email' | 'displayName' | 'createdAt' | 'updatedAt'> = {
  phone: '',
  avatarUrl: '',
  stripeCustomerId: '',
  cryptoAddresses: {},
  defaultPaymentMethod: 'card',
  shippingAddresses: [],
  defaultShippingAddressId: '',
  orderHistory: [],
  donationHistory: [],
  notifications: DEFAULT_NOTIFICATIONS,
  totalSpent: 0,
  totalDonated: 0,
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load profile when user changes
  useEffect(() => {
    if (!currentUser) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const profileRef = doc(db, 'vibe_x_profiles', currentUser.uid);
        const snap = await getDoc(profileRef);

        if (snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() } as UserProfile);
        } else {
          // Create default profile for new user
          const newProfile: UserProfile = {
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Listener',
            avatarUrl: currentUser.photoURL || '',
            ...DEFAULT_PROFILE,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } catch (error) {
        console.error('[Profile] Failed to load profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const profileRef = doc(db, 'vibe_x_profiles', currentUser.uid);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('[Profile] Failed to update profile:', error);
      throw error;
    }
  };

  const addShippingAddress = async (address: Omit<ShippingAddress, 'id'>) => {
    if (!currentUser || !profile) return;
    const addressId = `addr_${Date.now()}`;
    const newAddress: ShippingAddress = { ...address, id: addressId };

    const updatedAddresses = [...profile.shippingAddresses, newAddress];
    const isFirst = updatedAddresses.length === 1;
    if (isFirst) newAddress.isDefault = true;

    await updateProfile({
      shippingAddresses: updatedAddresses,
      defaultShippingAddressId: isFirst ? addressId : profile.defaultShippingAddressId,
    });
  };

  const updateShippingAddress = async (addressId: string, address: Partial<ShippingAddress>) => {
    if (!currentUser || !profile) return;
    const updatedAddresses = profile.shippingAddresses.map(a =>
      a.id === addressId ? { ...a, ...address } : a
    );
    await updateProfile({ shippingAddresses: updatedAddresses });
  };

  const removeShippingAddress = async (addressId: string) => {
    if (!currentUser || !profile) return;
    const updatedAddresses = profile.shippingAddresses.filter(a => a.id !== addressId);
    const wasDefault = profile.defaultShippingAddressId === addressId;
    await updateProfile({
      shippingAddresses: updatedAddresses,
      defaultShippingAddressId: wasDefault
        ? (updatedAddresses[0]?.id || '')
        : profile.defaultShippingAddressId,
    });
  };

  const setDefaultShippingAddress = async (addressId: string) => {
    if (!currentUser || !profile) return;
    const updatedAddresses = profile.shippingAddresses.map(a => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    await updateProfile({
      shippingAddresses: updatedAddresses,
      defaultShippingAddressId: addressId,
    });
  };

  const updateCryptoAddress = async (chain: 'ethereum' | 'solana' | 'bitcoin', address: string) => {
    if (!currentUser || !profile) return;
    const updated = { [chain]: address };
    await updateProfile({
      cryptoAddresses: { ...profile.cryptoAddresses, ...updated },
    });
  };

  const addDonationRecord = async (tier: string, amount: number, status: string) => {
    if (!currentUser || !profile) return;
    const record = { tier, amount, date: new Date(), status };
    await updateProfile({
      donationHistory: [...(profile.donationHistory || []), record],
      totalDonated: (profile.totalDonated || 0) + amount,
    });
  };

  const addOrderToHistory = async (orderId: string, total: number) => {
    if (!currentUser || !profile) return;
    await updateProfile({
      orderHistory: [...(profile.orderHistory || []), orderId],
      totalSpent: (profile.totalSpent || 0) + total,
    });
  };

  return (
    <ProfileContext.Provider value={{
      profile,
      isLoading,
      updateProfile,
      addShippingAddress,
      updateShippingAddress,
      removeShippingAddress,
      setDefaultShippingAddress,
      updateCryptoAddress,
      addDonationRecord,
      addOrderToHistory,
    }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}