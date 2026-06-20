import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, user_id, booking_id } = body;

    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user_id)
      .single();

    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles (name, category)
      `)
      .eq('id', booking_id)
      .single();

    let emailSubject = '';
    let emailBody = '';

    switch (type) {
      case 'booking_confirmation':
        emailSubject = `RideKovai - Booking Confirmed #${booking_id.slice(0, 8)}`;
        emailBody = `
          <h1>Booking Confirmed!</h1>
          <p>Hi ${profile?.full_name || 'Driver'},</p>
          <p>Your booking for <strong>${booking?.vehicles?.name}</strong> has been confirmed.</p>
          <ul>
            <li>Pickup: ${new Date(booking?.pickup_date).toLocaleDateString()} from ${booking?.pickup_location}</li>
            <li>Return: ${new Date(booking?.return_date).toLocaleDateString()} to ${booking?.drop_location}</li>
            <li>Amount: ₹${booking?.total_amount?.toLocaleString()}</li>
          </ul>
          <p>Thank you for choosing RideKovai!</p>
        `;
        break;

      case 'payment_receipt':
        emailSubject = `RideKovai - Payment Receipt #${booking_id.slice(0, 8)}`;
        emailBody = `
          <h1>Payment Received</h1>
          <p>Hi ${profile?.full_name || 'Driver'},</p>
          <p>We received your payment of <strong>₹${booking?.total_amount?.toLocaleString()}</strong> for ${booking?.vehicles?.name}.</p>
          <p>Your booking is now confirmed!</p>
        `;
        break;

      case 'pickup_reminder':
        emailSubject = `RideKovai - Pickup Tomorrow!`;
        emailBody = `
          <h1>Pickup Reminder</h1>
          <p>Hi ${profile?.full_name || 'Driver'},</p>
          <p>Your <strong>${booking?.vehicles?.name}</strong> is ready for pickup tomorrow at ${booking?.pickup_location}.</p>
          <p>Don't forget to bring your driving license!</p>
        `;
        break;

      case 'kyc_verified':
        emailSubject = `RideKovai - KYC Verified!`;
        emailBody = `
          <h1>KYC Verification Complete</h1>
          <p>Hi ${profile?.full_name || 'Driver'},</p>
          <p>Your documents have been verified. You can now book vehicles!</p>
        `;
        break;

      default:
        return NextResponse.json({ success: false, message: 'Unknown email type' }, { status: 400 });
    }

    await supabase.from('email_logs').insert({
      user_id,
      booking_id,
      type,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    await supabase.from('notifications').insert({
      user_id,
      type: type === 'kyc_verified' ? 'kyc' : 'booking',
      title: emailSubject,
      message: `Email sent: ${emailSubject}`,
      data: { booking_id, type }
    });

    return NextResponse.json({
      success: true,
      message: `Email queued: ${emailSubject}`,
    });

  } catch (error: any) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
