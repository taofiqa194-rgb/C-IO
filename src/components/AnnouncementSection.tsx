import React, { useState } from 'react';
import { PlatformSettings } from '../types';
import { TikTokVerifiedBadge } from './TikTokVerifiedBadge';
import { 
  Megaphone, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  AlertTriangle, 
  Bell, 
  Sparkles,
  Info
} from 'lucide-react';

interface AnnouncementSectionProps {
  settings: PlatformSettings;
  isAdmin?: boolean;
  onEditAnnouncement?: () => void;
}

export const AnnouncementSection: React.FC<AnnouncementSectionProps> = ({
  settings,
  isAdmin = false,
  onEditAnnouncement,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // If disabled by administrator, do not render on marketplace
  if (settings.announcementEnabled === false) {
    return null;
  }

  if (isDismissed) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-2 pb-1">
        <button
          onClick={() => setIsDismissed(false)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#5A5A40] hover:text-[#2D2D2A] bg-white border border-[#E0E0D5] px-3 py-1.5 rounded-full shadow-2xs hover:bg-[#F5F5F0] transition"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Show Campus Announcement</span>
        </button>
      </div>
    );
  }

  const title = settings.announcementTitle || "Official Campus Announcement: Verified Student Marketplace Guidelines";
  const message = settings.announcementMessage || "Welcome to C'IO! To ensure safe transactions across the University of Ilorin Mini Campus, inspect all items in daylight at the Mini Campus Gate or Student Center before making payment. Always verify student credentials with the official verified badge.";
  const type = settings.announcementType || 'verified';
  const category = settings.announcementCategory || 'Official Notice';
  const date = settings.announcementDate || 'Current Semester Notice';
  const badgeColor = settings.verifiedBadgeColor || 'blue';

  // Theme styling based on announcement type
  const isRedAlert = type === 'alert';
  const isWarning = type === 'notice';

  const containerStyles = isRedAlert
    ? 'bg-red-50/80 border-red-200 text-red-950'
    : isWarning
    ? 'bg-amber-50/80 border-amber-200 text-amber-950'
    : 'bg-white border-[#E0E0D5] text-[#2D2D2A]';

  const categoryTagStyles = isRedAlert
    ? 'bg-red-100 text-red-700 border-red-200'
    : isWarning
    ? 'bg-amber-100 text-amber-800 border-amber-200'
    : badgeColor === 'red'
    ? 'bg-[#FE2C55]/10 text-[#FE2C55] border-[#FE2C55]/25'
    : 'bg-[#0284c7]/10 text-[#0284c7] border-[#0284c7]/25';

  return (
    <div id="verified-announcement-section" className="max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-1">
      <div className={`rounded-3xl border p-4 sm:p-5 shadow-xs transition-all relative overflow-hidden ${containerStyles}`}>
        {/* Subtle accent corner glow */}
        <div 
          className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none ${
            badgeColor === 'red' ? 'bg-[#FE2C55]' : 'bg-[#00B2FF]'
          }`} 
        />

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 flex-wrap min-w-0">
            {/* TikTok Verified Badge at top */}
            <div className="flex items-center gap-1.5 shrink-0">
              <TikTokVerifiedBadge color={badgeColor} size="md" tooltipText="Verified Campus Announcement" />
              <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryTagStyles}`}>
                {category}
              </span>
            </div>

            <span className="text-[11px] text-[#7A7A6A] font-medium hidden sm:inline">
              • {date}
            </span>

            {isAdmin && onEditAnnouncement && (
              <button
                onClick={onEditAnnouncement}
                className="text-[10px] font-bold text-[#5A5A40] underline hover:text-[#2D2D2A] ml-1"
              >
                (Admin Edit)
              </button>
            )}
          </div>

          {/* Action buttons: Collapse & Dismiss */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-full text-[#7A7A6A] hover:text-[#2D2D2A] hover:bg-black/5 transition"
              title={isExpanded ? 'Collapse message' : 'Expand message'}
              aria-label={isExpanded ? 'Collapse message' : 'Expand message'}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 rounded-full text-[#7A7A6A] hover:text-[#2D2D2A] hover:bg-black/5 transition"
              title="Dismiss announcement"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-serif font-bold text-base sm:text-lg text-[#2D2D2A] mt-2 tracking-tight">
          {title}
        </h3>

        {/* Expandable Body Message */}
        {isExpanded && (
          <div className="mt-2 space-y-2">
            <p className="text-xs sm:text-sm text-[#55554F] leading-relaxed whitespace-pre-line">
              {message}
            </p>

            {/* Official Verification Seal Footer */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#E0E0D5]/70 text-[11px] text-[#7A7A6A]">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className={`w-3.5 h-3.5 ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-[#0284c7]'}`} />
                <span>Verified by C'IO University of Ilorin Mini Campus Administration</span>
              </div>
              <span className="sm:hidden text-[10px] text-[#8A8A7A]">
                {date}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
