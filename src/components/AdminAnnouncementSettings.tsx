import React, { useState } from 'react';
import { TikTokVerifiedBadge } from './TikTokVerifiedBadge';
import { 
  Megaphone, 
  Globe, 
  ShieldCheck, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Eye, 
  Phone, 
  Tag, 
  Calendar,
  Layers,
  Palette,
  Check
} from 'lucide-react';

interface AdminAnnouncementSettingsProps {
  initialSiteName: string;
  initialOfficialPhone: string;
  initialAnnouncementEnabled: boolean;
  initialAnnouncementTitle: string;
  initialAnnouncementMessage: string;
  initialAnnouncementType: 'verified' | 'notice' | 'alert' | 'event';
  initialAnnouncementCategory: string;
  initialAnnouncementDate: string;
  initialVerifiedBadgeColor: 'blue' | 'red';
  onSaveAnnouncement: (data: {
    announcementEnabled: boolean;
    announcementTitle: string;
    announcementMessage: string;
    announcementType: 'verified' | 'notice' | 'alert' | 'event';
    announcementCategory: string;
    announcementDate: string;
    verifiedBadgeColor: 'blue' | 'red';
  }) => Promise<void>;
  onSaveWebsiteName: (siteName: string, officialPhone: string) => Promise<void>;
  onSaveBadgeColor: (color: 'blue' | 'red') => Promise<void>;
}

