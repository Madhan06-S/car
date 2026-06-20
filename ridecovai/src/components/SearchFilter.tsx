'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface Filters {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  transmission: string;
  fuel: string;
  minSeats: number;
  sortBy: string;
}

interface SearchFilterProps {
  filters: Filters;
  onFilterChange: React.Dispatch<React.SetStateAction<Filters>>;
}

export default function SearchFilter({ filters, onFilterChange }: SearchFilterProps) {
  const handleChange = (key: keyof Filters, value: any) => {
    onFilterChange((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const categories = ['All', 'Hatchback', 'Sedan', 'SUV', 'MUV'];
  const transmissions = ['All', 'Manual', 'Automatic'];
  const fuels = ['All', 'Petrol', 'Diesel'];

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by model, brand, tags..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors text-sm"
          />
        </div>

        {/* Category */}
        <div className="relative">
          <select
            value={filters.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors text-sm appearance-none cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="bg-[#121212] text-white">
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div className="relative">
          <select
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:outline-none transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="popular" className="bg-[#121212] text-white">Sort By: Popular</option>
            <option value="price-low" className="bg-[#121212] text-white">Price: Low to High</option>
            <option value="price-high" className="bg-[#121212] text-white">Price: High to Low</option>
            <option value="rating" className="bg-[#121212] text-white">Customer Rating</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="border-t border-white/10 pt-4 mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Transmission */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Transmission</label>
          <div className="flex gap-2">
            {transmissions.map((t) => (
              <button
                key={t}
                onClick={() => handleChange('transmission', t === 'Automatic' ? 'Auto' : t)}
                className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-all ${
                  (filters.transmission === 'Auto' && t === 'Automatic') || filters.transmission === t
                    ? 'border-red-500 bg-red-500/10 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Fuel */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Fuel Type</label>
          <div className="flex gap-2">
            {fuels.map((f) => (
              <button
                key={f}
                onClick={() => handleChange('fuel', f)}
                className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-all ${
                  filters.fuel === f
                    ? 'border-red-500 bg-red-500/10 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Min Seats */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Min Seats</label>
          <div className="flex gap-2">
            {[0, 4, 5, 7].map((s) => (
              <button
                key={s}
                onClick={() => handleChange('minSeats', s)}
                className={`flex-1 py-2 text-xs rounded-lg border font-medium transition-all ${
                  filters.minSeats === s
                    ? 'border-red-500 bg-red-500/10 text-white'
                    : 'border-white/10 hover:border-white/20 text-gray-400'
                }`}
              >
                {s === 0 ? 'Any' : `${s}+`}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs text-gray-400 uppercase tracking-wider font-semibold">Max Price: ₹{filters.maxPrice}/day</label>
          </div>
          <input
            type="range"
            min="1000"
            max="10000"
            step="500"
            value={filters.maxPrice}
            onChange={(e) => handleChange('maxPrice', parseInt(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
          />
        </div>
      </div>
    </div>
  );
}
