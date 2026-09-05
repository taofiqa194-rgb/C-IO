import React, { useState } from 'react';
import { Listing, User } from '../types';
import { cleanPhoneNumber, generateWhatsAppOrderMessage } from '../utils/whatsapp';
import { MessageSquare, Copy, Check, ExternalLink, ShieldCheck, MapPin, X } from 'lucide-react';

interface WhatsAppOrderModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
}

export const WhatsAppOrderModal: React.FC<WhatsAppOrderModalProps> = ({
  listing,
  isOpen,
  onClose,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [pickupSpot, setPickupSpot] = useState('Mini Campus Main Gate');
  const [customNote, setCustomNote] = useState('');

  if (!isOpen || !listing) return null;

  const sellerPhoneClean = cleanPhoneNumber(listing.sellerPhone);
  
  // Custom message generation
  const defaultBase = generateWhatsAppOrderMessage(listing, currentUser?.name);
  const fullMessage = customNote.trim()
    ? `${defaultBase}\n\nNote: ${customNote.trim()} (Suggested Meetup: ${pickupSpot})`
    : `${defaultBase}\n\nSuggested Meetup: ${pickupSpot}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(fullMessage);
    const url = `https://wa.me/${sellerPhoneClean}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div 
        id="whatsapp-order-modal-card" 
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#E0E0D5]"
      >
        <button
          id="close-whatsapp-modal-btn"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#E8E8DF] flex items-center justify-center text-[#5A5A40] border border-[#E0E0D5]">
            <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-serif font-bold text-[#2D2D2A]">Direct WhatsApp Order</h3>
            <p className="text-xs text-[#7A7A6A]">Auto-filled order message to verified seller</p>
          </div>
        </div>

        {/* Item Summary mini pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5] mb-4">
          <img
            src={listing.imageUrl}
            alt={listing.title}
            className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E0E0D5]"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-[#2D2D2A] truncate">{listing.title}</h4>
            <div className="text-sm font-serif font-bold text-[#5A5A40]">₦{listing.price.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-[11px] text-[#7A7A6A] mt-0.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span>{listing.campusLocation}</span>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="mb-4 text-xs text-[#2D2D2A] bg-[#E8E8DF]/60 p-2.5 rounded-xl border border-[#E0E0D5] flex items-center justify-between">
          <div>
            <span className="text-[#7A7A6A]">Seller: </span>
            <span className="font-semibold text-[#2D2D2A]">{listing.sellerName}</span>
            {listing.sellerMatricVerified && (
              <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] bg-[#5A5A40]/10 text-[#5A5A40] px-1.5 py-0.5 rounded-full font-medium border border-[#5A5A40]/20">
                <ShieldCheck className="w-3 h-3 text-[#5A5A40]" />
                Matric Verified
              </span>
            )}
          </div>
          <span className="font-mono text-[#5A5A40] font-medium">{listing.sellerPhone}</span>
        </div>

        {/* Suggested Safe Meetup Spot */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-[#2D2D2A] mb-1">
            Suggested Safe Meetup Spot (University of Ilorin Mini Campus):
          </label>
          <select
            value={pickupSpot}
            onChange={(e) => setPickupSpot(e.target.value)}
            className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
          >
            <option value="Mini Campus Main Gate">Mini Campus Main Gate</option>
            <option value="Mini Campus Student Center">Mini Campus Student Center</option>
            <option value="Mini Campus Library Foyer">Mini Campus Library Foyer</option>
            <option value="Mini Campus Administrative Block">Mini Campus Administrative Block</option>
            <option value="Mini Campus Hostel Block A/B">Mini Campus Hostel Block A/B</option>
            <option value="Mini Campus Cafeteria">Mini Campus Cafeteria</option>
          </select>
        </div>

        {/* Pre-filled Message Preview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-[#2D2D2A]">Pre-filled Message Preview:</span>
            <button
              onClick={handleCopy}
              className="text-[11px] font-medium text-[#5A5A40] hover:underline flex items-center gap-1"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied!' : 'Copy text'}
            </button>
          </div>
          <div className="p-3 bg-[#F5F5F0] rounded-xl text-xs text-[#2D2D2A] font-sans whitespace-pre-line border border-[#E0E0D5] max-h-36 overflow-y-auto">
            {fullMessage}
          </div>
        </div>

        {/* Quick Additional Note */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Add optional note (e.g., Can we meet by 2pm today?)"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2 text-xs text-[#2D2D2A] focus:border-[#5A5A40] focus:outline-hidden"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            id="launch-whatsapp-direct-btn"
            onClick={handleOpenWhatsApp}
            className="w-full flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1fa951] py-3 text-sm font-semibold text-white shadow-md transition"
          >
            <ExternalLink className="h-4 w-4" />
            Open WhatsApp & Send Pre-filled Message
          </button>
          
          <p className="text-[11px] text-center text-[#7A7A6A] mt-1">
            🛡️ Safety reminder: Inspect products at public Mini Campus locations before payment.
          </p>
        </div>
      </div>
    </div>
  );
};
