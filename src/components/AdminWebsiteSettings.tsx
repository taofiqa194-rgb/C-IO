import React, { useState, useEffect } from 'react';
import { SiteHeaderSettings, DEFAULT_HEADER_SETTINGS, NavMenuNames } from '../types';
import { uploadImageFile } from '../firebase/services';
import {
  Palette,
  Layout,
  Image as ImageIcon,
  Upload,
  Check,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Heart,
  Headphones,
  ShieldCheck,
  PlusCircle,
  LogIn,
  MapPin,
  Megaphone,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Monitor,
  Smartphone,
  Globe,
  HelpCircle,
} from 'lucide-react';

interface AdminWebsiteSettingsProps {
  currentSettings: SiteHeaderSettings;
  onSaveSettings: (settings: SiteHeaderSettings) => Promise<void>;
  onResetSettings: () => Promise<SiteHeaderSettings>;
  adminEmail?: string;
}

// Built-in preset logos for quick selection
const PRESET_LOGOS = [
  {
    name: "Default C'IO Modern Arc",
    url: '', // Uses the native SVG insignia
  },
  {
    name: 'University Gold Crest',
    url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Modern Campus Shield',
    url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: 'Marketplace Cart Emblem',
    url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=120&auto=format&fit=crop&q=80',
  },
];

// Color palette presets for the header
const BG_COLOR_PRESETS = [
  { label: 'Matte Black', value: '#141413' },
  { label: 'Deep Olive', value: '#23231A' },
  { label: 'Midnight Navy', value: '#0B132B' },
  { label: 'Charcoal Slate', value: '#1E293B' },
  { label: 'Emerald Forest', value: '#064E3B' },
  { label: 'Royal Maroon', value: '#3F1218' },
  { label: 'Clean Off-White', value: '#F8F9FA' },
];

const TEXT_COLOR_PRESETS = [
  { label: 'Pure White', value: '#FFFFFF' },
  { label: 'Warm Off-White', value: '#F5F5F0' },
  { label: 'Soft Silver', value: '#E2E8F0' },
  { label: 'Dark Charcoal', value: '#1F2937' },
];

const ACCENT_COLOR_PRESETS = [
  { label: 'Olive Sage', value: '#8E8E6F' },
  { label: 'WhatsApp Green', value: '#25D366' },
  { label: 'Campus Blue', value: '#2563EB' },
  { label: 'Amber Gold', value: '#F59E0B' },
  { label: 'Crimson Red', value: '#EF4444' },
  { label: 'Coral Orange', value: '#F97316' },
];

// Minimalist native SVG C'IO insignia mark
const CioMark: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'md' }) => {
  const isSm = size === 'sm';
  return (
    <div
      className={`relative rounded-xl bg-[#1E1E1C] border border-white/20 flex items-center justify-center shrink-0 shadow-inner ${
        isSm ? 'w-7 h-7' : 'w-9 h-9'
      }`}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isSm ? 'w-4 h-4' : 'w-5 h-5'}
      >
        <path
          d="M21 9C19.5 7.8 17.5 7 15 7C9.48 7 5 11.48 5 17C5 22.52 9.48 27 15 27C17.5 27 19.5 26.2 21 25"
          stroke="#FFFFFF"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        <circle cx="16" cy="17" r="1.75" fill="#8E8E6F" />
        <path d="M20 11.5L22 9" stroke="#8E8E6F" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 13V23" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="29" cy="18" r="4.25" stroke="#FFFFFF" strokeWidth="2.2" />
      </svg>
    </div>
  );
};

