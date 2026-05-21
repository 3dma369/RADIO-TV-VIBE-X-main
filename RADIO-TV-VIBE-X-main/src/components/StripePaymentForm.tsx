import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripe, createPaymentIntent, calculateOrderTotal } from '../services/stripeService';
import { ShippingAddress } from '../services/orderService';
import { createOrder, OrderItem, markOrderAsPaid } from '../services/orderService';
import { CartItem } from '../types';
import { cn } from '../utils';

interface StripePaymentFormProps {
  cart: CartItem[];
  shippingAddress: ShippingAddress;
  userId: string;
  userEmail: string;
  donorTier?: string;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

function PaymentForm({
  cart,
  shippingAddress,
  userId,
  userEmail,
  donorTier,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const discountPercent = donorTier === 'Legend' ? 25 : donorTier === 'Vibe Master' ? 10 : 0;
  const { total } = calculateOrderTotal(cart, discountPercent);

  const handleCardChange = (event: any) => {
    setCardError(event.error ? event.error.message : null);
    setCardComplete(event.complete);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe is not loaded. Please refresh the page.');
      return;
    }

    if (!cardComplete) {
      onError('Please complete your card details');
      return;
    }

    setIsProcessing(true);
    setCardError(null);

    try {
      // Create payment intent on backend
      const response = await createPaymentIntent({
        items: cart,
        shippingAddress,
        userId,
        donorTier,
        discountPercent,
      });

      const { clientSecret, paymentIntentId } = response;

      // For this integration, we'll use the PaymentIntent confirmation approach
      // Since we have the clientSecret, we can confirm the payment with the CardElement

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method first
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: shippingAddress.fullName,
          email: userEmail,
          phone: shippingAddress.phone,
          address: {
            line1: shippingAddress.addressLine1,
            line2: shippingAddress.addressLine2 || undefined,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postal_code: shippingAddress.zipCode,
            country: shippingAddress.country,
          },
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Confirm payment with the PaymentIntent
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod.id,
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order in Firestore
        const orderItems: OrderItem[] = cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          isDigital: item.category === 'digital' || item.category === 'music',
          filePath: item.downloadUrl ? `products/${item.id}` : undefined,
        }));

        const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountAmount = subtotal * (discountPercent / 100);

        const orderData = {
          userId,
          userEmail,
          items: orderItems,
          subtotal,
          discountAmount,
          discountPercent,
          total: subtotal - discountAmount,
          status: 'processing' as const,
          shippingAddress,
          stripePaymentIntentId: paymentIntentId,
          stripePaymentStatus: paymentIntent.status,
          downloadLinks: [],
        };

        const orderId = await createOrder(orderData);
        await markOrderAsPaid(orderId, paymentIntentId, paymentIntent.status);
        
        onSuccess(orderId);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      onError(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#ffffff',
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: '16px',
        '::placeholder': {
          color: 'rgba(255, 255, 255, 0.3)',
        },
        iconColor: '#00ff00',
      },
      invalid: {
        color: '#ff4444',
        iconColor: '#ff4444',
      },
    },
    hidePostalCode: true,
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Element */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
          <CreditCard className="w-3 h-3 inline mr-1" />
          Card Details
        </label>
        <div className={cn(
          "bg-white/5 border rounded-xl px-4 py-3 transition-colors",
          cardError ? "border-red-500" : "border-white/10 focus-within:border-neon-green"
        )}>
          <CardElement options={CARD_ELEMENT_OPTIONS} onChange={handleCardChange} />
        </div>
        {cardError && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-red-500 text-xs mt-2 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" />
            {cardError}
          </motion.p>
        )}
      </div>

      {/* Security Notice */}
      <div className="bg-neon-green/10 border border-neon-green/20 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-4 h-4 text-neon-green mt-0.5 flex-shrink-0" />
        <p className="text-xs text-white/60 leading-relaxed">
          Your payment is secured with 256-bit SSL encryption. We never store your card details.
        </p>
      </div>

      {/* Total */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-white/50 font-bold uppercase tracking-widest text-xs">Total</span>
          <span className="text-3xl font-bold tracking-tighter neon-text">
            ${(total / 100).toFixed(2)}
          </span>
        </div>
        {donorTier && discountPercent > 0 && (
          <p className="text-xs text-neon-green text-right mt-1">
            {donorTier} discount applied ({discountPercent}%)
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={cn(
          "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2",
          "transition-all hover:scale-[1.02] active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
          isProcessing ? "bg-neon-green/50" : "bg-neon-green text-black shadow-[0_0_30px_rgba(0,255,0,0.2)]"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            PROCESSING PAYMENT...
          </>
        ) : (
          <>
            <CheckCircle className="w-4 h-4" />
            PAY ${(total / 100).toFixed(2)}
          </>
        )}
      </button>
    </form>
  );
}

// Wrapper component that loads Stripe Elements with the provider
export default function StripePaymentForm(props: StripePaymentFormProps) {
  const [stripe, setStripe] = useState<any>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    getStripe().then(stripeInstance => {
      if (stripeInstance) {
        setStripe(stripeInstance);
      } else {
        setStripeError('Failed to load Stripe. Please refresh the page.');
      }
    }).catch(() => {
      setStripeError('Failed to load Stripe. Please refresh the page.');
    });
  }, []);

  if (stripeError) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-red-500 font-bold">{stripeError}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!stripe) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-neon-green" />
      </div>
    );
  }

  return (
    <Elements stripe={stripe}>
      <PaymentForm {...props} />
    </Elements>
  );
}