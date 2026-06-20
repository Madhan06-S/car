'use client';

import { supabase } from '@/lib/supabase';

interface BookingData {
  booking_id: string;
  user_id: string;
  user_email: string;
  user_phone?: string;
  vehicle_name: string;
  pickup_date: string;
  return_date: string;
  pickup_location: string;
  drop_location: string;
  total_amount: number;
}

export async function sendBookingNotification(type: 'booking_confirmed' | 'pickup_reminder' | 'payment_receipt', bookingData: BookingData) {
  try {
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        user_email: bookingData.user_email,
        user_phone: bookingData.user_phone,
        booking_data: bookingData,
      }),
    });

    const data = await res.json();
    console.log('Notification sent:', data);
    return data;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return { success: false };
  }
}

export async function createInAppNotification(userId: string, title: string, message: string, type: string = 'booking') {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    read: false,
  });

  if (error) {
    console.error('In-app notification error:', error);
  }
}

export async function notifyBookingConfirmed(bookingData: BookingData) {
  // Send email + SMS
  await sendBookingNotification('booking_confirmed', bookingData);
  
  // Create in-app notification
  await createInAppNotification(
    bookingData.user_id,
    'Booking Confirmed! 🎉',
    `Your ${bookingData.vehicle_name} is booked for ${new Date(bookingData.pickup_date).toLocaleDateString('en-IN')}.`,
    'booking'
  );
}

export async function notifyPickupReminder(bookingData: BookingData) {
  await sendBookingNotification('pickup_reminder', bookingData);
  
  await createInAppNotification(
    bookingData.user_id,
    'Pickup Reminder ⏰',
    `Your ${bookingData.vehicle_name} pickup is tomorrow at ${bookingData.pickup_location}.`,
    'reminder'
  );
}
