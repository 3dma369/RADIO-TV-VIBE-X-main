import { loadStripe, Stripe } from '@stripe/stripe-js';
import { CartItem, ShippingAddress } from '../types';

// Stripe publishable key from env
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51TZLjgRhdimqqZ8bczdAVrMAFg8PnJse5u3yFerSNP3hLMquUVQbgYCgtlaZp9r1npY0ojm2YWEuotgDr2wS5nRO00CvYtFiIr';

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export interface CreatePaymentIntentRequest {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  userId: string;
  donorTier?: string;
  discountPercent?: number;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  total: number;
}

export const createPaymentIntent = async (
  request: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const confirmPayment = async (
  clientSecret: string,
  stripe: Stripe
): Promise<{ success: boolean; error?: string; paymentIntent?: any }> => {
  try {
    const { error, paymentIntent } = await stripe.confirmPayment({
      confirmation_token: clientSecret,
      // Use confirmCardPayment for card element approach
      // confirmCardPayment requires clientSecret from PaymentIntent
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, paymentIntent };
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return { success: false, error: error.message || 'Payment confirmation failed' };
  }
};

export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<any> => {
  try {
    const response = await fetch(`/api/payment-intent/${paymentIntentId}`);
    if (!response.ok) throw new Error('Failed to retrieve payment intent');
    return await response.json();
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};

// Calculate order total with discounts
export const calculateOrderTotal = (
  items: CartItem[],
  discountPercent: number = 0
): { subtotal: number; discount: number; total: number } => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = subtotal * (discountPercent / 100);
  const total = subtotal - discount;
  
  return {
    subtotal: Math.round(subtotal * 100), // Stripe works in cents
    discount: Math.round(discount * 100),
    total: Math.round(total * 100),
  };
};