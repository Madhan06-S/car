'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Loader2, Smartphone, AlertCircle } from 'lucide-react';
import Script from 'next/script';
import { notifyBookingConfirmed } from '@/lib/notificationService';

interface PaymentButtonProps {
  amount: number;
  bookingId: string;
  vehicleName: string;
  onSuccess?: () => void;
  onFailure?: () => void;
}

export default function PaymentButton({ 
  amount, 
  bookingId, 
  vehicleName,
  onSuccess,
  onFailure 
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!key || key.includes('YOUR_KEY')) {
      setError('Razorpay key not configured in .env.local');
    }
  }, []);

  const handlePayment = async () => {
    setError(null);
    
    if (!scriptLoaded) {
      setError('Payment system loading... Please wait and try again.');
      return;
    }

    const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKey || razorpayKey.includes('YOUR_KEY')) {
      setError('Razorpay key missing. Add NEXT_PUBLIC_RAZORPAY_KEY_ID to .env.local');
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create order
      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          booking_id: bookingId,
          vehicle_name: vehicleName,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to create payment order');
      }

      // Step 2: Get user details
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user?.id)
        .single();

      // Step 3: Open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        name: 'RideKovai',
        description: `${vehicleName} - Booking #${bookingId.slice(0, 8)}`,
        order_id: orderData.data.id,
        handler: async function (response: any) {
          try {
            // Step 4: Verify payment on server
            const verifyRes = await fetch('/api/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                booking_id: bookingId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed');
            }

            // Step 5: Update booking in database
            console.log('Updating booking:', bookingId);
            
            const { data: updateData, error: updateError } = await supabase
              .from('bookings')
              .update({
                payment_status: 'paid',
                status: 'confirmed',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                paid_at: new Date().toISOString(),
              })
              .eq('id', bookingId)
              .select();

            if (updateError) {
              console.error('Booking update error:', updateError);
              setError('Payment successful but booking update failed: ' + updateError.message);
              onFailure?.();
              return;
            }

            console.log('Booking updated successfully:', updateData);
            
            // Step 6: Create payment record
            await supabase.from('payments').insert({
              booking_id: bookingId,
              user_id: user?.id,
              amount: amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              status: 'completed',
              payment_method: 'razorpay',
            });

            // Step 7: Send Email + SMS Notification
            if (user?.email) {
              try {
                await notifyBookingConfirmed({
                  booking_id: bookingId,
                  user_id: user.id,
                  user_email: user.email,
                  user_phone: profile?.phone || '',
                  vehicle_name: vehicleName,
                  pickup_date: updateData?.[0]?.pickup_date || '',
                  return_date: updateData?.[0]?.return_date || '',
                  pickup_location: updateData?.[0]?.pickup_location || 'Gandhipuram',
                  drop_location: updateData?.[0]?.drop_location || 'Gandhipuram',
                  total_amount: amount,
                });
              } catch (notifError) {
                console.error('Notification error:', notifError);
                // Don't fail if notification fails
              }
            }

            onSuccess?.();

          } catch (error: any) {
            console.error('Payment verification error:', error);
            setError('Payment failed: ' + error.message);
            onFailure?.();
          }
        },
        prefill: {
          name: profile?.full_name || user?.email?.split('@')[0] || 'Customer',
          email: user?.email || '',
          contact: profile?.phone || '',
        },
        theme: {
          color: '#dc2626',
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      
      razorpay.on('payment.failed', function (response: any) {
        setError('Payment failed: ' + (response.error?.description || 'Please try again'));
        setLoading(false);
        onFailure?.();
      });

      razorpay.open();

    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message);
      setLoading(false);
      onFailure?.();
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptLoaded(true)}
        onError={() => setError('Failed to load payment system')}
        strategy="afterInteractive"
      />
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={loading || !scriptLoaded}
        className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Smartphone className="w-5 h-5" />
            PAY ₹{amount.toLocaleString()} NOW
          </>
        )}
      </button>
      
      {!scriptLoaded && !error && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Loading payment system...
        </p>
      )}
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        UPI • Cards • Net Banking • Wallet
      </p>
    </>
  );
}
