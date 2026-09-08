import React, { useState } from 'react';
import { Listing, User } from '../types';
import { TikTokVerifiedBadge } from './TikTokVerifiedBadge';
import { 
  X, 
  MapPin, 
  MessageCircle, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { cleanPhoneNumber } from '../utils/whatsapp';

export interface SellerProfileData {
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerRole: 'student' | 'buyer' | 'business' | 'admin' | 'super_admin';
  sellerMatricVerified?: boolean;
  sellerMatricNumber?: string;
  sellerBusinessName?: string;
  sellerBusinessVerified?: boolean;
  campusLocation: string;
  department?: string;
  faculty?: string;
}

interface SellerProfileModalProps {
  seller: SellerProfileData | null;
  isOpen: boolean;
  onClose: () => void;
  allListings: Listing[];
  onOpenProductDetails: (listing: Listing) => void;
  onReportSeller: (seller: SellerProfileData) => void;
  badgeColor?: 'blue' | 'red';
}

export const SellerProfileModal: React.FC<SellerProfileModalProps> = ({
  seller,
  isOpen,
  onClose,
  allListings,
  onOpenProductDetails,
  onReportSeller,
  badgeColor = 'blue',
}) => {
  const [activeTab, setActiveTab] = useState<'active' | 'sold' | 'about'>('active');

  if (!isOpen || !seller) return null;

  // Filter listings by this seller (match by sellerId or sellerPhone or sellerName)
  const sellerListings = allListings.filter(
    (item) =>
      (seller.sellerId && item.sellerId === seller.sellerId) ||
      (seller.sellerPhone && item.sellerPhone === seller.sellerPhone) ||
      item.sellerName.toLowerCase() === seller.sellerName.toLowerCase()
  );

  const activeListings = sellerListings.filter((i) => !i.isSold);
  const soldListings = sellerListings.filter((i) => i.isSold);
  const totalViews = sellerListings.reduce((sum, item) => sum + (item.viewsCount || 0), 0);

  const handleWhatsApp = () => {
    const phone = cleanPhoneNumber(seller.sellerPhone);
    const msg = encodeURIComponent(
      `Hello ${seller.sellerName}, I am browsing your seller profile on C'IO Marketplace (University of Ilorin Mini Campus). Are your active items available?`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleCall = () => {
    const phone = cleanPhoneNumber(seller.sellerPhone);
    window.location.href = `tel:${phone}`;
  };

  const isVerifiedStudent = seller.sellerRole === 'student' && seller.sellerMatricVerified;
  const isVerifiedStore = seller.sellerRole === 'business';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div
        id="seller-profile-modal-card"
        className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E0E0D5] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Modal Header with Profile Banner */}
        <div className="bg-[#141413] text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#5A5A40] text-white font-serif font-bold text-2xl sm:text-3xl flex items-center justify-center border-2 border-white/20 shadow-md shrink-0">
              {seller.sellerName.charAt(0).toUpperCase()}
            </div>

            {/* Identity & Badges */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {isVerifiedStudent && (
                  <div className="flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                    <TikTokVerifiedBadge color={badgeColor} size="sm" />
                    <span className={`text-[10px] font-bold tracking-tight uppercase ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-sky-300'}`}>
                      Verified Student
                    </span>
                  </div>
                )}
                {isVerifiedStore && (
                  <div className="flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/20">
                    <TikTokVerifiedBadge color={badgeColor} size="sm" />
                    <span className={`text-[10px] font-bold tracking-tight uppercase ${badgeColor === 'red' ? 'text-[#FE2C55]' : 'text-sky-300'}`}>
                      Verified Campus Store
                    </span>
                  </div>
                )}
                <span className="text-[10px] font-medium text-white/70 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                  University of Ilorin Mini Campus
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                {seller.sellerName}
              </h2>

              {seller.sellerBusinessName && (
                <p className="text-xs text-white/80 font-medium mt-0.5">
                  🏪 {seller.sellerBusinessName}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-white/70 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-white/50" />
                  {seller.campusLocation || 'Mini Campus'}
                </span>
                {seller.sellerMatricNumber && (
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-[11px] text-white/90">
                    Matric: {seller.sellerMatricNumber}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <span className="block text-base sm:text-lg font-bold text-white">
                {activeListings.length}
              </span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-medium">
                Active Listings
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <span className="block text-base sm:text-lg font-bold text-emerald-400">
                {soldListings.length}
              </span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-medium">
                Items Sold
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-2 border border-white/5">
              <span className="block text-base sm:text-lg font-bold text-white">
                {totalViews}
              </span>
              <span className="text-[10px] text-white/70 uppercase tracking-wider font-medium">
                Total Views
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition"
            >
              <MessageCircle className="h-4 w-4 fill-current" />
              <span>Chat Seller on WhatsApp</span>
            </button>
            <button
              onClick={handleCall}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition flex items-center gap-1.5"
              title="Call Phone Number"
            >
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{seller.sellerPhone}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#E0E0D5] bg-[#F5F5F0] px-4 shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 px-4 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'active'
                ? 'border-[#5A5A40] text-[#5A5A40]'
                : 'border-transparent text-[#7A7A6A] hover:text-[#2D2D2A]'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Active Listings ({activeListings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`py-3 px-4 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sold'
                ? 'border-[#5A5A40] text-[#5A5A40]'
                : 'border-transparent text-[#7A7A6A] hover:text-[#2D2D2A]'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Sold Archive ({soldListings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-4 font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'about'
                ? 'border-[#5A5A40] text-[#5A5A40]'
                : 'border-transparent text-[#7A7A6A] hover:text-[#2D2D2A]'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Trust & Safety</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-5 flex-1 space-y-4">
          {/* TAB: ACTIVE LISTINGS */}
          {activeTab === 'active' && (
            <div>
              {activeListings.length === 0 ? (
                <div className="text-center py-10 bg-[#F5F5F0] rounded-2xl border border-[#E0E0D5] p-6">
                  <Package className="h-8 w-8 text-[#A0A090] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#2D2D2A]">No active listings at this moment</p>
                  <p className="text-[11px] text-[#7A7A6A] mt-0.5">
                    This seller currently has no available products on the marketplace.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {activeListings.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onClose();
                        onOpenProductDetails(item);
                      }}
                      className="group cursor-pointer rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5] hover:border-[#5A5A40] p-2.5 transition flex flex-col"
                    >
                      <div className="aspect-4/3 rounded-xl overflow-hidden bg-white mb-2 relative">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        {item.isFeatured && (
                          <span className="absolute top-1.5 left-1.5 bg-[#5A5A40] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            Featured
                          </span>
                        )}
                        <span className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[9px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Eye className="h-2.5 w-2.5" />
                          {item.viewsCount || 0}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#2D2D2A] line-clamp-1 group-hover:text-[#5A5A40]">
                        {item.title}
                      </h4>
                      <div className="text-xs font-serif font-bold text-[#5A5A40] mt-1">
                        ₦{item.price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#7A7A6A] mt-0.5 truncate">
                        {item.campusLocation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SOLD ITEMS */}
          {activeTab === 'sold' && (
            <div>
              {soldListings.length === 0 ? (
                <div className="text-center py-10 bg-[#F5F5F0] rounded-2xl border border-[#E0E0D5] p-6">
                  <CheckCircle2 className="h-8 w-8 text-[#A0A090] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#2D2D2A]">No past sold items recorded</p>
                  <p className="text-[11px] text-[#7A7A6A] mt-0.5">
                    Completed sales by this seller will appear here once marked as sold.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {soldListings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5] p-2.5 opacity-80"
                    >
                      <div className="aspect-4/3 rounded-xl overflow-hidden bg-white mb-2 relative">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover grayscale"
                        />
                        <span className="absolute top-1.5 left-1.5 bg-rose-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Sold Out
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#2D2D2A] line-clamp-1">{item.title}</h4>
                      <div className="text-xs font-serif font-bold text-[#7A7A6A] mt-1">
                        ₦{item.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: ABOUT & SAFETY */}
          {activeTab === 'about' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5]">
                <h4 className="font-bold text-[#2D2D2A] mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#5A5A40]" />
                  Campus Verification Profile
                </h4>
                <p className="text-[#7A7A6A] leading-relaxed">
                  {isVerifiedStudent ? (
                    <>
                      This seller has completed University of Ilorin student verification with their official matric number (<strong>{seller.sellerMatricNumber}</strong>). They are an active student member of our campus community.
                    </>
                  ) : isVerifiedStore ? (
                    <>
                      This seller is a verified commercial vendor operating within or adjacent to University of Ilorin Mini Campus.
                    </>
                  ) : (
                    <>
                      This seller is a registered member of C&apos;IO Marketplace. We always advise inspecting goods in public daylight locations before exchanging funds.
                    </>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
                <h4 className="font-bold mb-1">Campus Safety Guidelines:</h4>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Arrange pickups at Mini Campus Gate, Student Union Building, or Mini Campus Library.</li>
                  <li>Verify the condition of electronics, textbooks, or appliances before completing transactions.</li>
                  <li>Do not send advance payment deposits via bank transfer or recharge cards.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Report Seller Button */}
          <div className="pt-2 text-center border-t border-[#E0E0D5]">
            <button
              onClick={() => {
                onClose();
                onReportSeller(seller);
              }}
              className="inline-flex items-center gap-1.5 text-xs text-[#7A7A6A] hover:text-rose-700 transition"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Report this seller to Campus Admin Desk</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
