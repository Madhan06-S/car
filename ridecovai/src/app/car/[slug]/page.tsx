'use client'

import { use, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Star, Gauge, Users, Fuel, Calendar, Shield, CheckCircle2, MapPin, Tag, ArrowRight, CreditCard, Wallet } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import Reviews from '@/components/Reviews'
import PaymentButton from '@/components/PaymentButton'

const carDetails: Record<string, any> = {
  'maruti-swift': {
    name: 'Maruti Swift', category: 'Hatchback', price: 1999, rating: 4.7,
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db9?w=1200&q=80',
    description: 'The perfect city companion. Compact, fuel-efficient, and easy to park in Coimbatore\'s busy streets.',
    features: ['Power Steering', 'Power Windows', 'Air Conditioning', 'Music System', 'Central Locking', 'ABS'],
    specs: { engine: '1.2L Petrol', power: '83 bhp', torque: '113 Nm', mileage: '22 km/l', fuel: 'Petrol', transmission: 'Manual', seats: 4, boot: '268 L' }
  },
  'honda-city': {
    name: 'Honda City', category: 'Sedan', price: 2899, rating: 4.8,
    image: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200&q=80',
    description: 'Premium comfort for long drives. The Honda City offers spacious interiors and a smooth ride to Ooty or Munnar.',
    features: ['Leather Seats', 'Sunroof', 'Cruise Control', 'Push Start', 'Rear AC Vents', 'Touchscreen'],
    specs: { engine: '1.5L Petrol', power: '119 bhp', torque: '145 Nm', mileage: '18 km/l', fuel: 'Petrol', transmission: 'Automatic', seats: 5, boot: '506 L' }
  },
  'hyundai-creta': {
    name: 'Hyundai Creta', category: 'SUV', price: 3499, rating: 4.9,
    image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=80',
    description: 'The ultimate SUV for Coimbatore roads and hill stations. Panoramic sunroof and ventilated seats.',
    features: ['Panoramic Sunroof', 'Ventilated Seats', 'Wireless Charging', '360 Camera', 'ADAS', '6 Airbags'],
    specs: { engine: '1.5L Diesel', power: '115 bhp', torque: '250 Nm', mileage: '16 km/l', fuel: 'Diesel', transmission: 'Automatic', seats: 5, boot: '433 L' }
  },
  'toyota-innova-crysta': {
    name: 'Toyota Innova Crysta', category: 'MUV', price: 4499, rating: 4.9,
    image: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=1200&q=80',
    description: 'The king of family road trips. 7 seats, captain chairs, and unmatched reliability for long journeys.',
    features: ['Captain Seats', 'Ambient Lighting', 'Rear Entertainment', 'Climate Control', 'Reverse Camera', 'ABS with EBD'],
    specs: { engine: '2.4L Diesel', power: '148 bhp', torque: '343 Nm', mileage: '14 km/l', fuel: 'Diesel', transmission: 'Automatic', seats: 7, boot: '300 L' }
  },
  'mahindra-xuv500': {
    name: 'Mahindra XUV500', category: 'SUV', price: 3999, rating: 4.6,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&q=80',
    description: 'Powerful and rugged. Perfect for off-road adventures around Coimbatore and the Western Ghats.',
    features: ['AWD', 'Sunroof', 'Leather Seats', 'Push Button Start', 'Touchscreen', 'Hill Hold'],
    specs: { engine: '2.2L Diesel', power: '155 bhp', torque: '360 Nm', mileage: '15 km/l', fuel: 'Diesel', transmission: 'Automatic', seats: 7, boot: '93 L' }
  },
  'ford-ecosport': {
    name: 'Ford EcoSport', category: 'Compact SUV', price: 2799, rating: 4.5,
    image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=1200&q=80',
    description: 'Compact SUV with big attitude. Great for city driving and weekend getaways.',
    features: ['SYNC 3', 'Sunroof', 'Rear Parking Sensors', 'Cruise Control', '6 Airbags', 'ESP'],
    specs: { engine: '1.5L Petrol', power: '122 bhp', torque: '149 Nm', mileage: '17 km/l', fuel: 'Petrol', transmission: 'Manual', seats: 5, boot: '352 L' }
  }
}

const locations = ['Gandhipuram', 'RS Puram', 'Peelamedu', 'CJB Airport', 'Singanallur', 'Ukkadam', 'Saibaba Colony', 'Race Course']

