import React, { useState, useEffect } from 'react';
import { Listing, User } from '../types';
import { TikTokVerifiedBadge } from './TikTokVerifiedBadge';
import { 
  X, 
  MapPin, 
  Heart, 
  Share2, 
  ShieldCheck, 
  MessageCircle, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Check, 
  Sparkles,
  Eye,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { cleanPhoneNumber, generateWhatsAppOrderMessage } from '../utils/whatsapp';
import { formatListingExpiration, recordSessionProductView } from '../utils/marketplaceUtils';
import { SellerProfileData } from './SellerProfileModal';
import { api } from '../utils/api';

interface ProductDetailModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  currentUser?: User;
  onReportListing: (listing: Listing) => void;
  onOpenSellerProfile?: (seller: SellerProfileData) => void;
  badgeColor?: 'blue' | 'red';
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  listing,
  isOpen,
  onClose,
  isFavorite,
  onToggleFavorite,
  currentUser,
  onReportListing,
  onOpenSellerProfile,
  badgeColor = 'blue',
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Record product view once per session to eliminate redundant Firestore writes
  useEffect(() => {
    if (isOpen && listing?.id) {
      const isNewSessionView = recordSessionProductView(listing.id);
      if (isNewSessionView) {
        api.recordView(listing.id).catch(() => {});
        // Optimistically increment view count on the active object
        listing.viewsCount = (listing.viewsCount || 0) + 1;
      }
    }
  }, [isOpen, listing?.id]);

  if (!isOpen || !listing) return null;

  const expiration = formatListingExpiration(listing);

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

  const handleOpenSeller = () => {
    if (onOpenSellerProfile) {
      onOpenSellerProfile({
        sellerId: listing.sellerId,
        sellerName: listing.sellerName,
        sellerPhone: listing.sellerPhone,
        sellerRole: listing.sellerRole,
        sellerMatricVerified: listing.sellerMatricVerified,
        sellerMatricNumber: listing.sellerMatricNumber,
        sellerBusinessName: listing.sellerBusinessName,
        sellerBusinessVerified: listing.sellerBusinessVerified,
        campusLocation: listing.campusLocation,
      });
    }
  };

  const formattedDate = (() => {
    try {
      const d = new Date(listing.createdAt);
      return isNaN(d.getTime()) ? 'Recently listed' : d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently listed';
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        id="product-detail-modal-card" 
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-[#E0E0D5] overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E0E0D5] bg-white z-10 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#5A5A40] bg-[#E8E8DF] px-3 py-1 rounded-full border border-[#E0E0D5]">
              {listing.category}
            </span>
            {listing.isFeatured && !expiration.isExpired && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#5A5A40] bg-[#5A5A40]/10 px-2.5 py-0.5 rounded-full border border-[#5A5A40]/25">
                <Sparkles className="h-3 w-3 text-[#5A5A40]" />
                Featured Deal
              </span>
            )}
            {expiration.isExpired ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-rose-700 px-2.5 py-0.5 rounded-full shadow-xs">
                Expired
              </span>
            ) : expiration.isExpiringSoon ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-amber-700 px-2.5 py-0.5 rounded-full shadow-xs">
                Expiring Soon ({expiration.daysRemaining} days left)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#7A7A6A] bg-[#F5F5F0] px-2.5 py-0.5 rounded-full border border-[#E0E0D5]">
                {expiration.daysRemaining} days active
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

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1">
          {/* Main Image */}
          <div className="relative aspect-16/10 w-full rounded-2xl overflow-hidden bg-[#E8E8DF] border border-[#E0E0D5]">
            <img
              src={listing.imageUrl}
              alt={listing.title}
              className={`h-full w-full object-contain bg-neutral-900/5 ${
                expiration.isExpired ? 'grayscale opacity-80' : ''
              }`}
            />
            {listing.condition && (
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-semibold text-[#5A5A40] border border-[#E0E0D5] shadow-xs">
                {listing.condition}
              </div>
            )}
          </div>

          {/* Title & Pricing Block */}
          <div>
            <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#2D2D2A]">
                {listing.title}
              </h2>
            </div>

            <div className="flex items-center justify-between gap-4 mt-2 flex-wrap">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-serif font-bold text-[#5A5A40]">
                  ₦{listing.price.toLocaleString()}
                </span>
                {listing.originalPrice && listing.originalPrice > listing.price && (
                  <span className="text-base text-[#A0A090] line-through">
                    ₦{listing.originalPrice.toLocaleString()}
                  </span>
                )}
                {listing.isSubscription && (
                  <span className="text-xs text-[#5A5A40] font-medium bg-[#E8E8DF] px-2 py-0.5 rounded">
                    /{listing.subscriptionDuration || 'sub'}
                  </span>
                )}
              </div>

              {/* View Count & Listed Date */}
              <div className="flex items-center gap-3 text-xs text-[#7A7A6A]">
                <span className="flex items-center gap-1 bg-[#F5F5F0] px-2.5 py-1 rounded-lg border border-[#E0E0D5]">
                  <Eye className="h-3.5 w-3.5 text-[#5A5A40]" />
                  <strong>{listing.viewsCount || 0}</strong> views
                </span>
                <span className="flex items-center gap-1 bg-[#F5F5F0] px-2.5 py-1 rounded-lg border border-[#E0E0D5]">
                  <Calendar className="h-3.5 w-3.5 text-[#A0A090]" />
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* Campus Location */}
            <div className="flex items-center gap-1.5 text-xs text-[#7A7A6A] mt-2.5">
              <MapPin className="h-4 w-4 text-[#5A5A40] shrink-0" />
              <span>{listing.campusLocation}</span>
            </div>
          </div>

          {/* Seller Verified Box with Profile link */}
          <div className="rounded-2xl bg-[#F5F5F0] p-4 border border-[#E0E0D5] flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div 
                  onClick={handleOpenSeller}
                  className="w-12 h-12 rounded-full bg-[#E8E8DF] flex items-center justify-center font-serif font-bold text-[#5A5A40] text-base border border-[#E0E0D5] cursor-pointer hover:bg-[#5A5A40] hover:text-white transition shrink-0"
                >
                  {listing.sellerName.charAt(0)}
                </div>
                <div>
                  {/* TOP OF PERSON'S NAME: TikTok-style Verified Badge */}
                  {listing.sellerRole === 'student' && listing.sellerMatricVerified && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <TikTokVerifiedBadge color={badgeColor} size="sm" />
                      <span className={`text-[11px] font-bold tracking-tight uppercase ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-[#0284c7]'}`}>
                        Verified Student
                      </span>
                    </div>
                  )}
                  {listing.sellerRole === 'business' && (
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <TikTokVerifiedBadge color={badgeColor} size="sm" />
                      <span className={`text-[11px] font-bold tracking-tight uppercase ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-[#0284c7]'}`}>
                        Verified Campus Store
                      </span>
                    </div>
                  )}
                  {/* PERSON'S NAME */}
                  <h4 
                    onClick={handleOpenSeller}
                    className="font-serif font-bold text-base text-[#2D2D2A] cursor-pointer hover:text-[#5A5A40] hover:underline"
                  >
                    {listing.sellerName}
                  </h4>

                  <p className="text-xs text-[#7A7A6A] mt-0.5">
                    {listing.sellerRole === 'student'
                      ? `Matric: ${listing.sellerMatricNumber || 'Verified Mini Campus Student'} • University of Ilorin Mini Campus`
                      : listing.sellerBusinessName || 'Mini Campus Vendor'}
                  </p>

                  <div className="flex items-center gap-1 text-[11px] text-[#5A5A40] font-medium mt-1">
                    <Clock className="w-3 h-3" />
                    <span>WhatsApp: {listing.sellerPhone}</span>
                  </div>
                </div>
              </div>

              {/* View Full Seller Profile Action */}
              <button
                type="button"
                onClick={handleOpenSeller}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#E0E0D5] hover:bg-[#E8E8DF] text-xs font-semibold text-[#2D2D2A] transition shadow-xs"
              >
                <span>View Seller Profile</span>
                <ExternalLink className="h-3 w-3 text-[#7A7A6A]" />
              </button>
            </div>
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
