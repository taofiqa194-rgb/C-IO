import React, { useState } from 'react';
import { Listing, User } from '../types';
import { 
  X, 
  MapPin, 
  Heart, 
  Share2, 
  ShieldCheck, 
  CheckCircle2, 
  Store, 
  MessageCircle, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  Sparkles 
} from 'lucide-react';
import { cleanPhoneNumber, generateWhatsAppOrderMessage } from '../utils/whatsapp';

interface ProductDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  currentUser?: User;
  onReportListing: (listing: Listing) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  currentUser,
  onReportListing,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  if (!isOpen || !listing) return null;

  const handleShare = () => {
    const url = `${window.location.origin}/#item-${listing.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppOrder = () => {
    const phone = cleanPhoneNumber(listing.sellerPhone);
    const message = generateWhatsAppOrderMessage(listing, currentUser?.name);
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    const message = generateWhatsAppOrderMessage(listing, currentUser?.name);
    navigator.clipboard.writeText(message);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        id="product-detail-modal-card" 
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-[#E0E0D5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E0E0D5] bg-white z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#5A5A40] bg-[#E8E8DF] px-3 py-1 rounded-full border border-[#E0E0D5]">
              {listing.category}
            </span>
            {listing.isFeatured && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2.5 py-0.5 rounded-full border border-[#5A5A40]/25">
                <Sparkles className="h-3 w-3 text-[#5A5A40]" />
                Featured Listing
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="rounded-full p-2 text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] transition"
              title="Share listing link"
            >
              {copiedLink ? <Check className="h-4 w-4 text-[#5A5A40]" /> : <Share2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => onToggleFavorite(listing.id)}
              className="rounded-full p-2 text-[#7A7A6A] hover:bg-[#F5F5F0] transition"
              title="Save to favorites"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-[#5A5A40] text-[#5A5A40]' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] transition"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 space-y-5">
          {/* Main Image */}
          <div className="relative rounded-2xl overflow-hidden bg-[#F5F5F0] aspect-16/10 border border-[#E0E0D5]">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3">
              <span className="rounded-full bg-[#2D2D2A]/85 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-white">
                {listing.condition}
              </span>
            </div>
            {listing.isSubscription && (
              <div className="absolute bottom-3 left-3">
                <span className="rounded-full bg-[#5A5A40]/90 backdrop-blur-xs px-3.5 py-1 text-xs font-bold text-white flex items-center gap-1.5">
                  🎟️ Student Subscription: {listing.subscriptionDuration}
                </span>
              </div>
            )}
          </div>

          {/* Title & Price Header */}
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2D2A] leading-tight">
              {listing.title}
            </h1>

            <div className="mt-2.5 flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold font-serif text-[#5A5A40]">
                ₦{listing.price.toLocaleString()}
              </span>
              {listing.originalPrice && listing.originalPrice > listing.price && (
                <span className="text-sm text-[#7A7A6A] line-through">
                  ₦{listing.originalPrice.toLocaleString()}
                </span>
              )}
              {listing.isSubscription && (
                <span className="text-xs font-semibold text-[#5A5A40] bg-[#E8E8DF] px-2.5 py-0.5 rounded-full border border-[#E0E0D5]">
                  Plan: {listing.subscriptionDuration}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-[#7A7A6A]">
              <MapPin className="h-3.5 w-3.5 text-[#7A7A6A] shrink-0" />
              <span>Campus Pickup/Location: <strong className="text-[#2D2D2A]">{listing.campusLocation}</strong></span>
            </div>
          </div>

          {/* Seller Verified Box */}
          <div className="rounded-2xl bg-[#F5F5F0] p-4 border border-[#E0E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#E8E8DF] flex items-center justify-center font-serif font-bold text-[#5A5A40] text-base border border-[#E0E0D5]">
                {listing.sellerName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-[#2D2D2A]">{listing.sellerName}</span>
                  {listing.sellerRole === 'student' && listing.sellerMatricVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] bg-[#5A5A40]/10 text-[#5A5A40] px-2 py-0.5 rounded-full font-semibold border border-[#5A5A40]/25">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40]" />
                      Student Verified
                    </span>
                  )}
                  {listing.sellerRole === 'business' && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] bg-[#E8E8DF] text-[#2D2D2A] px-2 py-0.5 rounded-full font-semibold border border-[#E0E0D5]">
                      <Store className="w-3.5 h-3.5 text-[#5A5A40]" />
                      Verified Business
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#7A7A6A] mt-0.5">
                  {listing.sellerRole === 'student'
                    ? `Matric: ${listing.sellerMatricNumber || 'Verified Mini Campus Student'} • University of Ilorin Mini Campus`
                    : listing.sellerBusinessName || 'Mini Campus Vendor'}
                </p>

                <div className="flex items-center gap-1 text-[11px] text-[#5A5A40] font-medium mt-1">
                  <Clock className="w-3 h-3" />
                  <span>WhatsApp seller: {listing.sellerPhone}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleWhatsAppOrder}
              className="sm:shrink-0 flex items-center justify-center gap-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs py-2.5 px-4 shadow-xs"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              Chat Seller Now
            </button>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-serif font-bold text-[#2D2D2A] mb-2">Item Description</h3>
            <p className="text-sm text-[#2D2D2A] leading-relaxed whitespace-pre-line bg-[#F5F5F0] p-4 rounded-xl border border-[#E0E0D5]">
              {listing.description}
            </p>
          </div>

          {/* WhatsApp Pre-filled message card */}
          <div className="rounded-2xl bg-[#E8E8DF]/60 p-4 border border-[#E0E0D5]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5 font-serif">
                <MessageCircle className="w-4 h-4 text-[#5A5A40]" />
                Auto-fill WhatsApp Order Message
              </span>
              <button
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-[#5A5A40] hover:underline flex items-center gap-1"
              >
                {copiedMsg ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedMsg ? 'Copied' : 'Copy Message'}
              </button>
            </div>
            <p className="text-xs text-[#2D2D2A] bg-white p-3 rounded-xl border border-[#E0E0D5] font-mono text-[11px] leading-relaxed">
              &quot;Hello {listing.sellerName}, I&apos;m interested in buying &apos;{listing.title}&apos; for ₦{listing.price.toLocaleString()} on C&apos;IO — University of Ilorin Mini Campus Marketplace. Is it still available?&quot;
            </p>
            <p className="text-[11px] text-[#5A5A40] mt-2">
              Clicking below will automatically open WhatsApp with the verified seller&apos;s number and this text already filled in!
            </p>
          </div>

          {/* Mini Campus Safety Tips */}
          <div className="rounded-2xl bg-[#F5F5F0] p-3.5 border border-[#E0E0D5] flex items-start gap-2.5 text-xs text-[#2D2D2A]">
            <ShieldCheck className="h-5 w-5 text-[#5A5A40] shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">University of Ilorin Mini Campus Safety Rules:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-[#7A7A6A]">
                <li>Meet in daylight at busy Mini Campus locations (Mini Campus Main Gate, Mini Campus Library, or Student Center).</li>
                <li>Inspect and test the item thoroughly before making payment.</li>
                <li>Never send money in advance for delivery or reservations.</li>
              </ul>
            </div>
          </div>

          {/* Report Button */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                onClose();
                onReportListing(listing);
              }}
              className="inline-flex items-center gap-1 text-xs text-[#7A7A6A] hover:text-rose-700 transition"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Report scam or suspicious listing to Campus Admin Desk</span>
            </button>
          </div>
        </div>

        {/* Sticky Bottom Action */}
        <div className="p-4 border-t border-[#E0E0D5] bg-white flex items-center gap-3 shrink-0">
          <button
            id="order-on-whatsapp-full-btn"
            onClick={handleWhatsAppOrder}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1fa951] py-3 text-sm font-bold text-white shadow-md transition active:scale-[0.99]"
          >
            <MessageCircle className="h-5 w-5 fill-current" />
            <span>Place Order on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