export default function CarDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  
  const car = carDetails[slug] || carDetails['maruti-swift']
  
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [pickupLoc, setPickupLoc] = useState('Gandhipuram')
  const [dropLoc, setDropLoc] = useState('Gandhipuram')
  const [promo, setPromo] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'payment_required'>('idle')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [paymentMode, setPaymentMode] = useState<'full' | 'advance'>('full')

  const days = pickupDate && returnDate 
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 1

  const subtotal = car.price * days
  const total = promoApplied ? Math.floor(subtotal * (1 - discount)) : subtotal
  const advanceAmount = Math.floor(total * 0.3)
  const payableNow = paymentMode === 'advance' ? advanceAmount : total

  const applyPromo = () => {
    if (promo.toUpperCase() === 'KOVAI10') {
      setPromoApplied(true)
      setDiscount(0.10)
    } else if (promo.toUpperCase() === 'FIRST50') {
      setPromoApplied(true)
      setDiscount(0.50)
    } else {
      setPromoApplied(false)
      setDiscount(0)
    }
  }

  const handleBook = async () => {
    setBookingStatus('loading')
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      window.location.href = '/login'
      return
    }

    const { data: booking, error } = await supabase.from('bookings').insert({
      user_id: user.id,
      vehicle_id: slug,
      pickup_date: pickupDate,
      return_date: returnDate,
      pickup_location: pickupLoc,
      drop_location: dropLoc,
      total_amount: total,
      advance_amount: advanceAmount,
      payment_mode: paymentMode,
      status: 'pending',
      payment_status: 'pending'
    }).select().single()

    if (error) {
      alert('Booking failed: ' + error.message)
      setBookingStatus('idle')
      return
    }

    setBookingId(booking.id)
    setBookingStatus('payment_required')
  }

  const handlePaymentSuccess = () => {
    setBookingStatus('success')
  }

  const handlePaymentFailure = () => {
    setBookingStatus('payment_required')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            <span className="text-red-500">Ride</span>Covai
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Fleet
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative h-96 lg:h-[600px] rounded-2xl overflow-hidden"
          >
            <Image src={car.image} alt={car.name} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="px-4 py-2 bg-red-600 rounded-full text-sm font-semibold">
                {car.category}
              </span>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-lg font-bold">{car.rating}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{car.name}</h1>
              <p className="text-gray-400 text-lg">{car.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Gauge className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-sm text-gray-400">Engine</p>
                <p className="font-semibold">{car.specs.engine}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Fuel className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-sm text-gray-400">Fuel</p>
                <p className="font-semibold">{car.specs.fuel}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Users className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-sm text-gray-400">Seats</p>
                <p className="font-semibold">{car.specs.seats}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <Calendar className="w-5 h-5 text-red-500 mb-2" />
                <p className="text-sm text-gray-400">Mileage</p>
                <p className="font-semibold">{car.specs.mileage}</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4">Features</h3>
              <div className="flex flex-wrap gap-2">
                {car.features.map((feature: string, i: number) => (
                  <span key={i} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <AvailabilityCalendar 
              vehicleId={slug}
              selectedPickup={pickupDate}
              selectedReturn={returnDate}
              onDateSelect={(type, date) => {
                if (type === 'pickup') setPickupDate(date)
                else setReturnDate(date)
              }}
            />

            {bookingStatus !== 'success' && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-500" />
                  Book Now
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Pickup Location</label>
                    <select
                      value={pickupLoc}
                      onChange={(e) => setPickupLoc(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                    >
                      {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Drop Location</label>
                    <select
                      value={dropLoc}
                      onChange={(e) => setDropLoc(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                    >
                      {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Promo code (try KOVAI10 or FIRST50)"
                    className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none"
                  />
                  <button
                    onClick={applyPromo}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <Tag className="w-5 h-5" />
                  </button>
                </div>
                {promoApplied && (
                  <p className="text-green-400 text-sm">{(discount * 100).toFixed(0)}% discount applied!</p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setPaymentMode('full')}
                    className={`flex-1 py-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                      paymentMode === 'full' 
                        ? 'bg-red-600 border-red-600' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay Full Amount
                  </button>
                  <button
                    onClick={() => setPaymentMode('advance')}
                    className={`flex-1 py-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                      paymentMode === 'advance' 
                        ? 'bg-red-600 border-red-600' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    Pay 30% Advance
                  </button>
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">₹{car.price} × {days} days</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Discount ({(discount * 100).toFixed(0)}%)</span>
                      <span>-₹{(subtotal - total).toLocaleString()}</span>
                    </div>
                  )}
                  {paymentMode === 'advance' && (
                    <div className="flex justify-between text-sm text-amber-400">
                      <span>Advance (30%)</span>
                      <span>₹{advanceAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10">
                    <span>{paymentMode === 'advance' ? 'Pay Now' : 'Total'}</span>
                    <span className="text-red-500">₹{payableNow.toLocaleString()}</span>
                  </div>
                  {paymentMode === 'advance' && (
                    <p className="text-xs text-gray-500">Balance ₹{(total - advanceAmount).toLocaleString()} due at pickup</p>
                  )}
                </div>

                {bookingStatus === 'idle' || bookingStatus === 'loading' ? (
                  <button
                    onClick={handleBook}
                    disabled={bookingStatus === 'loading' || !pickupDate || !returnDate}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-4 font-bold text-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {bookingStatus === 'loading' ? (
                      'Processing...'
                    ) : (
                      <>
                        BOOK NOW
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                ) : bookingStatus === 'payment_required' && bookingId ? (
                  <PaymentButton
                    amount={payableNow}
                    bookingId={bookingId}
                    vehicleName={car.name}
                    onSuccess={handlePaymentSuccess}
                    onFailure={handlePaymentFailure}
                  />
                ) : null}

                {bookingStatus === 'payment_required' && (
                  <p className="text-sm text-amber-400 text-center flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" />
                    Secure payment powered by Razorpay
                  </p>
                )}
              </div>
            )}

            {bookingStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-green-400 mb-2">Booking Confirmed!</h3>
                <p className="text-gray-400 mb-4">Your {car.name} is reserved. Check your email for details.</p>
                <div className="flex gap-4 justify-center">
                  <a 
                    href="/dashboard" 
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
                  >
                    View My Bookings
                  </a>
                  <Link 
                    href="/" 
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-colors"
                  >
                    Book Another Car
                  </Link>
                </div>
              </motion.div>
            )}

            <div>
              <h3 className="text-xl font-bold mb-4">Reviews</h3>
              <Reviews vehicleId={slug} />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