export const AdminWebsiteSettings: React.FC<AdminWebsiteSettingsProps> = ({
  currentSettings,
  onSaveSettings,
  onResetSettings,
  adminEmail,
}) => {
  // Form State
  const [siteName, setSiteName] = useState(currentSettings.siteName || DEFAULT_HEADER_SETTINGS.siteName);
  const [shortSiteName, setShortSiteName] = useState(currentSettings.shortSiteName || DEFAULT_HEADER_SETTINGS.shortSiteName);
  const [logoUrl, setLogoUrl] = useState(currentSettings.logoUrl || '');
  const [logoVisible, setLogoVisible] = useState(currentSettings.logoVisible !== false);
  const [tagline, setTagline] = useState(currentSettings.tagline || DEFAULT_HEADER_SETTINGS.tagline);
  const [subtitle, setSubtitle] = useState(currentSettings.subtitle || DEFAULT_HEADER_SETTINGS.subtitle);
  const [headerBgColor, setHeaderBgColor] = useState(currentSettings.headerBgColor || DEFAULT_HEADER_SETTINGS.headerBgColor);
  const [headerTextColor, setHeaderTextColor] = useState(currentSettings.headerTextColor || DEFAULT_HEADER_SETTINGS.headerTextColor);
  const [headerAccentColor, setHeaderAccentColor] = useState(currentSettings.headerAccentColor || DEFAULT_HEADER_SETTINGS.headerAccentColor);
  const [searchPlaceholder, setSearchPlaceholder] = useState(currentSettings.searchPlaceholder || DEFAULT_HEADER_SETTINGS.searchPlaceholder);

  // Navigation Menu Names State
  const [navMenuNames, setNavMenuNames] = useState<NavMenuNames>({
    filters: currentSettings.navMenuNames?.filters || DEFAULT_HEADER_SETTINGS.navMenuNames.filters,
    support: currentSettings.navMenuNames?.support || DEFAULT_HEADER_SETTINGS.navMenuNames.support,
    saved: currentSettings.navMenuNames?.saved || DEFAULT_HEADER_SETTINGS.navMenuNames.saved,
    admin: currentSettings.navMenuNames?.admin || DEFAULT_HEADER_SETTINGS.navMenuNames.admin,
    postItem: currentSettings.navMenuNames?.postItem || DEFAULT_HEADER_SETTINGS.navMenuNames.postItem,
    login: currentSettings.navMenuNames?.login || DEFAULT_HEADER_SETTINGS.navMenuNames.login,
  });

  // Top Announcement Banner State
  const [announcementText, setAnnouncementText] = useState(
    currentSettings.announcementText || DEFAULT_HEADER_SETTINGS.announcementText
  );
  const [announcementVisible, setAnnouncementVisible] = useState(
    currentSettings.announcementVisible !== false
  );

  // Preview Mode
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');

  // Status and Loading
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Sync state if prop changes from external updates
  useEffect(() => {
    setSiteName(currentSettings.siteName || DEFAULT_HEADER_SETTINGS.siteName);
    setShortSiteName(currentSettings.shortSiteName || DEFAULT_HEADER_SETTINGS.shortSiteName);
    setLogoUrl(currentSettings.logoUrl || '');
    setLogoVisible(currentSettings.logoVisible !== false);
    setTagline(currentSettings.tagline || DEFAULT_HEADER_SETTINGS.tagline);
    setSubtitle(currentSettings.subtitle || DEFAULT_HEADER_SETTINGS.subtitle);
    setHeaderBgColor(currentSettings.headerBgColor || DEFAULT_HEADER_SETTINGS.headerBgColor);
    setHeaderTextColor(currentSettings.headerTextColor || DEFAULT_HEADER_SETTINGS.headerTextColor);
    setHeaderAccentColor(currentSettings.headerAccentColor || DEFAULT_HEADER_SETTINGS.headerAccentColor);
    setSearchPlaceholder(currentSettings.searchPlaceholder || DEFAULT_HEADER_SETTINGS.searchPlaceholder);
    setNavMenuNames({
      filters: currentSettings.navMenuNames?.filters || DEFAULT_HEADER_SETTINGS.navMenuNames.filters,
      support: currentSettings.navMenuNames?.support || DEFAULT_HEADER_SETTINGS.navMenuNames.support,
      saved: currentSettings.navMenuNames?.saved || DEFAULT_HEADER_SETTINGS.navMenuNames.saved,
      admin: currentSettings.navMenuNames?.admin || DEFAULT_HEADER_SETTINGS.navMenuNames.admin,
      postItem: currentSettings.navMenuNames?.postItem || DEFAULT_HEADER_SETTINGS.navMenuNames.postItem,
      login: currentSettings.navMenuNames?.login || DEFAULT_HEADER_SETTINGS.navMenuNames.login,
    });
    setAnnouncementText(currentSettings.announcementText || DEFAULT_HEADER_SETTINGS.announcementText);
    setAnnouncementVisible(currentSettings.announcementVisible !== false);
  }, [currentSettings]);

  // Handle Logo Upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveErrorMsg('Logo file size must be less than 5MB.');
      return;
    }

    setUploadingLogo(true);
    setSaveErrorMsg(null);
    try {
      const url = await uploadImageFile(`branding/logo_${Date.now()}_${file.name}`, file);
      setLogoUrl(url);
      setLogoVisible(true);
      setSaveSuccessMsg('Logo uploaded successfully! Click "Save Changes" to apply.');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      setSaveErrorMsg('Failed to upload logo image: ' + (err.message || 'Unknown error'));
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    const payload: SiteHeaderSettings = {
      siteName: siteName.trim() || DEFAULT_HEADER_SETTINGS.siteName,
      shortSiteName: shortSiteName.trim() || DEFAULT_HEADER_SETTINGS.shortSiteName,
      logoUrl: logoUrl.trim(),
      logoVisible,
      tagline: tagline.trim(),
      subtitle: subtitle.trim(),
      headerBgColor: headerBgColor.trim() || '#141413',
      headerTextColor: headerTextColor.trim() || '#FFFFFF',
      headerAccentColor: headerAccentColor.trim() || '#8E8E6F',
      searchPlaceholder: searchPlaceholder.trim() || DEFAULT_HEADER_SETTINGS.searchPlaceholder,
      navMenuNames: {
        filters: navMenuNames.filters.trim() || 'Filters',
        support: navMenuNames.support.trim() || 'Support',
        saved: navMenuNames.saved.trim() || 'Saved',
        admin: navMenuNames.admin.trim() || 'Admin Console',
        postItem: navMenuNames.postItem.trim() || 'Post Item',
        login: navMenuNames.login.trim() || 'Log In',
      },
      announcementText: announcementText.trim() || DEFAULT_HEADER_SETTINGS.announcementText,
      announcementVisible,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail || 'Admin',
    };

    try {
      await onSaveSettings(payload);
      setSaveSuccessMsg('Website header settings saved successfully to Firebase Firestore! The public header has been updated.');
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Save header settings error:', err);
      setSaveErrorMsg('Failed to save settings to Firestore: ' + (err.message || 'Please check admin permissions.'));
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Reset to Default
  const handleResetToDefault = async () => {
    setIsResetting(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
    try {
      const defaults = await onResetSettings();
      setSiteName(defaults.siteName);
      setShortSiteName(defaults.shortSiteName);
      setLogoUrl(defaults.logoUrl || '');
      setLogoVisible(defaults.logoVisible);
      setTagline(defaults.tagline);
      setSubtitle(defaults.subtitle);
      setHeaderBgColor(defaults.headerBgColor);
      setHeaderTextColor(defaults.headerTextColor);
      setHeaderAccentColor(defaults.headerAccentColor);
      setSearchPlaceholder(defaults.searchPlaceholder);
      setNavMenuNames(defaults.navMenuNames);
      setAnnouncementText(defaults.announcementText);
      setAnnouncementVisible(defaults.announcementVisible);
      setConfirmResetOpen(false);
      setSaveSuccessMsg('Header settings have been reset to default values in Firebase Firestore.');
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    } catch (err: any) {
      console.error('Reset error:', err);
      setSaveErrorMsg('Failed to reset settings: ' + (err.message || 'Unknown error'));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8" id="website-settings-section">
      {/* SECTION HEADER & ROLE BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E0E0D5] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#5A5A40]/15 text-[#5A5A40]">
              <Layout className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-serif font-bold text-[#141413]">
              Website Header & Branding Settings
            </h2>
          </div>
          <p className="text-xs text-[#7A7A6A] mt-1 max-w-2xl">
            Configure the visual appearance, logo, brand names, color scheme, search bar, and navigation labels for the public website header. All changes are saved securely to Firebase Firestore and update the live website immediately.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Admin Protected</span>
          </span>
          <span className="text-[11px] font-mono text-[#7A7A6A] bg-[#F4F4EE] px-2.5 py-1 rounded-full border border-[#E0E0D5]">
            siteSettings/header
          </span>
        </div>
      </div>

      {/* FEEDBACK BANNERS */}
      {saveSuccessMsg && (
        <div className="flex items-start justify-between gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm animate-fade-in shadow-xs">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-900">Changes Saved Successfully</p>
              <p className="text-xs text-emerald-700 mt-0.5">{saveSuccessMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {saveErrorMsg && (
        <div className="flex items-start justify-between gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm animate-fade-in shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Action Failed</p>
              <p className="text-xs text-red-700 mt-0.5">{saveErrorMsg}</p>
            </div>
          </div>
          <button
            onClick={() => setSaveErrorMsg(null)}
            className="text-red-600 hover:text-red-900 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. LIVE HEADER PREVIEW BOX */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E0E0D5] p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAEAE0]">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#5A5A40]" />
            <h3 className="text-sm font-bold text-[#141413] uppercase tracking-wide">
              Live Interactive Header Preview
            </h3>
            <span className="text-[11px] bg-[#F4F4EE] text-[#5A5A40] font-medium px-2 py-0.5 rounded-full border border-[#E0E0D5]">
              Real-time update before saving
            </span>
          </div>

          <div className="flex items-center gap-1 bg-[#F4F4EE] p-1 rounded-xl border border-[#E0E0D5]">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                previewMode === 'desktop'
                  ? 'bg-white text-[#141413] shadow-2xs'
                  : 'text-[#7A7A6A] hover:text-[#141413]'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                previewMode === 'mobile'
                  ? 'bg-white text-[#141413] shadow-2xs'
                  : 'text-[#7A7A6A] hover:text-[#141413]'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* The Live Rendered Header Mockup */}
        <div className="overflow-hidden rounded-xl border border-[#D0D0C5] shadow-inner bg-[#ECECE5] p-2 sm:p-4">
          <div
            className={`mx-auto rounded-lg overflow-hidden transition-all duration-300 border border-black/10 shadow-md ${
              previewMode === 'mobile' ? 'max-w-sm' : 'w-full'
            }`}
            style={{ backgroundColor: headerBgColor, color: headerTextColor }}
          >
            {/* Top Announcement Banner (in preview) */}
            {announcementVisible && (
              <div
                className="text-[10px] sm:text-[11px] py-1 px-3 text-center font-medium flex items-center justify-center gap-1.5 border-b"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.25)',
                  borderColor: 'rgba(255,255,255,0.1)',
                  color: headerTextColor,
                }}
              >
                <span
                  className="px-1.5 py-0.2 rounded font-bold text-[9px] uppercase tracking-wider shrink-0 border"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  Notice
                </span>
                <span className="truncate">{announcementText}</span>
              </div>
            )}

            {/* Main Header Container */}
            <div className="p-3 sm:px-5 sm:py-3.5">
              {previewMode === 'desktop' ? (
                /* Desktop Header Preview */
                <div className="flex items-center justify-between gap-3">
                  {/* Brand & Logo */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    {logoVisible && (
                      <div className="shrink-0">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={shortSiteName}
                            className="w-9 h-9 object-contain rounded-xl border border-white/20 bg-white/5"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <CioMark size="md" />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-base tracking-tight leading-tight">
                          {shortSiteName || "C'IO"}
                        </span>
                        {tagline && (
                          <span
                            className="text-[9px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{
                              borderColor: `${headerAccentColor}80`,
                              backgroundColor: `${headerAccentColor}25`,
                            }}
                          >
                            {tagline}
                          </span>
                        )}
                      </div>
                      {subtitle && (
                        <div className="flex items-center gap-1 text-[10px] opacity-80 font-medium">
                          <MapPin className="h-2.5 w-2.5 shrink-0" style={{ color: headerAccentColor }} />
                          <span>{subtitle}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="flex-1 max-w-xs mx-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 opacity-60" />
                      <input
                        type="text"
                        readOnly
                        placeholder={searchPlaceholder}
                        className="w-full rounded-full border border-white/20 bg-white/10 pl-8 pr-3 py-1.5 text-xs placeholder:opacity-50 pointer-events-none"
                      />
                    </div>
                  </div>

                  {/* Nav Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 text-xs">
                    <span className="px-2.5 py-1.5 rounded-full border border-white/15 bg-white/10 flex items-center gap-1 font-medium">
                      <SlidersHorizontal className="h-3 w-3" />
                      <span>{navMenuNames.filters}</span>
                    </span>
                    <span className="px-2.5 py-1.5 rounded-full border border-white/15 bg-white/10 flex items-center gap-1 font-medium">
                      <Headphones className="h-3 w-3" />
                      <span>{navMenuNames.support}</span>
                    </span>
                    <span className="px-2.5 py-1.5 rounded-full border border-white/15 bg-white/10 flex items-center gap-1 font-medium">
                      <Heart className="h-3 w-3" />
                      <span>{navMenuNames.saved}</span>
                    </span>
                    <span className="px-2.5 py-1.5 rounded-full border border-white/15 bg-white/10 flex items-center gap-1 font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      <span>{navMenuNames.admin}</span>
                    </span>
                    <span
                      className="px-3 py-1.5 rounded-full font-bold shadow-xs flex items-center gap-1"
                      style={{
                        backgroundColor: headerAccentColor,
                        color: '#FFFFFF',
                      }}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span>{navMenuNames.postItem}</span>
                    </span>
                    <span className="px-2.5 py-1.5 rounded-full border border-white/20 bg-white/10 font-bold flex items-center gap-1">
                      <LogIn className="h-3 w-3" />
                      <span>{navMenuNames.login}</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* Mobile Header Preview */
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {logoVisible && (
                        <div className="shrink-0">
                          {logoUrl ? (
                            <img
                              src={logoUrl}
                              alt={shortSiteName}
                              className="w-7 h-7 object-contain rounded-lg border border-white/20 bg-white/5"
                            />
                          ) : (
                            <CioMark size="sm" />
                          )}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-serif font-bold text-sm tracking-tight">
                            {shortSiteName || "C'IO"}
                          </span>
                          {tagline && (
                            <span
                              className="text-[8px] font-semibold px-1.5 py-0.2 rounded-full border"
                              style={{
                                borderColor: `${headerAccentColor}80`,
                                backgroundColor: `${headerAccentColor}25`,
                              }}
                            >
                              {tagline}
                            </span>
                          )}
                        </div>
                        {subtitle && (
                          <div className="text-[9px] opacity-75 leading-none">{subtitle}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="p-1 rounded-full bg-white/10 border border-white/20">
                        <Heart className="h-3.5 w-3.5" />
                      </span>
                      <span
                        className="px-2 py-1 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: headerAccentColor, color: '#FFFFFF' }}
                      >
                        {navMenuNames.login}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3 w-3 opacity-60" />
                    <input
                      type="text"
                      readOnly
                      placeholder={searchPlaceholder}
                      className="w-full rounded-full border border-white/20 bg-white/10 pl-7 pr-3 py-1 text-[11px] placeholder:opacity-50 pointer-events-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN SETTINGS CONTROLS (12 KEY ITEMS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD A: BRAND IDENTITY & TEXT LABELS */}
        <div className="bg-white rounded-2xl border border-[#E0E0D5] p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAEAE0]">
            <Globe className="h-4 w-4 text-[#5A5A40]" />
            <h3 className="text-sm font-bold text-[#141413]">1. Brand Identity & Titles</h3>
          </div>

          {/* 1. Full Website Name */}
          <div>
            <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
              Full Website Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="e.g. C'IO — University of Ilorin Mini Campus Marketplace"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-hidden transition"
            />
            <p className="text-[11px] text-[#7A7A6A] mt-1">
              Used in browser tab title, SEO headers, and official platform notifications.
            </p>
          </div>

          {/* 2. Short Website Name */}
          <div>
            <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
              Short Website Name (Brand Mark) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={shortSiteName}
              onChange={(e) => setShortSiteName(e.target.value)}
              placeholder="e.g. C'IO"
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-hidden transition"
            />
            <p className="text-[11px] text-[#7A7A6A] mt-1">
              The prominent brand name displayed next to the logo on both desktop & mobile headers.
            </p>
          </div>

          {/* 4. Tagline & Subtitle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                Tagline / Badge Text
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Verified Marketplace"
                className="w-full text-xs p-2.5 rounded-xl border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white focus:border-[#5A5A40] outline-hidden transition"
              />
              <p className="text-[10px] text-[#7A7A6A] mt-0.5">
                Displays in pill badge beside brand name.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                Location Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. University of Ilorin Mini Campus"
                className="w-full text-xs p-2.5 rounded-xl border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white focus:border-[#5A5A40] outline-hidden transition"
              />
              <p className="text-[10px] text-[#7A7A6A] mt-0.5">
                Displays with map pin under brand name.
              </p>
            </div>
          </div>

          {/* 8. Search Bar Placeholder */}
          <div>
            <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
              Search Bar Placeholder Text
            </label>
            <input
              type="text"
              value={searchPlaceholder}
              onChange={(e) => setSearchPlaceholder(e.target.value)}
              placeholder="Search products at University of Ilorin Mini Campus..."
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white focus:border-[#5A5A40] outline-hidden transition"
            />
            <p className="text-[11px] text-[#7A7A6A] mt-1">
              The hint shown inside the centered header search box.
            </p>
          </div>
        </div>

        {/* CARD B: LOGO & VISIBILITY */}
        <div className="bg-white rounded-2xl border border-[#E0E0D5] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EAEAE0]">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-[#5A5A40]" />
              <h3 className="text-sm font-bold text-[#141413]">2. Logo Management</h3>
            </div>

            {/* 12. Logo Visibility Switch */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs font-medium text-[#2D2D2A]">Show Logo in Header</span>
              <input
                type="checkbox"
                checked={logoVisible}
                onChange={(e) => setLogoVisible(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5A5A40] relative"></div>
            </label>
          </div>

          {/* Logo URL Input & File Upload */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                Custom Logo Image URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://... or choose preset below"
                  className="flex-1 text-xs p-2.5 rounded-xl border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white focus:border-[#5A5A40] outline-hidden transition"
                />
                {logoUrl && (
                  <button
                    onClick={() => setLogoUrl('')}
                    className="px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                    title="Clear logo URL"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* File Upload Button */}
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                Or Upload Logo Image from Device
              </label>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D0D0C5] bg-[#F4F4EE] hover:bg-[#EAEAE0] text-[#2D2D2A] text-xs font-bold transition cursor-pointer">
                <Upload className="h-3.5 w-3.5 text-[#5A5A40]" />
                <span>{uploadingLogo ? 'Uploading Image...' : 'Choose Logo File (PNG, JPG, SVG)'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-[#7A7A6A] mt-1">
                Max file size: 5MB. Uploaded logos are saved to cloud storage.
              </p>
            </div>

            {/* Preset Logo Selection */}
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-2">
                Quick Logo Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_LOGOS.map((preset) => {
                  const isSelected = logoUrl === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setLogoUrl(preset.url)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition cursor-pointer ${
                        isSelected
                          ? 'border-[#5A5A40] bg-[#5A5A40]/10 font-bold text-[#141413]'
                          : 'border-[#E0E0D5] bg-white hover:bg-[#F4F4EE] text-[#555]'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-[#141413] flex items-center justify-center shrink-0 overflow-hidden">
                        {preset.url ? (
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <CioMark size="sm" />
                        )}
                      </div>
                      <span className="truncate">{preset.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#5A5A40] ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* CARD C: COLOR SCHEME */}
        <div className="bg-white rounded-2xl border border-[#E0E0D5] p-5 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-[#EAEAE0]">
            <Palette className="h-4 w-4 text-[#5A5A40]" />
            <h3 className="text-sm font-bold text-[#141413]">3. Header Color Theme</h3>
          </div>

          {/* 5. Header Background Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D2D2A]">
                5. Header Background Color
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={headerBgColor}
                  onChange={(e) => setHeaderBgColor(e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-gray-300 p-0"
                />
                <input
                  type="text"
                  value={headerBgColor}
                  onChange={(e) => setHeaderBgColor(e.target.value)}
                  className="w-20 text-xs font-mono p-1 rounded border border-[#D0D0C5] text-center"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BG_COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setHeaderBgColor(p.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                    headerBgColor.toLowerCase() === p.value.toLowerCase()
                      ? 'border-[#5A5A40] bg-[#5A5A40]/15 text-[#141413] font-bold ring-1 ring-[#5A5A40]'
                      : 'border-[#E0E0D5] bg-[#FBFBFA] text-[#555] hover:bg-gray-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/20"
                    style={{ backgroundColor: p.value }}
                  />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Header Text Color */}
          <div className="space-y-2 pt-2 border-t border-[#F0F0EA]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D2D2A]">
                6. Header Text Color
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={headerTextColor}
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-gray-300 p-0"
                />
                <input
                  type="text"
                  value={headerTextColor}
                  onChange={(e) => setHeaderTextColor(e.target.value)}
                  className="w-20 text-xs font-mono p-1 rounded border border-[#D0D0C5] text-center"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setHeaderTextColor(p.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                    headerTextColor.toLowerCase() === p.value.toLowerCase()
                      ? 'border-[#5A5A40] bg-[#5A5A40]/15 text-[#141413] font-bold ring-1 ring-[#5A5A40]'
                      : 'border-[#E0E0D5] bg-[#FBFBFA] text-[#555] hover:bg-gray-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/20"
                    style={{ backgroundColor: p.value }}
                  />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 7. Header Accent Color */}
          <div className="space-y-2 pt-2 border-t border-[#F0F0EA]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D2D2A]">
                7. Header Accent Color (Buttons & Badges)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={headerAccentColor}
                  onChange={(e) => setHeaderAccentColor(e.target.value)}
                  className="w-6 h-6 rounded-md cursor-pointer border border-gray-300 p-0"
                />
                <input
                  type="text"
                  value={headerAccentColor}
                  onChange={(e) => setHeaderAccentColor(e.target.value)}
                  className="w-20 text-xs font-mono p-1 rounded border border-[#D0D0C5] text-center"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_COLOR_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setHeaderAccentColor(p.value)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                    headerAccentColor.toLowerCase() === p.value.toLowerCase()
                      ? 'border-[#5A5A40] bg-[#5A5A40]/15 text-[#141413] font-bold ring-1 ring-[#5A5A40]'
                      : 'border-[#E0E0D5] bg-[#FBFBFA] text-[#555] hover:bg-gray-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/20"
                    style={{ backgroundColor: p.value }}
                  />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CARD D: NAVIGATION MENU NAMES & TOP BANNER */}
        <div className="bg-white rounded-2xl border border-[#E0E0D5] p-5 shadow-xs space-y-5">
          {/* 9. Navigation Menu Names */}
          <div>
            <div className="flex items-center gap-2 pb-2 border-b border-[#EAEAE0]">
              <SlidersHorizontal className="h-4 w-4 text-[#5A5A40]" />
              <h3 className="text-sm font-bold text-[#141413]">4. Navigation Menu Labels</h3>
            </div>
            <p className="text-[11px] text-[#7A7A6A] mt-1 mb-3">
              Rename the labels appearing on the header action buttons to suit campus initiatives.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Filters Button
                </label>
                <input
                  type="text"
                  value={navMenuNames.filters}
                  onChange={(e) =>
                    setNavMenuNames((prev) => ({ ...prev, filters: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Support Desk
                </label>
                <input
                  type="text"
                  value={navMenuNames.support}
                  onChange={(e) =>
                    setNavMenuNames((prev) => ({ ...prev, support: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Saved / Favorites
                </label>
                <input
                  type="text"
                  value={navMenuNames.saved}
                  onChange={(e) =>
                    setNavMenuNames((prev) => ({ ...prev, saved: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Admin Console
                </label>
                <input
                  type="text"
                  value={navMenuNames.admin}
                  onChange={(e) =>
                    setNavMenuNames((prev) => ({ ...prev, admin: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Post Item CTA
                </label>
                <input
                  type="text"
                  value={navMenuNames.postItem}
                  onChange={(e) =>
                    setNavMenuNames((prev) => ({ ...prev, postItem: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#555] mb-1">
                  Log In Button
                </label>
                <input
                  type="text"
                  value={navMenuNames.login}
                  onChange={(e) =>
                    setNavMenuNames((prev) => ({ ...prev, login: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* 10 & 11. Top Campus Announcement Banner */}
          <div className="pt-3 border-t border-[#F0F0EA] space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#5A5A40]" />
                <h3 className="text-sm font-bold text-[#141413]">5. Header Banner / Alert</h3>
              </div>

              {/* 11. Banner Visibility */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-medium text-[#2D2D2A]">Show Top Banner</span>
                <input
                  type="checkbox"
                  checked={announcementVisible}
                  onChange={(e) => setAnnouncementVisible(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5A5A40] relative"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                Top Banner Announcement Text
              </label>
              <textarea
                rows={2}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Inspect items in daylight at Mini Campus Gate or Student Center before payment."
                className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-[#D0D0C5] bg-[#FBFBFA] focus:bg-white focus:border-[#5A5A40] outline-hidden transition"
              />
              <p className="text-[11px] text-[#7A7A6A] mt-1">
                Shown in the slim safety / alert strip pinned directly above the main header.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTION BUTTONS: SAVE & RESET TO DEFAULT */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E0E0D5] p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-[#7A7A6A]">
          <Sparkles className="h-4 w-4 text-[#5A5A40]" />
          <span>
            Changes are saved directly to Cloud Firestore and sync live to all connected visitors.
          </span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Reset Button */}
          <button
            id="reset-header-settings-btn"
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            disabled={isSaving || isResetting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#D0D0C5] bg-[#F4F4EE] hover:bg-[#EAEAE0] text-[#2D2D2A] text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 text-[#7A7A6A]" />
            <span>Reset to Default</span>
          </button>

          {/* Save Changes Button */}
          <button
            id="save-header-settings-btn"
            type="button"
            onClick={handleSave}
            disabled={isSaving || isResetting}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#6A6A4E] active:bg-[#474732] text-white text-xs font-bold transition shadow-xs cursor-pointer hover:shadow-[0_0_14px_rgba(90,90,64,0.35)] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving to Firestore...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* RESET CONFIRMATION MODAL */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-[#D0D0C5] space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#141413]">Reset Header Settings?</h3>
                <p className="text-xs text-[#7A7A6A]">This will restore default C'IO branding.</p>
              </div>
            </div>

            <p className="text-xs text-[#555] leading-relaxed">
              Are you sure you want to reset the website header name, colors, logo, and navigation labels back to the default University of Ilorin Mini Campus settings? This action will save the defaults directly to Firebase Firestore.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAEAE0]">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl border border-[#D0D0C5] text-xs font-semibold text-[#555] hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={isResetting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isResetting ? 'Resetting...' : 'Yes, Reset to Default'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
