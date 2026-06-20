import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { randomUUID } from 'crypto';

const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_SECRET;

const isDemoMode =
  !keyId ||
  !keySecret ||
  keyId === 'dummy_key' ||
  keySecret === 'dummy_secret';

function createMockOrder(amountInPaise: number, currency: string, bookingId?: string, customerId?: string) {
  return {
    id: `order_${randomUUID().replace(/-/g, '').slice(0, 14)}`,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency,
    receipt: `RCPT_${randomUUID()}`,
    status: 'created',
    notes: {
      bookingId: bookingId || 'none',
      customerId: customerId || 'none',
      demo: 'true',
    },
  };
}

export async function POST(req: Request) {
  try {
    const { amount, currency, bookingId, customerId } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const amountInPaise = Math.round(amount * 100);
    const orderCurrency = currency || 'INR';

    if (isDemoMode) {
      return NextResponse.json(
        { order: createMockOrder(amountInPaise, orderCurrency, bookingId, customerId) },
        { status: 200 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: orderCurrency,
      receipt: `RCPT_${randomUUID()}`,
      notes: {
        bookingId: bookingId || 'none',
        customerId: customerId || 'none',
      },
    });

    return NextResponse.json({ order }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating order';
    console.error('Razorpay Order error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
