import React, { useState } from 'react';
import { Camera, CheckCircle2, ShieldCheck, X, ArrowRight, Zap } from 'lucide-react';

interface ImageRequirementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const ImageRequirementsModal: React.FC<ImageRequirementsModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('cio_hide_image_requirements', 'true');
      } catch (e) {
        // localStorage might be unavailable in private browsing
      }
    }
    onContinue();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-requirements-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E0E0D5] text-[#2D2D2A]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-full text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] transition"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center shrink-0">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A5A40] block">
              Seller Requirements
            </span>
            <h3 id="image-requirements-title" className="text-lg font-serif font-bold text-[#2D2D2A]">
              Image Upload Guidelines
            </h3>
          </div>
        </div>

        <p className="text-xs text-[#7A7A6A] leading-relaxed mb-4">
          To ensure quick browsing for buyers across campus on mobile data, please follow these listing photo requirements:
        </p>

        {/* Requirements Box */}
        <div className="space-y-2.5 bg-[#F5F5F0] rounded-2xl p-4 border border-[#E0E0D5] mb-5">
          <div className="flex items-start gap-2.5 text-xs text-[#2D2D2A]">
            <CheckCircle2 className="h-4 w-4 text-[#5A5A40] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">JPG / JPEG Format Only:</strong> Phone camera photos and standard digital images are supported.
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-[#2D2D2A]">
            <CheckCircle2 className="h-4 w-4 text-[#5A5A40] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Maximum 300 KB Size:</strong> Images are verified before posting.
            </div>
          </div>

          <div className="flex items-start gap-2.5 text-xs text-[#5A5A40] font-medium">
            <Zap className="h-4 w-4 text-[#5A5A40] shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold text-[#2D2D2A]">Automatic Mobile Optimization:</strong> Large photos taken from your phone camera are automatically compressed and resized for instant upload.
            </div>
          </div>
        </div>

        {/* Don't show again checkbox */}
        <label className="flex items-center gap-2.5 text-xs text-[#7A7A6A] cursor-pointer select-none mb-5">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 rounded border-[#E0E0D5] text-[#5A5A40] focus:ring-[#5A5A40]"
          />
          <span>Don&apos;t show this reminder again</span>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-full border border-[#E0E0D5] hover:bg-[#F5F5F0] text-[#2D2D2A] text-xs font-bold transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3 px-4 rounded-full bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
          >
            <span>Continue</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
