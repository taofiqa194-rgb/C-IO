import React from 'react';
import { ProductCategory, ItemCondition } from '../types';
import { PRODUCT_CATEGORIES, UNILORIN_CAMPUS_LOCATIONS } from '../data/mockData';
import { X, SlidersHorizontal, CheckCircle2, RotateCcw } from 'lucide-react';

export interface FilterState {
  category: string;
  campusLocation: string;
  condition: string;
  onlySubscriptions: boolean;
  onlyVerifiedStudents: boolean;
  onlyBusinesses: boolean;
  maxPrice: number;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular';
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onUpdateFilters: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
  totalResultsCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-2xs">
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#E0E0D5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#5A5A40]" />
            <h3 className="font-serif font-bold text-base text-[#2D2D2A]">Filter Marketplace</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[#7A7A6A] hover:bg-[#F5F5F0] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Filter Options */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Quick Toggles */}
          <div className="space-y-2">
            <label className="font-bold text-[#2D2D2A] block">Trust & Types:</label>
            
            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5] cursor-pointer hover:bg-[#E8E8DF] transition">
              <input
                type="checkbox"
                checked={filters.onlySubscriptions}
                onChange={(e) => onUpdateFilters({ onlySubscriptions: e.target.checked })}
                className="w-4 h-4 rounded text-[#5A5A40] accent-[#5A5A40]"
              />
              <span className="font-semibold text-[#2D2D2A]">🎟️ Student Subscriptions Only</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5] cursor-pointer hover:bg-[#E8E8DF] transition">
              <input
                type="checkbox"
                checked={filters.onlyVerifiedStudents}
                onChange={(e) => onUpdateFilters({ onlyVerifiedStudents: e.target.checked })}
                className="w-4 h-4 rounded text-[#5A5A40] accent-[#5A5A40]"
              />
              <span className="font-semibold text-[#2D2D2A]">
                ✓ Student Verified Sellers (Matric badge)
              </span>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5] cursor-pointer hover:bg-[#E8E8DF] transition">
              <input
                type="checkbox"
                checked={filters.onlyBusinesses}
                onChange={(e) => onUpdateFilters({ onlyBusinesses: e.target.checked })}
                className="w-4 h-4 rounded text-[#5A5A40] accent-[#5A5A40]"
              />
              <span className="font-semibold text-[#2D2D2A]">🏢 Campus Business Stores</span>
            </label>
          </div>

          {/* Category */}
          <div>
            <label className="font-bold text-[#2D2D2A] block mb-1.5">Category:</label>
            <select
              value={filters.category}
              onChange={(e) => onUpdateFilters({ category: e.target.value })}
              className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] p-2 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
            >
              <option value="All">All Categories</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Location */}
          <div>
            <label className="font-bold text-[#2D2D2A] block mb-1.5">University of Ilorin Mini Campus Location:</label>
            <select
              value={filters.campusLocation}
              onChange={(e) => onUpdateFilters({ campusLocation: e.target.value })}
              className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] p-2 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
            >
              <option value="All">All Mini Campus Locations</option>
              {UNILORIN_CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Item Condition */}
          <div>
            <label className="font-bold text-[#2D2D2A] block mb-1.5">Condition:</label>
            <select
              value={filters.condition}
              onChange={(e) => onUpdateFilters({ condition: e.target.value })}
              className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] p-2 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
            >
              <option value="All">All Conditions</option>
              <option value="Brand New">Brand New</option>
              <option value="Like New">Like New</option>
              <option value="Fairly Used">Fairly Used</option>
              <option value="Digital / Account Access">Digital / Account Access</option>
            </select>
          </div>

          {/* Max Price Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#2D2D2A]">Max Budget:</label>
              <span className="font-bold text-[#5A5A40]">
                {filters.maxPrice >= 200000 ? 'Any Price' : `Up to ₦${filters.maxPrice.toLocaleString()}`}
              </span>
            </div>
            <input
              type="range"
              min={1000}
              max={200000}
              step={1000}
              value={filters.maxPrice}
              onChange={(e) => onUpdateFilters({ maxPrice: Number(e.target.value) })}
              className="w-full accent-[#5A5A40]"
            />
            <div className="flex justify-between text-[10px] text-[#A0A090] mt-1">
              <span>₦1,000</span>
              <span>₦50,000</span>
              <span>₦200,000+</span>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="font-bold text-[#2D2D2A] block mb-1.5">Sort Order:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'newest', label: 'Latest First' },
                { id: 'popular', label: 'Most Views' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onUpdateFilters({ sortBy: s.id as FilterState['sortBy'] })}
                  className={`p-2 rounded-lg border text-center transition ${
                    filters.sortBy === s.id
                      ? 'border-[#5A5A40] bg-[#5A5A40] text-white font-bold shadow-xs'
                      : 'border-[#E0E0D5] bg-[#F5F5F0] text-[#7A7A6A] hover:bg-[#E8E8DF]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#E0E0D5] bg-[#F5F5F0] flex items-center gap-2">
          <button
            onClick={onResetFilters}
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl border border-[#E0E0D5] bg-white text-[#2D2D2A] font-semibold text-xs hover:bg-[#E8E8DF] transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#474732] text-white font-bold text-xs shadow-xs transition"
          >
            Show {totalResultsCount} Listings
          </button>
        </div>
      </div>
    </div>
  );
};
