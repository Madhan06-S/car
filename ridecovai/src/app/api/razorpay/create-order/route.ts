import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, booking_id, vehicle_name } = body;

    if (!amount || !booking_id) {
      return NextResponse.json(
        { success: false, message: "Amount and booking_id are required" },
        { status: 400 }
      );
    }

    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, message: "Razorpay keys not configured" },
        { status: 500 }
      );
    }

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `b_${booking_id.slice(0, 8)}_${Date.now()}`,
      notes: {
        booking_id: booking_id,
        vehicle_name: vehicle_name || 'RideKovai Booking',
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    }, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
