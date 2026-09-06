import React, { useState } from 'react';
import { 
  Download, 
  X, 
  Share, 
  PlusSquare, 
  MoreVertical, 
  Smartphone, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ArrowRight
} from 'lucide-react';

interface PWAPromptModalProps {
  isOpen: boolean;
  onInstall: () => void;
  onDismiss: () => void;
  isIOS: boolean;
  isAndroid: boolean;
  showGuide: boolean;
  onCloseGuide: () => void;
}

// C'IO Mini Brand Mark
const CioAppIcon: React.FC<{ size?: 'md' | 'lg' }> = ({ size = 'md' }) => {
  const isLg = size === 'lg';
  return (
    <div
      className={`relative rounded-2xl bg-[#141413] border border-[#8E8E6F]/40 flex items-center justify-center shrink-0 shadow-lg ${
        isLg ? 'w-16 h-16' : 'w-12 h-12'
      }`}
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isLg ? 'w-10 h-10' : 'w-7 h-7'}
      >
        <path
          d="M21 9C19.5 7.8 17.5 7 15 7C9.48 7 5 11.48 5 17C5 22.52 9.48 27 15 27C17.5 27 19.5 26.2 21 25"
          stroke="#FFFFFF"
          strokeWidth="2.75"
          strokeLinecap="round"
        />
        <circle cx="16" cy="17" r="1.85" fill="#8E8E6F" />
        <path
          d="M20 11.5L22 9"
          stroke="#8E8E6F"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M24 13V23"
          stroke="#FFFFFF"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle
          cx="29"
          cy="18"
          r="4.25"
          stroke="#FFFFFF"
          strokeWidth="2.3"
        />
      </svg>
    </div>
  );
};

