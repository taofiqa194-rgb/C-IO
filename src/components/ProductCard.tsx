import React from 'react';
import { Listing } from '../types';
import { TikTokVerifiedBadge } from './TikTokVerifiedBadge';
import { Heart, MapPin, Store, Sparkles, MessageCircle, Eye } from 'lucide-react';

interface ProductCardProps {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: (listingId: string) => void;
  onOpenDetails: (listing: Listing) => void;
  onOpenWhatsAppOrder: (listing: Listing) => void;
  badgeColor?: 'blue' | 'red';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  listing,
  isFavorite,
  onToggleFavorite,
  onOpenDetails,
  onOpenWhatsAppOrder,
  badgeColor = 'blue',
}) => {
  return (
    <div
      id={`listing-card-${listing.id}`}
      className="group relative flex flex-col rounded-2xl bg-white border border-[#E0E0D5] hover:border-[#5A5A40]/60 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
    >
      {/* Top Media Container */}
      <div 
        className="relative aspect-4/3 w-full bg-[#E8E8DF] overflow-hidden cursor-pointer"
        onClick={() => onOpenDetails(listing)}
      >
        <img
          src={listing.imageUrl}
          alt={listing.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Top left badges: Featured / Subscription */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
          {listing.isFeatured && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#5A5A40] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
          {listing.isSubscription ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#2D2D2A] px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
              🎟️ {listing.subscriptionDuration || 'Subscription'}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-[#5A5A40] border border-[#E0E0D5]">
              {listing.condition}
            </span>
          )}
        </div>

        {/* Favorite button */}
        <button
          id={`favorite-btn-${listing.id}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(listing.id);
          }}
          className={`absolute top-2.5 right-2.5 rounded-full p-2 backdrop-blur-xs transition z-10 ${
            isFavorite
              ? 'bg-white text-[#5A5A40] shadow-sm'
              : 'bg-white/85 text-[#7A7A6A] hover:bg-white hover:text-[#2D2D2A]'
          }`}
          aria-label={isFavorite ? 'Remove from saved' : 'Save listing'}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-[#5A5A40] text-[#5A5A40]' : ''}`} />
        </button>

        {/* Category Pill at bottom of image */}
        <div className="absolute bottom-2 left-2.5">
          <span className="rounded-md bg-white/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-[#5A5A40] border border-[#E0E0D5]">
            {listing.category}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        {/* Seller Info Badge: TikTok Verified Badge at TOP of Person's Name */}
        <div className="mb-2 min-w-0">
          {listing.sellerRole === 'student' ? (
            <div className="flex flex-col items-start gap-0.5 min-w-0">
              {/* TOP OF PERSON'S NAME */}
              {listing.sellerMatricVerified ? (
                <div 
                  className="flex items-center gap-1 shrink-0"
                  title={`Verified Student (${listing.sellerMatricNumber || 'Matric Verified'})`}
                >
                  <TikTokVerifiedBadge color={badgeColor} size="sm" />
                  <span className={`text-[10px] font-bold tracking-tight uppercase ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-[#0284c7]'}`}>
                    Verified Student
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-medium text-[#8A8A7A]">Student</span>
              )}
              {/* PERSON'S NAME */}
              <span className="font-semibold text-xs text-[#2D2D2A] truncate max-w-full">
                {listing.sellerName}
              </span>
            </div>
          ) : listing.sellerRole === 'business' ? (
            <div className="flex flex-col items-start gap-0.5 min-w-0">
              {/* TOP OF STORE'S NAME */}
              <div className="flex items-center gap-1 shrink-0">
                <TikTokVerifiedBadge color={badgeColor} size="sm" />
                <span className={`text-[10px] font-bold tracking-tight uppercase ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-[#0284c7]'}`}>
                  Verified Store
                </span>
              </div>
              {/* STORE / PERSON'S NAME */}
              <span className="font-semibold text-xs text-[#2D2D2A] truncate max-w-full">
                {listing.sellerBusinessName || listing.sellerName}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-start min-w-0">
              <span className="text-[10px] text-[#8A8A7A]">Seller</span>
              <span className="font-semibold text-xs text-[#2D2D2A] truncate max-w-full">
                {listing.sellerName}
              </span>
            </div>
          )}
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onOpenDetails(listing)}
          className="cursor-pointer font-serif font-bold text-sm text-[#2D2D2A] line-clamp-2 hover:text-[#5A5A40] transition"
        >
          {listing.title}
        </h3>

        {/* Price & Location */}
        <div className="mt-2 flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-[#5A5A40] tracking-tight">
              ₦{listing.price.toLocaleString()}
            </span>
            {listing.originalPrice && listing.originalPrice > listing.price && (
              <span className="text-xs text-[#A0A090] line-through">
                ₦{listing.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {listing.isSubscription && (
            <span className="text-[11px] text-[#5A5A40] font-medium">
              /{listing.subscriptionDuration?.toLowerCase().replace('-wise', '') || 'sub'}
            </span>
          )}
        </div>

        {/* Campus Location */}
        <div className="mt-1 flex items-center gap-1 text-xs text-[#7A7A6A]">
          <MapPin className="h-3 w-3 text-[#A0A090] shrink-0" />
          <span className="truncate">{listing.campusLocation}</span>
        </div>

        {/* Bottom Actions: WhatsApp Order CTA */}
        <div className="mt-4 pt-3 border-t border-[#E0E0D5] flex items-center gap-2">
          <button
            id={`whatsapp-order-btn-${listing.id}`}
            onClick={() => onOpenWhatsAppOrder(listing)}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] active:bg-[#1da851] py-2.5 px-3 text-xs font-bold text-white shadow-xs transition"
          >
            <MessageCircle className="h-3.5 w-3.5 fill-current" />
            <span>Place Order on WhatsApp</span>
          </button>
          <button
            id={`quick-view-btn-${listing.id}`}
            onClick={() => onOpenDetails(listing)}
            className="rounded-xl border border-[#E0E0D5] p-2 text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] transition"
            title="View Details"
            aria-label="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
