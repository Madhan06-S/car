'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';

interface PickupPoint {
  name: string;
  lat: number;
  lng: number;
  address: string;
}

const pickupPoints: PickupPoint[] = [
  { name: 'Gandhipuram', lat: 11.0168, lng: 76.9558, address: 'Central Bus Stand, Gandhipuram' },
  { name: 'RS Puram', lat: 11.0100, lng: 76.9400, address: 'RS Puram Main Road' },
  { name: 'Peelamedu', lat: 11.0300, lng: 77.0200, address: 'Near PSG College' },
  { name: 'CJB Airport', lat: 11.0300, lng: 77.0400, address: 'Coimbatore International Airport' },
  { name: 'Singanallur', lat: 11.0000, lng: 77.0300, address: 'Singanallur Bus Stand' },
  { name: 'Ukkadam', lat: 10.9900, lng: 76.9600, address: 'Ukkadam Bus Terminus' },
  { name: 'Saibaba Colony', lat: 11.0200, lng: 76.9500, address: 'Saibaba Colony Main Road' },
  { name: 'Race Course', lat: 10.9950, lng: 76.9700, address: 'Near Race Course Ground' },
];

export default function GoogleMapPickup() {
  const [selectedPoint, setSelectedPoint] = useState<PickupPoint | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [distances, setDistances] = useState<Record<string, number>>({});

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        () => console.log('Location access denied')
      );
    }
  }, []);

  useEffect(() => {
    if (!userLocation) return;
    const dists: Record<string, number> = {};
    pickupPoints.forEach(point => {
      dists[point.name] = calculateDistance(userLocation.lat, userLocation.lng, point.lat, point.lng);
    });
    setDistances(dists);
  }, [userLocation]);

  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  }

  function openDirections(point: PickupPoint) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`, '_blank');
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full h-64 rounded-xl overflow-hidden bg-[#1a1a1a]">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d125406.3!2d76.9558!3d11.0168!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1"
        />
        <div className="absolute bottom-4 right-4">
          <a href="https://www.google.com/maps/search/RideKovai+Pickup+Coimbatore" target="_blank"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm flex items-center gap-2 transition-colors border border-red-500">
            <ExternalLink className="w-4 h-4" /> Open in Google Maps
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {pickupPoints.map(point => (
          <button
            key={point.name}
            onClick={() => setSelectedPoint(point)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
              selectedPoint?.name === point.name ? 'border-red-500 bg-red-500/10' : 'border-white/5 hover:border-white/10 hover:bg-white/5'
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selectedPoint?.name === point.name ? 'bg-red-500' : 'bg-white/10'}`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium">{point.name}</p>
              <p className="text-sm text-gray-400 truncate">{point.address}</p>
              {distances[point.name] && <p className="text-xs text-amber-400 mt-1">{distances[point.name]} km away</p>}
            </div>
            <button onClick={(e) => { e.stopPropagation(); openDirections(point); }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Get Directions">
              <Navigation className="w-4 h-4 text-gray-400" />
            </button>
          </button>
        ))}
      </div>

      {selectedPoint && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="font-medium text-red-400 mb-1">Selected: {selectedPoint.name}</p>
          <p className="text-sm text-gray-400">{selectedPoint.address}</p>
          <button onClick={() => openDirections(selectedPoint)}
            className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors inline-flex items-center gap-2">
            <Navigation className="w-4 h-4" /> Get Directions
          </button>
        </div>
      )}
    </div>
  );
}
