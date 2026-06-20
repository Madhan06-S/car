'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

interface AvailabilityCalendarProps {
  vehicleId: string;
  selectedPickup: string;
  selectedReturn: string;
  onDateSelect: (type: 'pickup' | 'return', date: string) => void;
}

export default function AvailabilityCalendar({ 
  vehicleId, 
  selectedPickup, 
  selectedReturn, 
  onDateSelect 
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookedDates();
  }, [vehicleId, currentMonth]);

  async function fetchBookedDates() {
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const { data } = await supabase
      .from('bookings')
      .select('pickup_date, return_date')
      .eq('vehicle_id', vehicleId)
      .neq('status', 'cancelled')
      .gte('pickup_date', startOfMonth.toISOString())
      .lte('pickup_date', endOfMonth.toISOString());

    if (data) {
      const dates: string[] = [];
      data.forEach(booking => {
        const start = new Date(booking.pickup_date);
        const end = new Date(booking.return_date);
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
      });
      setBookedDates(dates);
    }
    setLoading(false);
  }

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    
    return days;
  };

  const isDateBooked = (dateStr: string) => bookedDates.includes(dateStr);
  const isDateSelected = (dateStr: string) => dateStr === selectedPickup || dateStr === selectedReturn;
  const isInRange = (dateStr: string) => {
    if (!selectedPickup || !selectedReturn) return false;
    const date = new Date(dateStr);
    const pickup = new Date(selectedPickup);
    const ret = new Date(selectedReturn);
    return date > pickup && date < ret;
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (isDateBooked(dateStr)) return;
    
    if (!selectedPickup || (selectedPickup && selectedReturn)) {
      onDateSelect('pickup', dateStr);
      onDateSelect('return', '');
    } else if (selectedPickup && !selectedReturn) {
      if (new Date(dateStr) < new Date(selectedPickup)) {
        onDateSelect('pickup', dateStr);
      } else {
        onDateSelect('return', dateStr);
      }
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-red-500" />
          Availability Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-medium min-w-[120px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading calendar...</div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm text-gray-400 py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, index) => {
              if (!day) return <div key={index} className="h-10" />;
              
              const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isBooked = isDateBooked(dateStr);
              const isSelected = isDateSelected(dateStr);
              const inRange = isInRange(dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  key={day}
                  onClick={() => handleDateClick(day)}
                  disabled={isBooked}
                  className={`
                    h-10 rounded-lg text-sm transition-all relative cursor-pointer
                    ${isBooked ? 'bg-red-500/20 text-red-400 cursor-not-allowed line-through' : ''}
                    ${isSelected ? 'bg-red-600 text-white font-bold' : ''}
                    ${inRange ? 'bg-red-600/30 text-white' : ''}
                    ${!isBooked && !isSelected && !inRange ? 'hover:bg-white/10 text-white' : ''}
                    ${isToday && !isSelected ? 'border border-red-500' : ''}
                  `}
                >
                  {day}
                  {isBooked && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full" />}
                </button>
              );
            })}
          </div>

          <div className="flex gap-4 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600 rounded" /> Selected</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500/20 rounded border border-red-500/30" /> Booked</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-600/30 rounded" /> In Range</span>
          </div>

          {(selectedPickup || selectedReturn) && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20"
            >
              <p className="text-sm">
                <span className="text-gray-400">Pickup:</span>{' '}
                <span className="text-white font-medium">
                  {selectedPickup ? new Date(selectedPickup).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Select date'}
                </span>
              </p>
              <p className="text-sm mt-1">
                <span className="text-gray-400">Return:</span>{' '}
                <span className="text-white font-medium">
                  {selectedReturn ? new Date(selectedReturn).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Select date'}
                </span>
              </p>
              {selectedPickup && selectedReturn && (
                <p className="text-sm mt-2 text-red-400 font-semibold">
                  Duration: {Math.ceil((new Date(selectedReturn).getTime() - new Date(selectedPickup).getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
