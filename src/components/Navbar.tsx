import React from 'react';
import { User } from '../types';
import { OFFICIAL_SUPPORT_PHONE } from '../data/mockData';
import { 
  Search, 
  MapPin, 
  Heart, 
  PlusCircle, 
  ShieldCheck, 
  CheckCircle2, 
  Headphones,
  SlidersHorizontal,
  LogIn,
  User as UserIcon
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
  onOpenSell: () => void;
  onOpenSupport: () => void;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onToggleFilterDrawer: () => void;
  activeView: string;
  isAdminAuthenticated: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  searchQuery,
  onSearchChange,
  favoritesCount,
  onOpenFavorites,
  onOpenSell,
  onOpenSupport,
  onOpenAdmin,
  onOpenAuth,
  onToggleFilterDrawer,
  activeView,
  isAdminAuthenticated,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E0E0D5] shadow-2xs">
      {/* Top Campus Alert / Safety Bar */}
      <div className="bg-[#5A5A40] text-[#F5F5F0] text-[11px] py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 border-b border-[#474732]/30">
        <span className="bg-[#474732] text-[#D9D9C8] px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider">
          Mini Campus Notice
        </span>
        <span className="truncate">
          Safety First: Inspect items at University of Ilorin Mini Campus Gate or Student Center before payment.
        </span>
        <span className="hidden md:inline text-[#D9D9C8] font-mono">
          Official Support: {OFFICIAL_SUPPORT_PHONE}
        </span>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#5A5A40] text-white flex items-center justify-center font-serif font-bold text-sm sm:text-base shadow-xs border-2 border-[#D9D9C8]/40">
            C'IO
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base sm:text-lg text-[#2D2D2A] tracking-tight leading-tight">
                C'IO
              </span>
              <span className="hidden sm:inline text-[10px] bg-[#E8E8DF] text-[#5A5A40] font-semibold px-2 py-0.5 rounded-full border border-[#E0E0D5]">
                Verified Marketplace
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-[#7A7A6A] font-medium">
              <MapPin className="h-2.5 w-2.5 text-[#5A5A40]" />
              <span>University of Ilorin Mini Campus</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#A0A090]" />
            <input
              type="text"
              id="global-search-input"
              placeholder="Search products at University of Ilorin Mini Campus..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-full border border-[#E0E0D5] bg-[#F5F5F0] pl-10 pr-8 py-2 text-xs sm:text-sm text-[#2D2D2A] placeholder:text-[#A0A090] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden focus:ring-1 focus:ring-[#5A5A40] transition"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3.5 top-2.5 text-xs text-[#A0A090] hover:text-[#2D2D2A]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Filter toggle button */}
          <button
            onClick={onToggleFilterDrawer}
            className="p-2 sm:px-3 sm:py-2 rounded-full border border-[#E0E0D5] bg-white text-[#2D2D2A] hover:bg-[#F5F5F0] transition flex items-center gap-1.5 text-xs font-medium"
            title="Filter listings"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#7A7A6A]" />
            <span className="hidden sm:inline">Filters</span>
          </button>

          {/* Support button */}
          <button
            id="nav-support-btn"
            onClick={onOpenSupport}
            className={`p-2 sm:px-3 sm:py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
              activeView === 'support'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#2D2D2A] hover:bg-[#F5F5F0]'
            }`}
            title="Customer Support & Help Desk"
          >
            <Headphones className="h-4 w-4" />
            <span className="hidden md:inline">Support</span>
          </button>

          {/* Saved / Favorites Button */}
          <button
            id="nav-favorites-btn"
            onClick={onOpenFavorites}
            className={`relative p-2 sm:px-3 sm:py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 ${
              activeView === 'favorites'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#2D2D2A] hover:bg-[#F5F5F0]'
            }`}
            title="Saved Favorites"
          >
            <Heart className={`h-4 w-4 ${activeView === 'favorites' ? 'fill-white' : 'text-[#7A7A6A]'}`} />
            <span className="hidden sm:inline">Saved</span>
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 sm:top-1 sm:right-1 bg-[#5A5A40] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Admin Desk Link */}
          <button
            id="nav-admin-btn"
            onClick={onOpenAdmin}
            className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition ${
              activeView === 'admin'
                ? 'bg-[#2D2D2A] text-white shadow-xs'
                : 'text-[#2D2D2A] bg-[#F5F5F0] hover:bg-[#E8E8DF] border border-[#E0E0D5]'
            }`}
            title="Admin Login & Management Console"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[#5A5A40]" />
            <span className="hidden md:inline">
              {isAdminAuthenticated ? 'Admin Console' : 'Admin Login'}
            </span>
          </button>

          {/* Sell Product Button CTA */}
          <button
            id="nav-sell-cta-btn"
            onClick={onOpenSell}
            className="hidden sm:flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white text-xs font-medium px-4 py-2 rounded-full shadow-xs transition"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Post Item</span>
          </button>

          {/* User Account / Login Button */}
          {currentUser ? (
            <button
              id="nav-user-profile-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 p-1 sm:p-1.5 pl-2.5 rounded-full border border-[#E0E0D5] hover:border-[#5A5A40] bg-white transition"
              title="Account & Profile Settings"
            >
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-[#2D2D2A] leading-tight truncate max-w-[90px]">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-[#7A7A6A] capitalize flex items-center justify-end gap-0.5">
                  {currentUser.role === 'student' && currentUser.isMatricVerified && (
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#5A5A40] inline" />
                  )}
                  <span>{currentUser.role}</span>
                </div>
              </div>
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-[#D9D9C8]"
              />
            </button>
          ) : (
            <button
              id="nav-login-btn"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full bg-[#5A5A40]/10 hover:bg-[#5A5A40]/20 text-[#5A5A40] text-xs font-bold transition border border-[#5A5A40]/30"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
