import React from 'react';
import { User, SiteHeaderSettings, DEFAULT_HEADER_SETTINGS } from '../types';
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
  Download,
  Bell
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
  siteName?: string;
  officialPhone?: string;
  headerSettings?: SiteHeaderSettings;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
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
  siteName,
  officialPhone,
  headerSettings,
  onOpenNotifications,
  unreadNotificationsCount = 0,
}) => {
  const displayPhone = officialPhone || OFFICIAL_SUPPORT_PHONE;

  // Merge dynamic header settings with fallback defaults
  const effectiveSettings: SiteHeaderSettings = headerSettings || {
    ...DEFAULT_HEADER_SETTINGS,
    siteName: siteName || DEFAULT_HEADER_SETTINGS.siteName,
  };

  const navNames = {
    filters: effectiveSettings.navMenuNames?.filters || 'Filters',
    support: effectiveSettings.navMenuNames?.support || 'Support',
    saved: effectiveSettings.navMenuNames?.saved || 'Saved',
    admin: effectiveSettings.navMenuNames?.admin || 'Admin Console',
    postItem: effectiveSettings.navMenuNames?.postItem || 'Post Item',
    login: effectiveSettings.navMenuNames?.login || 'Log In',
  };

  return (
    <header
      id="main-site-header"
      className="sticky top-0 z-40 backdrop-blur-md border-b border-[#262624] shadow-md transition-colors duration-200"
      style={{
        backgroundColor: effectiveSettings.headerBgColor || '#141413',
        color: effectiveSettings.headerTextColor || '#FFFFFF',
      }}
    >
      {/* 10 & 11. Top Campus Alert / Safety Bar */}
      {effectiveSettings.announcementVisible !== false && (
        <div
          id="header-announcement-bar"
          className="text-[10px] sm:text-[11px] py-1.5 px-3 sm:px-4 text-center font-medium flex items-center justify-center gap-1.5 sm:gap-2 border-b"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            color: effectiveSettings.headerTextColor || '#FFFFFF',
          }}
        >
          <span
            className="px-1.5 py-0.5 rounded font-bold text-[9px] sm:text-[10px] uppercase tracking-wider shrink-0 border"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            Mini Campus
          </span>
          <span className="truncate opacity-90">
            {effectiveSettings.announcementText ||
              'Inspect items in daylight at Mini Campus Gate or Student Center before payment.'}
          </span>
          <span className="hidden md:inline opacity-70 font-mono shrink-0">
            • Support: <strong className="font-normal opacity-100">{displayPhone}</strong>
          </span>
        </div>
      )}

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        {/* DESKTOP LAYOUT (md and up) */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Brand Logo with dynamic custom image or unique minimalist mark */}
          <div 
            id="header-brand-logo-desktop"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
          >
            {/* 3 & 12. Logo visibility and custom image or default mark */}
            {effectiveSettings.logoVisible !== false && (
              effectiveSettings.logoUrl ? (
                <img
                  src={effectiveSettings.logoUrl}
                  alt={effectiveSettings.shortSiteName || "C'IO"}
                  className="w-10 h-10 object-contain rounded-xl border border-white/20 bg-white/5 shadow-inner group-hover:border-white/40 transition shrink-0"
                />
              ) : (
                <CioMark size="md" />
              )
            )}

            <div>
              <div className="flex items-center gap-1.5">
                {/* 2. Short website name */}
                <span className="font-serif font-bold text-lg tracking-tight leading-tight group-hover:opacity-85 transition">
                  {effectiveSettings.shortSiteName || "C'IO"}
                </span>

                {/* 4. Tagline pill badge */}
                {effectiveSettings.tagline && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border transition"
                    style={{
                      borderColor: `${effectiveSettings.headerAccentColor || '#8E8E6F'}80`,
                      backgroundColor: `${effectiveSettings.headerAccentColor || '#8E8E6F'}25`,
                    }}
                  >
                    {effectiveSettings.tagline}
                  </span>
                )}
              </div>

              {/* 4. Subtitle with location pin */}
              {effectiveSettings.subtitle && (
                <div className="flex items-center gap-1 text-[11px] opacity-80 font-medium">
                  <MapPin
                    className="h-2.5 w-2.5 shrink-0"
                    style={{ color: effectiveSettings.headerAccentColor || '#8E8E6F' }}
                  />
                  <span>{effectiveSettings.subtitle}</span>
                </div>
              )}
            </div>
          </div>

          {/* Centered Search Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 opacity-70" />
              <input
                type="text"
                id="global-search-input"
                placeholder={effectiveSettings.searchPlaceholder || "Search products at University of Ilorin Mini Campus..."}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-full border border-white/15 bg-white/10 pl-10 pr-8 py-2 text-xs sm:text-sm placeholder:opacity-50 focus:bg-white/[0.18] focus:border-white/40 focus:outline-hidden focus:ring-1 focus:ring-white/40 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3.5 top-2.5 text-xs opacity-60 hover:opacity-100 transition"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Desktop Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 9. Filter toggle button */}
            <button
              id="nav-filters-btn"
              onClick={onToggleFilterDrawer}
              className="px-3 py-2 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Filter listings"
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>{navNames.filters}</span>
            </button>

            {/* 9. Support button */}
            <button
              id="nav-support-btn"
              onClick={onOpenSupport}
              className={`px-3 py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 border cursor-pointer ${
                activeView === 'support'
                  ? 'bg-white/25 border-white/40 shadow-xs font-bold'
                  : 'bg-transparent border-transparent hover:bg-white/15'
              }`}
              title="Customer Support & Help Desk"
            >
              <Headphones className="h-4 w-4" />
              <span>{navNames.support}</span>
            </button>

            {/* 9. Saved / Favorites Button */}
            <button
              id="nav-favorites-btn"
              onClick={onOpenFavorites}
              className={`relative px-3 py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 border cursor-pointer ${
                activeView === 'favorites'
                  ? 'bg-white/25 border-white/40 shadow-xs font-bold'
                  : 'bg-transparent border-transparent hover:bg-white/15'
              }`}
              title="Saved Favorites"
            >
              <Heart className={`h-4 w-4 ${activeView === 'favorites' ? 'fill-current' : ''}`} />
              <span>{navNames.saved}</span>
              {favoritesCount > 0 && (
                <span
                  className="absolute top-1 right-1 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white"
                  style={{ backgroundColor: effectiveSettings.headerAccentColor || '#5A5A40' }}
                >
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Notifications Button */}
            {onOpenNotifications && (
              <button
                id="nav-notifications-btn"
                onClick={onOpenNotifications}
                className="relative px-3 py-2 rounded-full text-xs font-medium transition flex items-center gap-1.5 border cursor-pointer bg-transparent border-transparent hover:bg-white/15"
                title="Marketplace Notifications & Safety Alerts"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden xl:inline">Alerts</span>
                {(unreadNotificationsCount || 0) > 0 && (
                  <span
                    className="absolute top-1 right-1 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white"
                    style={{ backgroundColor: '#FE2C55' }}
                  >
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* 9. Admin Desk Link */}
            <button
              id="nav-admin-btn"
              onClick={onOpenAdmin}
              className={`flex items-center gap-1 px-3 py-2 rounded-full text-xs font-medium transition border cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-white/25 border-white/40 shadow-xs font-bold'
                  : 'bg-white/10 hover:bg-white/20 border-white/15'
              }`}
              title="Admin Login & Management Console"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{isAdminAuthenticated ? navNames.admin : 'Admin Login'}</span>
            </button>

            {/* Install PWA App Button */}
            {!isInstalled && onOpenInstall && (
              <button
                id="nav-install-app-btn"
                onClick={onOpenInstall}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition border cursor-pointer bg-white/10 hover:bg-white/20 border-white/15"
                title="Install C'IO App on your device"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install App</span>
              </button>
            )}

            {/* 7 & 9. Sell Product Button CTA */}
            <button
              id="nav-sell-cta-btn"
              onClick={onOpenSell}
              className="flex items-center gap-1.5 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xs border border-white/20 transition cursor-pointer hover:shadow-lg hover:opacity-95"
              style={{
                backgroundColor: effectiveSettings.headerAccentColor || '#5A5A40',
              }}
            >
              <PlusCircle className="h-4 w-4" />
              <span>{navNames.postItem}</span>
            </button>

            {/* 9. User Account / Login Button */}
            {currentUser ? (
              <button
                id="nav-user-profile-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 p-1 pl-2.5 rounded-full border border-white/15 hover:border-white/30 hover:bg-white/15 bg-white/10 transition cursor-pointer"
                title="Account & Profile Settings"
              >
                <div className="text-right">
                  <div className="text-xs font-bold leading-tight truncate max-w-[90px]">
                    {currentUser.name.split(' ')[0]}
                  </div>
                  <div className="text-[10px] opacity-75 capitalize flex items-center justify-end gap-0.5">
                    {currentUser.role === 'student' && currentUser.isMatricVerified && (
                      <CheckCircle2 className="w-2.5 h-2.5 inline text-current" />
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
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs font-bold transition border border-white/20 cursor-pointer"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>{navNames.login}</span>
              </button>
            )}
          </div>
        </div>

        {/* MOBILE LAYOUT (< md) */}
        <div className="md:hidden space-y-2">
          {/* Row 1: Brand & User Profile */}
          <div className="flex items-center justify-between">
            <div 
              id="header-brand-logo-mobile"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 cursor-pointer shrink-0 group"
            >
              {effectiveSettings.logoVisible !== false && (
                effectiveSettings.logoUrl ? (
                  <img
                    src={effectiveSettings.logoUrl}
                    alt={effectiveSettings.shortSiteName || "C'IO"}
                    className="w-8 h-8 object-contain rounded-lg border border-white/20 bg-white/5 shadow-inner shrink-0"
                  />
                ) : (
                  <CioMark size="sm" />
                )
              )}

              <div>
                <div className="flex items-center gap-1">
                  <span className="font-serif font-bold text-base tracking-tight leading-tight">
                    {effectiveSettings.shortSiteName || "C'IO"}
                  </span>
                  {effectiveSettings.tagline && (
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full border"
                      style={{
                        borderColor: `${effectiveSettings.headerAccentColor || '#8E8E6F'}80`,
                        backgroundColor: `${effectiveSettings.headerAccentColor || '#8E8E6F'}25`,
                      }}
                    >
                      {effectiveSettings.tagline}
                    </span>
                  )}
                </div>
                {effectiveSettings.subtitle && (
                  <div className="text-[10px] opacity-75 font-medium leading-none">
                    {effectiveSettings.subtitle}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Top-Right Actions: Install, Saved & Auth */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!isInstalled && onOpenInstall && (
                <button
                  id="mobile-nav-install-btn"
                  onClick={onOpenInstall}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 transition text-xs font-semibold cursor-pointer"
                  title="Install C'IO App"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Install</span>
                </button>
              )}

              <button
                onClick={onOpenFavorites}
                className={`relative p-2 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 transition cursor-pointer ${
                  activeView === 'favorites' ? 'bg-white/25 border-white/40' : ''
                }`}
                title="Saved Items"
              >
                <Heart className={`h-4 w-4 ${activeView === 'favorites' ? 'fill-current' : ''}`} />
                {favoritesCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white"
                    style={{ backgroundColor: effectiveSettings.headerAccentColor || '#5A5A40' }}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>

              {onOpenNotifications && (
                <button
                  id="mobile-nav-notifications-btn"
                  onClick={onOpenNotifications}
                  className="relative p-2 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 transition cursor-pointer"
                  title="Alerts"
                >
                  <Bell className="h-4 w-4" />
                  {(unreadNotificationsCount || 0) > 0 && (
                    <span
                      className="absolute -top-1 -right-1 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white"
                      style={{ backgroundColor: '#FE2C55' }}
                    >
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>
              )}

              {currentUser ? (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 p-1 rounded-full border border-white/15 bg-white/10 transition hover:border-white/30 hover:bg-white/20 cursor-pointer"
                  title="My Account"
                >
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-white/30"
                  />
                  <span className="text-xs font-bold max-w-[64px] truncate pr-1">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs font-bold shadow-xs border border-white/20 transition cursor-pointer"
                  style={{
                    backgroundColor: effectiveSettings.headerAccentColor || '#5A5A40',
                  }}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>{navNames.login}</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Full-width Mobile Search & Filter Button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-70" />
              <input
                type="text"
                placeholder={effectiveSettings.searchPlaceholder || "Search textbooks, gadgets, campus deals..."}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-full border border-white/15 bg-white/10 pl-9 pr-8 py-2 text-xs placeholder:opacity-50 focus:bg-white/[0.18] focus:border-white/40 focus:outline-hidden transition"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-2 text-xs opacity-60 hover:opacity-100"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onToggleFilterDrawer}
              className="p-2 rounded-full border border-white/15 bg-white/10 hover:bg-white/20 transition shrink-0 flex items-center justify-center shadow-2xs cursor-pointer"
              title="Filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

