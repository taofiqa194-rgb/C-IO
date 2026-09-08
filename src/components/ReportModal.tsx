import React, { useState } from 'react';
import { Listing, User, ComplaintTicket, SupportCategory } from '../types';
import { OFFICIAL_SUPPORT_PHONE } from '../data/mockData';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Send, 
  Loader2, 
  HelpCircle 
} from 'lucide-react';

interface ReportTarget {
  type: 'listing' | 'seller';
  listing?: Listing;
  sellerName?: string;
  sellerPhone?: string;
  sellerId?: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: ReportTarget | null;
  currentUser?: User | null;
  onSubmitReport: (reportData: Partial<ComplaintTicket>) => Promise<void>;
}

const REPORT_REASONS = [
  { id: 'scam', label: 'Suspected Scam or Impersonation', category: 'Reported scams' as SupportCategory },
  { id: 'price', label: 'Misleading Price or Hidden Demands', category: 'Other complaints' as SupportCategory },
  { id: 'counterfeit', label: 'Counterfeit, Stolen, or Prohibited Item', category: 'Reported scams' as SupportCategory },
  { id: 'sold', label: 'Item Already Sold or Out of Stock', category: 'Other complaints' as SupportCategory },
  { id: 'location', label: 'Refusing to Meet at Mini Campus / Fake Location', category: 'Reported scams' as SupportCategory },
  { id: 'harassment', label: 'Harassment or Inappropriate Behavior', category: 'Other complaints' as SupportCategory },
  { id: 'other', label: 'Other Campus Marketplace Violation', category: 'Other complaints' as SupportCategory },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  target,
  currentUser,
  onSubmitReport,
}) => {
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState(currentUser?.name || '');
  const [reporterPhone, setReporterPhone] = useState(currentUser?.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg('Please describe why you are reporting this listing or seller.');
      return;
    }
    if (!reporterPhone.trim()) {
      setErrorMsg('Please provide your phone or WhatsApp number so the admin team can follow up.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const subject = target.type === 'listing' && target.listing
        ? `Report on listing: "${target.listing.title}"`
        : `Report on seller: ${target.sellerName || 'Unspecified'}`;

      const fullDetails = `
Reason: ${selectedReason.label}
Target Type: ${target.type}
${target.listing ? `Listing ID: ${target.listing.id}\nListing Title: ${target.listing.title}\nSeller: ${target.listing.sellerName} (${target.listing.sellerPhone})` : ''}
${target.sellerName ? `Seller Name: ${target.sellerName}\nSeller Phone: ${target.sellerPhone || 'N/A'}` : ''}

User Explanation:
${description.trim()}
      `.trim();

      await onSubmitReport({
        category: selectedReason.category,
        title: subject,
        description: fullDetails,
        userName: reporterName || 'Anonymous Student',
        userPhone: reporterPhone,
        userId: currentUser?.id,
        listingId: target.listing?.id,
        accusedSellerName: target.listing?.sellerName || target.sellerName,
        status: 'Open',
        createdAt: new Date().toISOString(),
      });

      setIsSubmitted(true);
    } catch (err: any) {
      console.error('Failed to submit report:', err);
      setErrorMsg('Unable to submit your report. Please check your internet connection or contact the campus admin desk directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setDescription('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div
        id="report-modal-card"
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#E0E0D5] shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E0E0D5] bg-[#FAF9F6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-[#2D2D2A]">
                Campus Safety Report
              </h3>
              <p className="text-[11px] text-[#7A7A6A]">
                University of Ilorin Mini Campus Admin Desk
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full text-[#7A7A6A] hover:bg-[#E8E8DF] transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {isSubmitted ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-base font-serif font-bold text-[#2D2D2A]">
                Report Submitted Successfully
              </h4>
              <p className="text-xs text-[#7A7A6A] mt-1.5 max-w-sm mx-auto leading-relaxed">
                Thank you for protecting our Mini Campus marketplace community. Our moderation team will investigate this report and take appropriate disciplinary actions.
              </p>
            </div>
            <div className="bg-[#F5F5F0] rounded-2xl p-3.5 text-xs text-[#5A5A40] border border-[#E0E0D5]">
              <strong>Emergency Scam Helpline:</strong> {OFFICIAL_SUPPORT_PHONE} (Call or WhatsApp if urgent financial scam).
            </div>
            <button
              onClick={handleClose}
              className="w-full py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#474732] text-white font-bold text-xs shadow-xs transition"
            >
              Done & Return to Marketplace
            </button>
          </div>
        ) : (
          /* Report Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            {/* Target Summary Card */}
            <div className="p-3 bg-[#F5F5F0] rounded-2xl border border-[#E0E0D5] flex items-center gap-3">
              {target.type === 'listing' && target.listing ? (
                <>
                  <img
                    src={target.listing.imageUrl}
                    alt={target.listing.title}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E0E0D5] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                      Reporting Listing
                    </span>
                    <h5 className="font-bold text-[#2D2D2A] truncate">{target.listing.title}</h5>
                    <p className="text-[11px] text-[#7A7A6A]">
                      Seller: {target.listing.sellerName} • ₦{target.listing.price.toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
                    Reporting Campus Seller
                  </span>
                  <h5 className="font-bold text-[#2D2D2A] text-sm">{target.sellerName}</h5>
                  <p className="text-[11px] text-[#7A7A6A]">Phone: {target.sellerPhone || 'N/A'}</p>
                </div>
              )}
            </div>

            {/* Violation Reason */}
            <div>
              <label className="block font-bold text-[#2D2D2A] mb-1.5">
                Primary Reason for Report
              </label>
              <select
                id="report-reason-select"
                value={selectedReason.id}
                onChange={(e) => {
                  const r = REPORT_REASONS.find((x) => x.id === e.target.value);
                  if (r) setSelectedReason(r);
                }}
                className="w-full bg-[#F5F5F0] border border-[#E0E0D5] text-[#2D2D2A] rounded-xl px-3 py-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Explanation */}
            <div>
              <label className="block font-bold text-[#2D2D2A] mb-1">
                Details & Evidence <span className="text-rose-600">*</span>
              </label>
              <textarea
                id="report-details-textarea"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened (e.g. seller requested upfront transfer, fake item, wrong location, not picking calls)..."
                className="w-full bg-[#F5F5F0] border border-[#E0E0D5] text-[#2D2D2A] rounded-xl p-3 placeholder-[#A0A090] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
              />
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[#2D2D2A] mb-1">Your Name</label>
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-[#F5F5F0] border border-[#E0E0D5] text-[#2D2D2A] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#2D2D2A] mb-1">
                  Your WhatsApp / Phone <span className="text-rose-600">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={reporterPhone}
                  onChange={(e) => setReporterPhone(e.target.value)}
                  placeholder="080XXXXXXXX"
                  className="w-full bg-[#F5F5F0] border border-[#E0E0D5] text-[#2D2D2A] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Form Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E0E0D5]">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-[#7A7A6A] hover:bg-[#F5F5F0] font-semibold transition"
              >
                Cancel
              </button>
              <button
                id="submit-report-btn"
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold shadow-xs transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Submit Report</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
