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
  Download
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
  onOpenInstall?: () => void;
  isInstalled?: boolean;
}

// Minimalist, modern C'IO insignia mark designed for desktop & mobile
const CioMark: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <div
      className={`relative rounded-xl bg-[#1E1E1C] border border-white/20 flex items-center justify-center shrink-0 shadow-inner group-hover:border-[#8E8E6F] group-hover:shadow-[0_0_12px_rgba(90,90,64,0.4)] transition-all duration-200 ${
        isSm ? 'w-8 h-8' : 'w-10 h-10'
      }`}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isSm ? 'w-5 h-5' : 'w-6 h-6'}
      >
        {/* Sleek minimalist C arc with campus connector node and I-O balance */}
        <path
          d="M21 9C19.5 7.8 17.5 7 15 7C9.48 7 5 11.48 5 17C5 22.52 9.48 27 15 27C17.5 27 19.5 26.2 21 25"
          stroke="#FFFFFF"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        {/* Center connection node in primary accent */}
        <circle cx="16" cy="17" r="1.75" fill="#8E8E6F" />
        {/* Modern accent apostrophe mark */}
        <path
          d="M20 11.5L22 9"
          stroke="#8E8E6F"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* I pillar */}
        <path
          d="M24 13V23"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* O orbit */}
        <circle
          cx="29"
          cy="18"
          r="4.25"
          stroke="#FFFFFF"
          strokeWidth="2.2"
        />
      </svg>
    </div>
  );
};

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
  onOpenInstall,
  isInstalled = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#141413]/95 backdrop-blur-md border-b border-[#262624] text-white shadow-md">
      {/* Top Campus Alert / Safety Bar - Matte Black */}
      <div className="bg-[#0B0B0A] text-white text-[10px] sm:text-[11px] py-1.5 px-3 sm:px-4 text-center font-medium flex items-center justify-center gap-1.5 sm:gap-2 border-b border-white/10">
        <span className="bg-white/10 text-white px-1.5 py-0.5 rounded font-bold text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0 border border-white/15">
          Mini Campus
        </span>
        <span className="truncate text-white/90">
          Inspect items in daylight at Mini Campus Gate or Student Center before payment.
        </span>
        <span className="hidden md:inline text-white/70 font-mono shrink-0">
          • Support: <strong className="text-white font-normal">{OFFICIAL_SUPPORT_PHONE}</strong>
        </span>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* DESKTOP LAYOUT (md and up) */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Brand Logo with unique minimalist mark */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          >
            <CioMark size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-lg text-white tracking-tight leading-tight group-hover:text-[#D9D9C8] transition">
                  C'IO
                </span>
                <span className="text-[10px] bg-white/10 text-white font-semibold px-2 py-0.5 rounded-full border border-white/15 group-hover:border-[#8E8E6F] transition">
                  Verified Marketplace
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-white/75 font-medium">
                <MapPin className="h-2.5 w-2.5 text-white" />
                <span>University of Ilorin Mini Campus</span>
              </div>
            </div>
          </div>

          {/* Centered Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-white/70" />
              <input
                type="text"
                id="global-search-input"
                placeholder="Search products at University of Ilorin Mini Campus..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-full border border-white/15 bg-white/10 pl-10 pr-8 py-2 text-xs sm:text-sm text-white placeholder:text-white/50 focus:bg-white/[0.16] focus:border-[#8E8E6F] focus:outline-hidden focus:ring-1 focus:ring-[#8E8E6F] transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-2.5 text-xs text-white/60 hover:text-white transition"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Filter toggle button */}
            <button
              onClick={onToggleFilterDrawer}
              className="px-3 py-2 rounded-full border border-white/15 bg-white/10 text-white hover:bg-[#5A5A40]/30 hover:border-[#8E8E6F] transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Filter listings"
            >
              <SlidersHorizontal className="h-4 w-4 text-white" />
              <span>Filters</span>
            </button>

            {/* Support button */}
            <button
              id="nav-support-btn"
              onClick={onOpenSupport}
              className={`px-3 py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 border cursor-pointer ${
                activeView === 'support'
                  ? 'bg-[#5A5A40] text-white border-[#8E8E6F] shadow-xs'
                  : 'text-white bg-transparent border-transparent hover:bg-[#5A5A40]/30 hover:border-[#8E8E6F]'
              }`}
              title="Customer Support & Help Desk"
            >
              <Headphones className="h-4 w-4 text-white" />
              <span>Support</span>
            </button>

            {/* Saved / Favorites Button */}
            <button
              id="nav-favorites-btn"
              onClick={onOpenFavorites}
              className={`relative px-3 py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 border cursor-pointer ${
                activeView === 'favorites'
                  ? 'bg-[#5A5A40] text-white border-[#8E8E6F] shadow-xs'
                  : 'text-white bg-transparent border-transparent hover:bg-[#5A5A40]/30 hover:border-[#8E8E6F]'
              }`}
              title="Saved Favorites"
            >
              <Heart className={`h-4 w-4 text-white ${activeView === 'favorites' ? 'fill-white' : ''}`} />
              <span>Saved</span>
              {favoritesCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#5A5A40] text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Admin Desk Link */}
            <button
              id="nav-admin-btn"
              onClick={onOpenAdmin}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition border cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-[#5A5A40] text-white border-[#8E8E6F] shadow-xs'
                  : 'text-white bg-white/10 hover:bg-[#5A5A40]/30 hover:border-[#8E8E6F] border-white/15'
              }`}
              title="Admin Login & Management Console"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
              <span>{isAdminAuthenticated ? 'Admin Console' : 'Admin Login'}</span>
            </button>

            {/* Install PWA App Button */}
            {!isInstalled && onOpenInstall && (
              <button
                id="nav-install-app-btn"
                onClick={onOpenInstall}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition border cursor-pointer text-white bg-white/10 hover:bg-[#5A5A40]/30 hover:border-[#8E8E6F] border-white/15"
                title="Install C'IO App on your device"
              >
                <Download className="h-3.5 w-3.5 text-white" />
                <span>Install App</span>
              </button>
            )}

            {/* Sell Product Button CTA */}
            <button
              id="nav-sell-cta-btn"
              onClick={onOpenSell}
              className="flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#6A6A4E] active:bg-[#474732] text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs border border-white/20 hover:border-[#8E8E6F] transition cursor-pointer hover:shadow-[0_0_12px_rgba(90,90,64,0.4)]"
            >
              <PlusCircle className="h-4 w-4 text-white" />
              <span>Post Item</span>
            </button>

            {/* User Account / Login Button */}
            {currentUser ? (
              <button
                id="nav-user-profile-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 p-1 pl-2.5 rounded-full border border-white/15 hover:border-[#8E8E6F] hover:bg-[#5A5A40]/25 bg-white/10 transition cursor-pointer text-white"
                title="Account & Profile Settings"
              >
                <div className="text-right">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[90px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] text-white/75 capitalize flex items-center justify-end gap-0.5">
                    {currentUser.role === 'student' && currentUser.isMatricVerified && (
                      <CheckCircle2 className="w-2.5 h-2.5 text-white inline" />
                    )}
                    <span>{currentUser.role}</span>
                  </div>
                </div>
                <img
                  src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-white/30"
                />
              </button>
            ) : (
              <button
                id="nav-login-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-[#5A5A40]/35 text-white text-xs font-bold transition border border-white/20 hover:border-[#8E8E6F] cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5 text-white" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* MOBILE LAYOUT (< md) */}
        <div className="md:hidden space-y-2">
          {/* Row 1: Brand & User Profile */}
          <div className="flex items-center justify-between">
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 cursor-pointer shrink-0 group"
            >
              <CioMark size="sm" />
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-serif font-bold text-base text-white tracking-tight leading-tight group-hover:text-[#D9D9C8] transition">
                    C'IO
                  </span>
                  <span className="text-[9px] bg-white/10 text-white font-semibold px-1.5 py-0.2 rounded-full border border-white/15">
                    Mini Campus
                  </span>
                </div>
                <div className="text-[10px] text-white/75 font-medium leading-none">
                  Unilorin Mini Campus
                </div>
              </div>
            </div>

            {/* Mobile Top-Right Actions: Install, Saved & Auth */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!isInstalled && onOpenInstall && (
                <button
                  id="mobile-nav-install-btn"
                  onClick={onOpenInstall}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 hover:bg-[#5A5A40]/35 text-white transition text-xs font-semibold cursor-pointer"
                  title="Install C'IO App"
                >
                  <Download className="h-3.5 w-3.5 text-white" />
                  <span className="text-[10px]">Install</span>
                </button>
              )}

              <button
                onClick={onOpenFavorites}
                className={`relative p-2 rounded-full border border-white/15 bg-white/10 text-white hover:bg-[#5A5A40]/30 hover:border-[#8E8E6F] transition cursor-pointer ${
                  activeView === 'favorites' ? 'bg-[#5A5A40] text-white border-[#8E8E6F]' : ''
                }`}
                title="Saved Items"
              >
                <Heart className={`h-4 w-4 text-white ${activeView === 'favorites' ? 'fill-white' : ''}`} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#5A5A40] text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {currentUser ? (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 p-1 rounded-full border border-white/15 bg-white/10 transition hover:border-[#8E8E6F] hover:bg-[#5A5A40]/25 cursor-pointer text-white"
                  title="My Account"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/30"
                  />
                  <span className="text-xs font-bold text-white max-w-[64px] truncate pr-1">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#5A5A40] hover:bg-[#6A6A4E] text-white text-xs font-bold shadow-xs border border-white/20 hover:border-[#8E8E6F] transition cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5 text-white" />
                  <span>Log In</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Full-width Mobile Search & Filter Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/70" />
              <input
                type="text"
                placeholder="Search textbooks, gadgets, campus deals..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-full border border-white/15 bg-white/10 pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/50 focus:bg-white/[0.16] focus:border-[#8E8E6F] focus:outline-hidden transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2 text-xs text-white/60 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onToggleFilterDrawer}
              className="p-2 rounded-full border border-white/15 bg-white/10 text-white hover:bg-[#5A5A40]/30 hover:border-[#8E8E6F] transition shrink-0 flex items-center justify-center shadow-2xs cursor-pointer"
              title="Filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