export const PWAPromptModal: React.FC<PWAPromptModalProps> = ({
  isOpen,
  onInstall,
  onDismiss,
  isIOS,
  isAndroid,
  showGuide,
  onCloseGuide,
}) => {
  // Guide tab selection (default to detected OS, but toggleable)
  const [guideTab, setGuideTab] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');

  // If instruction guide is active
  if (showGuide) {
    return (
      <div 
        id="pwa-guide-overlay"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      >
        <div 
          id="pwa-guide-card"
          className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#E0E0D5] max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#E0E0D5]">
            <div className="flex items-center gap-3">
              <CioAppIcon size="md" />
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2D2D2A]">
                  Add C'IO to Home Screen
                </h3>
                <p className="text-xs text-[#7A7A6A]">
                  Direct access without using browser tabs
                </p>
              </div>
            </div>
            <button
              onClick={onCloseGuide}
              className="p-2 rounded-full text-[#7A7A6A] hover:text-[#2D2D2A] hover:bg-[#F5F5F0] transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* OS Switcher Pills */}
          <div className="flex gap-2 mt-4 p-1 bg-[#F5F5F0] rounded-xl">
            <button
              onClick={() => setGuideTab('ios')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                guideTab === 'ios'
                  ? 'bg-white text-[#2D2D2A] shadow-xs'
                  : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
              }`}
            >
              <span>iPhone / Safari</span>
            </button>
            <button
              onClick={() => setGuideTab('android')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
                guideTab === 'android'
                  ? 'bg-white text-[#2D2D2A] shadow-xs'
                  : 'text-[#7A7A6A] hover:text-[#2D2D2A]'
              }`}
            >
              <span>Android / Chrome</span>
            </button>
          </div>

          {/* Step Instructions */}
          {guideTab === 'ios' ? (
            <div className="space-y-3 mt-4 text-xs text-[#2D2D2A]">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5]">
                <div className="w-6 h-6 rounded-full bg-[#5A5A40] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Tap the Safari Share button</p>
                  <p className="text-[#7A7A6A] mt-0.5">
                    Look for the square icon with an upward arrow <Share className="inline-block w-3.5 h-3.5 mx-0.5 text-[#5A5A40]" /> at the bottom or top of Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5]">
                <div className="w-6 h-6 rounded-full bg-[#5A5A40] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Select "Add to Home Screen"</p>
                  <p className="text-[#7A7A6A] mt-0.5">
                    Scroll down through the share sheet options and tap <PlusSquare className="inline-block w-3.5 h-3.5 mx-0.5 text-[#5A5A40]" /> <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5]">
                <div className="w-6 h-6 rounded-full bg-[#5A5A40] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Confirm by tapping "Add"</p>
                  <p className="text-[#7A7A6A] mt-0.5">
                    Tap <strong>Add</strong> in the top right corner. The C'IO app icon will appear immediately on your home screen!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mt-4 text-xs text-[#2D2D2A]">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5]">
                <div className="w-6 h-6 rounded-full bg-[#5A5A40] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Tap the Browser Menu</p>
                  <p className="text-[#7A7A6A] mt-0.5">
                    Tap the three dots <MoreVertical className="inline-block w-3.5 h-3.5 mx-0.5 text-[#5A5A40]" /> in Chrome or your mobile browser toolbar.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5]">
                <div className="w-6 h-6 rounded-full bg-[#5A5A40] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Tap "Install app" or "Add to Home screen"</p>
                  <p className="text-[#7A7A6A] mt-0.5">
                    Select <strong>Install app</strong> or <strong>Add to Home screen</strong> from the list.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F5F0] border border-[#E0E0D5]">
                <div className="w-6 h-6 rounded-full bg-[#5A5A40] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Confirm Installation</p>
                  <p className="text-[#7A7A6A] mt-0.5">
                    Tap <strong>Install</strong>. C'IO will install as a standalone app on your phone with instant launch!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-5 pt-3 border-t border-[#E0E0D5]">
            <button
              id="pwa-guide-gotit-btn"
              onClick={onCloseGuide}
              className="w-full py-2.5 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white font-bold text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Got it, thanks!</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Initial Mobile Popup as explicitly specified:
  // "Install C'IO 📱"
  // "Add C'IO to your home screen for quick and easy access."
  // Two buttons: "Install" and "Not Now"
  if (!isOpen) return null;

  return (
    <div 
      id="pwa-install-popup-overlay"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-popup-title"
    >
      <div 
        id="pwa-install-popup-card"
        className="w-full max-w-sm sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl border border-[#E0E0D5] relative animate-in slide-in-from-bottom duration-300"
      >
        {/* Subtle close X icon */}
        <button
          id="pwa-popup-close-x"
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#7A7A6A] hover:text-[#2D2D2A] hover:bg-[#F5F5F0] transition cursor-pointer"
          aria-label="Dismiss installation popup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Brand identity header */}
        <div className="flex items-center gap-3.5 mb-3.5">
          <CioAppIcon size="lg" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#141413] text-white border border-[#8E8E6F]/30">
                Official PWA
              </span>
              <span className="text-[11px] text-[#7A7A6A]">
                Unilorin Mini Campus
              </span>
            </div>
            <h2 
              id="pwa-popup-title"
              className="font-serif font-bold text-xl sm:text-2xl text-[#2D2D2A] leading-tight mt-0.5"
            >
              Install C'IO 📱
            </h2>
          </div>
        </div>

        {/* User Request Required Description */}
        <p className="text-sm text-[#55554F] leading-relaxed mb-4">
          Add C'IO to your home screen for quick and easy access.
        </p>

        {/* Quick Highlights of PWA */}
        <div className="grid grid-cols-2 gap-2 mb-5 text-[11px] text-[#4A4A42]">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#F5F5F0] border border-[#E0E0D5]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40] shrink-0" />
            <span>Fast instant launch</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#F5F5F0] border border-[#E0E0D5]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40] shrink-0" />
            <span>Direct WhatsApp chats</span>
          </div>
        </div>

        {/* Two Required Buttons: "Install" & "Not Now" */}
        <div className="flex flex-col sm:flex-row-reverse gap-2.5">
          {/* Primary Action: Install */}
          <button
            id="pwa-install-confirm-btn"
            onClick={onInstall}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white font-bold text-sm transition shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Install</span>
          </button>

          {/* Secondary Action: Not Now */}
          <button
            id="pwa-install-dismiss-btn"
            onClick={onDismiss}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] hover:bg-[#E8E8DF] active:bg-[#D9D9C8] text-[#55554F] font-semibold text-sm transition flex items-center justify-center cursor-pointer"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
