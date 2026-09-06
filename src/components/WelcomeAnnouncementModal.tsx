import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, 
  X, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  CheckCircle2, 
  PlusCircle, 
  Headphones, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PlatformSettings } from '../types';
import { OFFICIAL_SUPPORT_PHONE } from '../data/mockData';

interface WelcomeAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlatformSettings;
  onNavigateToSell?: () => void;
  onNavigateToSupport?: () => void;
}

export const WelcomeAnnouncementModal: React.FC<WelcomeAnnouncementModalProps> = ({
  isOpen,
  onClose,
  settings,
  onNavigateToSell,
  onNavigateToSupport,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const title = settings.welcomePopupTitle || "Welcome to C'IO Mini Campus Marketplace! 🎓";
  const badge = settings.welcomePopupBadge || "Campus Announcement & Safety Guide";
  const message = settings.welcomePopupMessage || 
    "Welcome to the official University of Ilorin Mini Campus student marketplace! Buy, sell, or trade textbooks, gadgets, hostel accessories, and student passes safely with verified students.\n\nAlways inspect items in daylight at Mini Campus Gate or the Student Center before making payment.";
  const actionText = settings.welcomePopupActionText || "Explore Marketplace";
  const siteName = settings.siteName || "C'IO";

  // Split message by paragraphs for clean readability
  const paragraphs = message.split('\n').filter((p) => p.trim().length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-modal-title"
        >
          {/* Backdrop with soft blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0B0B0A]/75 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E0E0D5] overflow-hidden my-6 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner - Matte Black Brand Accent */}
            <div className="bg-[#141413] text-white p-5 sm:p-6 border-b border-[#262624] relative">
              {/* Close Button */}
              <button
                id="welcome-announcement-close-btn"
                onClick={onClose}
                aria-label="Close welcome announcement"
                className="absolute top-4 right-4 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Tag / Category Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-bold tracking-wide uppercase mb-3 border border-white/15">
                <Megaphone className="h-3.5 w-3.5 text-[#8E8E6F]" />
                <span>{badge}</span>
              </div>

              {/* Main Modal Title */}
              <h2 
                id="welcome-modal-title" 
                className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight leading-snug pr-8"
              >
                {title}
              </h2>

              <p className="text-xs text-white/75 mt-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#8E8E6F] shrink-0" />
                <span>{settings.siteTagline || "University of Ilorin Mini Campus Marketplace"}</span>
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-7 space-y-4 max-h-[62vh] overflow-y-auto">
              {/* Dynamic Announcement & Welcoming Message */}
              <div className="space-y-2.5 text-xs sm:text-sm text-[#2D2D2A] leading-relaxed">
                {paragraphs.map((para, index) => (
                  <p key={index} className="text-[#3A3A35] font-normal">
                    {para}
                  </p>
                ))}
              </div>

              {/* Safety & Campus Verification Quick Box */}
              <div className="bg-[#F5F5F0] rounded-2xl p-4 border border-[#E0E0D5] space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#2D2D2A]">
                  <ShieldCheck className="h-4 w-4 text-[#5A5A40]" />
                  <span>Important Campus Safety Guidelines</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#55554C]">
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#5A5A40] shrink-0 mt-0.5" />
                    <span>Meet at <strong>Mini Campus Gate</strong> or <strong>Student Center</strong>.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#5A5A40] shrink-0 mt-0.5" />
                    <span>Inspect item condition thoroughly before paying.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#5A5A40] shrink-0 mt-0.5" />
                    <span>Look for the <strong>Verified Student</strong> badge on seller profiles.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#5A5A40] shrink-0 mt-0.5" />
                    <span>Order directly via official seller WhatsApp.</span>
                  </div>
                </div>
              </div>

              {/* Official Support Reference */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E0E0D5] text-[11px] text-[#7A7A6A]">
                <div className="flex items-center gap-1.5">
                  <Headphones className="h-3.5 w-3.5 text-[#5A5A40]" />
                  <span>Official Support Desk:</span>
                  <strong className="font-mono text-[#2D2D2A]">{settings.platformSupportPhone || OFFICIAL_SUPPORT_PHONE}</strong>
                </div>
                {onNavigateToSupport && (
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToSupport();
                    }}
                    className="text-[#5A5A40] font-bold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Help Desk</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-5 bg-[#FAFAF7] border-t border-[#E0E0D5] flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
              {/* Secondary Sell CTA */}
              {onNavigateToSell ? (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToSell();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#D0D0C5] text-[#2D2D2A] hover:bg-[#E8E8DF] text-xs font-semibold transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4 text-[#5A5A40]" />
                  <span>Post an Item on {siteName}</span>
                </button>
              ) : (
                <div />
              )}

              {/* Primary Action Button */}
              <button
                id="welcome-modal-action-btn"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white text-xs font-bold transition shadow-xs cursor-pointer hover:shadow-md"
              >
                <span>{actionText}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