export const AdminAnnouncementSettings: React.FC<AdminAnnouncementSettingsProps> = ({
  initialSiteName,
  initialOfficialPhone,
  initialAnnouncementEnabled,
  initialAnnouncementTitle,
  initialAnnouncementMessage,
  initialAnnouncementType,
  initialAnnouncementCategory,
  initialAnnouncementDate,
  initialVerifiedBadgeColor,
  onSaveAnnouncement,
  onSaveWebsiteName,
  onSaveBadgeColor,
}) => {
  // Website Name State
  const [siteName, setSiteName] = useState(initialSiteName);
  const [officialPhone, setOfficialPhone] = useState(initialOfficialPhone);
  const [siteNameLoading, setSiteNameLoading] = useState(false);
  const [siteNameMsg, setSiteNameMsg] = useState('');

  // Announcement State
  const [announcementEnabled, setAnnouncementEnabled] = useState(initialAnnouncementEnabled);
  const [announcementTitle, setAnnouncementTitle] = useState(initialAnnouncementTitle);
  const [announcementMessage, setAnnouncementMessage] = useState(initialAnnouncementMessage);
  const [announcementType, setAnnouncementType] = useState<'verified' | 'notice' | 'alert' | 'event'>(
    initialAnnouncementType || 'verified'
  );
  const [announcementCategory, setAnnouncementCategory] = useState(
    initialAnnouncementCategory || 'Official Notice'
  );
  const [announcementDate, setAnnouncementDate] = useState(
    initialAnnouncementDate || 'Current Semester Notice'
  );
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');

  // TikTok Badge Color State
  const [badgeColor, setBadgeColor] = useState<'blue' | 'red'>(initialVerifiedBadgeColor || 'blue');
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeMsg, setBadgeMsg] = useState('');

  // Submit Website Name
  const handleWebsiteNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim()) {
      alert('Please provide a valid website name.');
      return;
    }
    setSiteNameLoading(true);
    try {
      await onSaveWebsiteName(siteName.trim(), officialPhone.trim());
      setSiteNameMsg('Website name updated successfully! Changes are live across C\'IO.');
      setTimeout(() => setSiteNameMsg(''), 3000);
    } catch (err: any) {
      alert('Failed to update website name: ' + (err.message || 'Unknown error'));
    } finally {
      setSiteNameLoading(false);
    }
  };

  // Submit Announcement
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementLoading(true);
    try {
      await onSaveAnnouncement({
        announcementEnabled,
        announcementTitle: announcementTitle.trim(),
        announcementMessage: announcementMessage.trim(),
        announcementType,
        announcementCategory: announcementCategory.trim(),
        announcementDate: announcementDate.trim(),
        verifiedBadgeColor: badgeColor,
      });
      setAnnouncementMsg('Campus announcement updated and published live!');
      setTimeout(() => setAnnouncementMsg(''), 3000);
    } catch (err: any) {
      alert('Failed to save announcement: ' + (err.message || 'Unknown error'));
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // Submit Badge Color
  const handleBadgeColorSelect = async (selected: 'blue' | 'red') => {
    setBadgeColor(selected);
    setBadgeLoading(true);
    try {
      await onSaveBadgeColor(selected);
      setBadgeMsg(`TikTok Verified Badge color changed to ${selected === 'red' ? 'Crimson Red' : 'Cyan Blue'}!`);
      setTimeout(() => setBadgeMsg(''), 3000);
    } catch (err: any) {
      alert('Failed to update badge style: ' + (err.message || 'Unknown error'));
    } finally {
      setBadgeLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Banner */}
      <div className="bg-white p-6 rounded-3xl border border-[#E0E0D5] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 rounded-2xl bg-[#5A5A40]/10 text-[#5A5A40] shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#2D2D2A]">
                Campus Announcements, Website Identity & Verified Badges
              </h2>
              <p className="text-xs sm:text-sm text-[#7A7A6A] mt-1">
                Manage the public announcement banner, customize the official website name, and configure the TikTok-style verified student badge.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              announcementEnabled 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              Announcement: {announcementEnabled ? 'Live on Site' : 'Hidden'}
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. EDIT ANNOUNCEMENT SECTION */}
      {/* ======================================================== */}
      <div id="admin-edit-announcements-section" className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E0E0D5] shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E0E0D5]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#5A5A40]/10 text-[#5A5A40]">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Edit Campus Announcements</h3>
              <p className="text-xs text-[#7A7A6A]">
                Broadcast official directives, trade safety tips, or urgent notices to all visitors.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-[#F5F5F0] px-3.5 py-1.5 rounded-full border border-[#E0E0D5]">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={(e) => setAnnouncementEnabled(e.target.checked)}
              className="h-4 w-4 rounded text-[#5A5A40] focus:ring-[#5A5A40]"
            />
            <span className="text-xs font-bold text-[#2D2D2A]">
              {announcementEnabled ? 'Banner Enabled' : 'Banner Disabled'}
            </span>
          </label>
        </div>

        {announcementMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-green-50 text-green-800 border border-green-200 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <span>{announcementMsg}</span>
          </div>
        )}

        <form onSubmit={handleAnnouncementSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Announcement Title */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Announcement Headline / Title
              </label>
              <input
                type="text"
                required
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g., Official Campus Announcement: Verified Student Marketplace Guidelines"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            {/* Category Tag */}
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Badge Category Label
              </label>
              <input
                type="text"
                value={announcementCategory}
                onChange={(e) => setAnnouncementCategory(e.target.value)}
                placeholder="e.g. Official Notice, Safety Advisory, Admin Bulletin"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {['Official Notice', 'Safety Advisory', 'Admin Bulletin', 'Exam Period Alert'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAnnouncementCategory(tag)}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8E8DF] hover:bg-[#D9D9C8] text-[#5A5A40] font-medium"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Type / Visual Theme */}
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Announcement Style & Severity
              </label>
              <select
                value={announcementType}
                onChange={(e) => setAnnouncementType(e.target.value as any)}
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs font-medium text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              >
                <option value="verified">Verified Official Advisory (TikTok Verified Seal)</option>
                <option value="notice">General Campus Notice (Amber)</option>
                <option value="alert">High Priority Safety Alert (Red)</option>
                <option value="event">Campus Event / Calendar (Green)</option>
              </select>
              <span className="text-[10px] text-[#7A7A6A] block mt-1">
                Controls the border accent and visual tone on the marketplace.
              </span>
            </div>

            {/* Announcement Date Text */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Date / Semester Indicator
              </label>
              <input
                type="text"
                value={announcementDate}
                onChange={(e) => setAnnouncementDate(e.target.value)}
                placeholder="e.g. Current Semester Notice, 2025/2026 Academic Session"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            {/* Announcement Message */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Announcement Body Message
              </label>
              <textarea
                required
                rows={4}
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                placeholder="Enter the full text of the campus announcement here..."
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] p-4 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden leading-relaxed"
              />
              <span className="text-[10px] text-[#7A7A6A] block mt-1">
                Paragraph breaks and line breaks will be preserved when rendered on the marketplace.
              </span>
            </div>
          </div>

          {/* Real-time Interactive Preview */}
          <div className="pt-3">
            <span className="text-xs font-bold text-[#7A7A6A] uppercase tracking-wider block mb-2">
              Live Preview (How it looks on the website):
            </span>

            <div className="rounded-2xl border border-[#E0E0D5] p-4 sm:p-5 bg-[#FAF9F5] shadow-xs relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <TikTokVerifiedBadge color={badgeColor} size="md" />
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    badgeColor === 'red' ? 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/30' : 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/30'
                  }`}>
                    {announcementCategory || 'Official Notice'}
                  </span>
                  <span className="text-[10px] text-[#7A7A6A]">• {announcementDate || 'Current Notice'}</span>
                </div>
              </div>

              <h4 className="font-serif font-bold text-base text-[#2D2D2A] mt-2">
                {announcementTitle || 'Announcement Title Preview'}
              </h4>

              <p className="text-xs text-[#55554F] mt-1.5 leading-relaxed whitespace-pre-line">
                {announcementMessage || 'Your announcement message will be displayed here.'}
              </p>

              <div className="mt-3 pt-2 border-t border-[#E0E0D5] flex items-center justify-between text-[10px] text-[#7A7A6A]">
                <div className="flex items-center gap-1 font-medium">
                  <ShieldCheck className={`w-3.5 h-3.5 ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-[#0284c7]'}`} />
                  <span>Verified by C'IO University of Ilorin Mini Campus Administration</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={announcementLoading}
              className="bg-[#5A5A40] hover:bg-[#474732] text-white font-bold px-6 py-2.5 rounded-full text-xs transition shadow-xs flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{announcementLoading ? 'Publishing Announcement...' : 'Save & Publish Announcement'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 2. EDIT WEBSITE NAME & BRAND IDENTITY SECTION */}
      {/* ======================================================== */}
      <div id="admin-edit-website-name-section" className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E0E0D5] shadow-xs">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E0E0D5]">
          <div className="p-2 rounded-xl bg-[#5A5A40]/10 text-[#5A5A40]">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Edit Website Name & Brand</h3>
            <p className="text-xs text-[#7A7A6A]">
              Customize the platform title displayed in the browser tab, navbar header, and metadata.
            </p>
          </div>
        </div>

        {siteNameMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-green-50 text-green-800 border border-green-200 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <span>{siteNameMsg}</span>
          </div>
        )}

        <form onSubmit={handleWebsiteNameSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Website Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Website Name / Title
              </label>
              <input
                type="text"
                required
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. C'IO — University of Ilorin Mini Campus Marketplace"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
              {/* Presets */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] text-[#7A7A6A]">Quick suggestions:</span>
                {[
                  "C'IO — University of Ilorin Mini Campus Marketplace",
                  "C'IO Marketplace",
                  "C'IO — Unilorin Student Marketplace"
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSiteName(preset)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-[#F5F5F0] border border-[#E0E0D5] hover:border-[#5A5A40] text-[#2D2D2A]"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Official Support Phone */}
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Official Campus Support Line
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-[#7A7A6A]" />
                <input
                  type="text"
                  required
                  value={officialPhone}
                  onChange={(e) => setOfficialPhone(e.target.value)}
                  placeholder="09076930244"
                  className="w-full pl-9 pr-4 py-2 rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] text-xs font-mono font-bold text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>
              <span className="text-[10px] text-[#7A7A6A] block mt-1">
                Displayed in the footer, support desk, and WhatsApp inquiry buttons.
              </span>
            </div>

            {/* Browser Preview */}
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                Browser Tab Preview
              </label>
              <div className="rounded-xl border border-[#E0E0D5] bg-[#E8E8DF] p-2 flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-[#5A5A40] shrink-0" />
                <span className="font-semibold text-[#2D2D2A] truncate text-[11px]">
                  {siteName}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={siteNameLoading}
              className="bg-[#5A5A40] hover:bg-[#474732] text-white font-bold px-6 py-2.5 rounded-full text-xs transition shadow-xs flex items-center gap-2 disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              <span>{siteNameLoading ? 'Updating Website Name...' : 'Save Website Name'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ======================================================== */}
      {/* 3. TIKTOK-STYLE VERIFIED BADGE CONFIGURATION */}
      {/* ======================================================== */}
      <div id="admin-tiktok-badge-section" className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E0E0D5] shadow-xs">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-[#E0E0D5]">
          <div className="p-2 rounded-xl bg-[#5A5A40]/10 text-[#5A5A40]">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#2D2D2A]">TikTok-Style Verified Badge Configuration</h3>
            <p className="text-xs text-[#7A7A6A]">
              The verified badge is styled after the authentic TikTok scalloped rosette, placed prominently at the top of the person's name.
            </p>
          </div>
        </div>

        {badgeMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-green-50 text-green-800 border border-green-200 text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            <span>{badgeMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Color Selection Buttons */}
          <div className="space-y-4">
            <label className="block text-xs font-bold text-[#2D2D2A]">
              Choose Verified Badge Theme Color:
            </label>

            {/* Blue Option */}
            <div 
              onClick={() => handleBadgeColorSelect('blue')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                badgeColor === 'blue' 
                  ? 'border-[#0284c7] bg-[#0284c7]/5 shadow-xs' 
                  : 'border-[#E0E0D5] hover:border-[#0284c7]/50 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0284c7]/10 flex items-center justify-center shrink-0">
                  <TikTokVerifiedBadge color="blue" size="md" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#2D2D2A] flex items-center gap-1.5">
                    <span>TikTok Cyan-Blue Badge</span>
                    {badgeColor === 'blue' && (
                      <span className="text-[10px] bg-[#0284c7] text-white px-2 py-0.2 rounded-full">Active</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#7A7A6A]">
                    Vibrant cyan-blue 8-scallop rosette with white checkmark.
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                badgeColor === 'blue' ? 'border-[#0284c7] bg-[#0284c7] text-white' : 'border-[#D9D9C8]'
              }`}>
                {badgeColor === 'blue' && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* Red Option */}
            <div 
              onClick={() => handleBadgeColorSelect('red')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between ${
                badgeColor === 'red' 
                  ? 'border-[#FE2C55] bg-[#FE2C55]/5 shadow-xs' 
                  : 'border-[#E0E0D5] hover:border-[#FE2C55]/50 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FE2C55]/10 flex items-center justify-center shrink-0">
                  <TikTokVerifiedBadge color="red" size="md" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#2D2D2A] flex items-center gap-1.5">
                    <span>TikTok Electric-Red Badge</span>
                    {badgeColor === 'red' && (
                      <span className="text-[10px] bg-[#FE2C55] text-white px-2 py-0.2 rounded-full">Active</span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#7A7A6A]">
                    High-contrast crimson-red 8-scallop rosette with white checkmark.
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                badgeColor === 'red' ? 'border-[#FE2C55] bg-[#FE2C55] text-white' : 'border-[#D9D9C8]'
              }`}>
                {badgeColor === 'red' && <Check className="w-3 h-3" />}
              </div>
            </div>
          </div>

          {/* Live Preview of Badge placed AT TOP of Person's Name */}
          <div className="bg-[#F5F5F0] p-5 rounded-2xl border border-[#E0E0D5]">
            <span className="text-xs font-bold text-[#7A7A6A] uppercase tracking-wider block mb-3">
              Badge Placement Demo (At Top of Person's Name):
            </span>

            {/* Simulated Product Card Item */}
            <div className="bg-white p-4 rounded-2xl border border-[#E0E0D5] shadow-xs max-w-sm">
              <div className="text-[10px] text-[#7A7A6A] mb-1 font-mono">Simulated Seller Preview:</div>
              
              {/* TOP OF PERSON'S NAME: TikTok Verified Badge */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <TikTokVerifiedBadge color={badgeColor} size="sm" />
                <span className={`text-[11px] font-bold tracking-tight uppercase ${
                  badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-[#0284c7]'
                }`}>
                  Verified Student
                </span>
              </div>
              
              {/* PERSON'S NAME */}
              <div className="font-bold text-sm text-[#2D2D2A]">
                Ibrahim Abdulazeez
              </div>
              <div className="text-[11px] text-[#7A7A6A]">
                Matric: 20/55EC042 • Engineering Faculty
              </div>

              <div className="mt-3 pt-3 border-t border-[#E0E0D5] flex items-center justify-between">
                <span className="text-xs font-bold text-[#2D2D2A]">Engineering Drawing Kit</span>
                <span className="font-serif font-bold text-xs text-[#5A5A40]">₦8,500</span>
              </div>
            </div>

            <p className="text-[11px] text-[#7A7A6A] mt-3 leading-relaxed">
              When students verify their matriculation numbers or businesses submit registration documents, this badge automatically renders directly above their name on all cards, modals, and directory listings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
