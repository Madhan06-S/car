import { NextRequest, NextResponse } from "next/server";

// Email API using Resend (free tier: 100 emails/day)
// Get API key from: https://resend.com

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, user_email, user_phone, booking_data } = body;

    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      return NextResponse.json({ 
        success: false, 
        message: "Email service not configured" 
      }, { status: 500 });
    }

    let emailSubject = "";
    let emailHtml = "";
    let smsText = "";

    const { vehicle_name, pickup_date, return_date, pickup_location, drop_location, total_amount, booking_id } = booking_data;

    switch (type) {
      case "booking_confirmed":
        emailSubject = `✅ RideKovai - Booking Confirmed #${booking_id?.slice(0, 8)}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 20px; border-radius: 12px;">
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #dc2626; margin: 0;">RideKovai</h1>
              <p style="color: #888; margin: 5px 0;">Your Premium Car Rental</p>
            </div>
            
            <div style="background: #dc2626; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h2 style="margin: 0; color: white;">🎉 Booking Confirmed!</h2>
            </div>
            
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">Booking Details</h3>
              <table style="width: 100%; color: #ccc;">
                <tr><td style="padding: 8px 0;"><strong>Vehicle:</strong></td><td style="text-align: right;">${vehicle_name}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Pickup:</strong></td><td style="text-align: right;">${pickup_location} - ${new Date(pickup_date).toLocaleDateString('en-IN')}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Return:</strong></td><td style="text-align: right;">${drop_location} - ${new Date(return_date).toLocaleDateString('en-IN')}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Amount Paid:</strong></td><td style="text-align: right; color: #dc2626; font-weight: bold;">₹${total_amount?.toLocaleString()}</td></tr>
                <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td style="text-align: right; font-family: monospace;">#${booking_id?.slice(0, 8)}</td></tr>
              </table>
            </div>
            
            <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #dc2626; margin-top: 0;">📍 Pickup Location</h3>
              <p style="color: #ccc;">${pickup_location}, Coimbatore</p>
              <p style="color: #888; font-size: 14px;">Please bring your driving license and ID proof.</p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; color: #888; font-size: 12px;">
              <p>Need help? Contact us at support@ridecovai.com or +91 98765 43210</p>
              <p>© 2026 RideKovai. All rights reserved.</p>
            </div>
          </div>
        `;
        smsText = `RideKovai: Your ${vehicle_name} booking is confirmed! Pickup: ${pickup_location}, ${new Date(pickup_date).toLocaleDateString('en-IN')}. Amount: ₹${total_amount}. Booking ID: #${booking_id?.slice(0, 8)}. Drive safe!`;
        break;

      case "pickup_reminder":
        emailSubject = `⏰ RideKovai - Pickup Tomorrow!`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 20px;">
            <h2 style="color: #dc2626;">Pickup Reminder</h2>
            <p>Your <strong>${vehicle_name}</strong> is ready for pickup tomorrow!</p>
            <p><strong>Date:</strong> ${new Date(pickup_date).toLocaleDateString('en-IN')}</p>
            <p><strong>Location:</strong> ${pickup_location}</p>
            <p>Don't forget your driving license!</p>
          </div>
        `;
        smsText = `RideKovai: Reminder - Your ${vehicle_name} pickup is tomorrow at ${pickup_location}, ${new Date(pickup_date).toLocaleDateString('en-IN')}. Don't forget your license!`;
        break;

      case "payment_receipt":
        emailSubject = `🧾 RideKovai - Payment Receipt #${booking_id?.slice(0, 8)}`;
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 20px;">
            <h2 style="color: #dc2626;">Payment Receipt</h2>
            <p>Thank you for your payment of <strong style="color: #dc2626;">₹${total_amount?.toLocaleString()}</strong></p>
            <p><strong>Vehicle:</strong> ${vehicle_name}</p>
            <p><strong>Booking ID:</strong> #${booking_id?.slice(0, 8)}</p>
            <p>Your booking is confirmed!</p>
          </div>
        `;
        smsText = `RideKovai: Payment of ₹${total_amount} received for ${vehicle_name}. Booking confirmed!`;
        break;

      default:
        return NextResponse.json({ success: false, message: "Unknown notification type" }, { status: 400 });
    }

    // Send Email via Resend
    let emailSent = false;
    try {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "RideKovai <onboarding@resend.dev>",
          to: user_email,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (emailRes.ok) {
        emailSent = true;
      }
    } catch (e) {
      console.error("Email send failed:", e);
    }

    // Send SMS via Fast2SMS (India) - optional
    let smsSent = false;
    if (user_phone && process.env.FAST2SMS_API_KEY) {
      try {
        const smsRes = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            "authorization": process.env.FAST2SMS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "q",
            message: smsText,
            language: "english",
            numbers: user_phone.replace(/\+91|\s/g, ""),
          }),
        });
        if (smsRes.ok) smsSent = true;
      } catch (e) {
        console.error("SMS send failed:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent`,
      email_sent: emailSent,
      sms_sent: smsSent,
    });

  } catch (error: any) {
    console.error("Notification API error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
