import React, { useState } from 'react';
import { Listing, ProductCategory, User, ItemCondition, SubscriptionDuration } from '../types';
import { PRODUCT_CATEGORIES, UNILORIN_CAMPUS_LOCATIONS } from '../data/mockData';
import { 
  PlusCircle, 
  Sparkles, 
  Trash2, 
  Eye, 
  Image as ImageIcon, 
  CheckCircle2, 
  Clock, 
  Upload, 
  Info,
  Crown,
  Edit3,
  LogIn,
  X
} from 'lucide-react';

interface SellerDashboardProps {
  currentUser: User | null;
  userListings: Listing[];
  onAddListing: (newListing: Partial<Listing>) => Promise<void>;
  onUpdateListing: (listingId: string, updated: Partial<Listing>) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onToggleSold: (listingId: string) => Promise<void>;
  onBoostFeatured: (listingId: string) => Promise<void>;
  onOpenAuth: () => void;
}

const SAMPLE_PRESET_IMAGES = [
  { label: 'Laptop / Tech', url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80' },
  { label: 'Textbook / Study', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80' },
  { label: 'Hostel Fridge', url: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600&auto=format&fit=crop&q=80' },
  { label: 'Gas Cooker', url: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80' },
  { label: 'Hoodie / Fashion', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80' },
  { label: 'Subscriptions / Digital', url: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=600&auto=format&fit=crop&q=80' },
  { label: 'Beauty & Grooming', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80' },
  { label: 'Provisions & Food', url: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?w=600&auto=format&fit=crop&q=80' },
];

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  currentUser,
  userListings,
  onAddListing,
  onUpdateListing,
  onDeleteListing,
  onToggleSold,
  onBoostFeatured,
  onOpenAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'listings'>('upload');

  // Form State
  const [isSubscription, setIsSubscription] = useState(false);
  const [subscriptionDuration, setSubscriptionDuration] = useState<SubscriptionDuration>('Monthly');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Textbooks & Handouts');
  const [condition, setCondition] = useState<ItemCondition>('Like New');
  const [campusLocation, setCampusLocation] = useState(currentUser?.campusLocation || UNILORIN_CAMPUS_LOCATIONS[0]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sellerPhone, setSellerPhone] = useState(currentUser?.phone || '');
  const [isFeaturedBoost, setIsFeaturedBoost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit My Listing State
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCategory, setEditCategory] = useState<ProductCategory>('Textbooks & Handouts');
  const [editLocation, setEditLocation] = useState(UNILORIN_CAMPUS_LOCATIONS[0]);
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Handle Image File Upload (converts to base64 data URL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!currentUser) {
    return (
      <div className="w-full max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-3xl p-8 border border-[#E0E0D5] shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2D2D2A]">
            Post Products on University of Ilorin Mini Campus
          </h2>
          <p className="text-xs text-[#7A7A6A] mt-2 leading-relaxed max-w-md mx-auto">
            Please log in or register your account to post products, manage your listings, and receive direct WhatsApp purchase orders from Mini Campus buyers.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 bg-[#5A5A40] hover:bg-[#474732] text-white text-xs font-bold px-6 py-3 rounded-full transition shadow-xs"
            >
              <LogIn className="h-4 w-4" />
              <span>Log In or Register</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter a product title');
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Please enter a valid price in Naira (₦)');
      return;
    }

    const finalImage = imageUrl.trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

    setLoading(true);
    try {
      const newListing: Partial<Listing> = {
        title: title.trim(),
        price: numPrice,
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        category,
        description: description.trim() || 'Available at University of Ilorin Mini Campus. Message me on WhatsApp for pickup or delivery.',
        imageUrl: finalImage,
        sellerId: currentUser.id,
        sellerName: currentUser.name,
        sellerPhone: sellerPhone.trim() || currentUser.phone,
        sellerRole: currentUser.role,
        sellerMatricVerified: currentUser.isMatricVerified,
        sellerMatricNumber: currentUser.matricNumber,
        sellerBusinessName: currentUser.businessName,
        sellerBusinessVerified: currentUser.isBusinessVerified,
        campusLocation,
        condition: isSubscription ? 'Digital / Account Access' : condition,
        isSubscription,
        subscriptionDuration: isSubscription ? subscriptionDuration : undefined,
        isFeatured: isFeaturedBoost,
        viewsCount: 1,
        inquiriesCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        tags: [category.toLowerCase(), isSubscription ? 'subscription' : 'product', campusLocation.toLowerCase()],
      };

      await onAddListing(newListing);
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setTitle('');
        setPrice('');
        setOriginalPrice('');
        setDescription('');
        setImageUrl('');
        setIsFeaturedBoost(false);
        setActiveTab('listings');
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to post listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (listing: Listing) => {
    setEditingListing(listing);
    setEditTitle(listing.title);
    setEditPrice(listing.price.toString());
    setEditCategory(listing.category);
    setEditLocation(listing.campusLocation);
    setEditDescription(listing.description);
    setEditImageUrl(listing.imageUrl);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingListing) return;
    setEditLoading(true);
    try {
      await onUpdateListing(editingListing.id, {
        title: editTitle.trim(),
        price: parseFloat(editPrice) || editingListing.price,
        category: editCategory,
        campusLocation: editLocation,
        description: editDescription.trim(),
        imageUrl: editImageUrl.trim() || editingListing.imageUrl,
      });
      setEditingListing(null);
    } catch (err: any) {
      alert('Failed to update listing: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Seller Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E0E0D5]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#E8E8DF] flex items-center justify-center font-serif font-bold text-[#5A5A40] text-xl border border-[#E0E0D5]">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2D2A]">{currentUser.name}</h1>
              {currentUser.role === 'student' && currentUser.isMatricVerified && (
                <span className="inline-flex items-center gap-1 text-xs bg-[#5A5A40]/10 text-[#5A5A40] px-2.5 py-0.5 rounded-full font-semibold border border-[#5A5A40]/25">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5A5A40]" />
                  Verified Student
                </span>
              )}
            </div>
            <p className="text-xs text-[#7A7A6A] mt-0.5">
              {currentUser.role === 'student'
                ? `Matric: ${currentUser.matricNumber || 'Pending'} • ${currentUser.campusLocation}`
                : `${currentUser.role.toUpperCase()} • ${currentUser.campusLocation}`}
            </p>
          </div>
        </div>

        {/* Dashboard navigation buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button
            id="seller-tab-upload"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'upload'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'bg-[#F5F5F0] text-[#2D2D2A] hover:bg-[#E8E8DF] border border-[#E0E0D5]'
            }`}
          >
            <PlusCircle className="h-4 w-4" />
            <span>Post New Listing</span>
          </button>

          <button
            id="seller-tab-listings"
            onClick={() => setActiveTab('listings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap transition ${
              activeTab === 'listings'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'bg-[#F5F5F0] text-[#2D2D2A] hover:bg-[#E8E8DF] border border-[#E0E0D5]'
            }`}
          >
            <span>My Listings ({userListings.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mt-6">
        {/* Upload Form Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white rounded-3xl border border-[#E0E0D5] p-5 sm:p-7 shadow-xs">
            <div className="mb-6">
              <h2 className="text-lg font-serif font-bold text-[#2D2D2A]">
                Post a Listing at University of Ilorin Mini Campus
              </h2>
              <p className="text-xs text-[#7A7A6A]">
                Buyers will view your product and place direct WhatsApp orders to your phone number.
              </p>
            </div>

            {formSuccess && (
              <div className="mb-5 p-4 rounded-2xl bg-[#E8E8DF] border border-[#E0E0D5] text-[#5A5A40] text-sm flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#5A5A40] shrink-0" />
                <span>Your listing has been posted successfully to the University of Ilorin Mini Campus Marketplace!</span>
              </div>
            )}

            {formError && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* Product Title */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering Mathematics Textbook Vol 2, Rechargeable Table Fan..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Price in Naira (₦) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 4500"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Campus Location & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                    Pickup Location (University of Ilorin Mini Campus) *
                  </label>
                  <select
                    value={campusLocation}
                    onChange={(e) => setCampusLocation(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3.5 py-2.5 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  >
                    {UNILORIN_CAMPUS_LOCATIONS.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">WhatsApp Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08142345678"
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                  <p className="text-[10px] text-[#7A7A6A] mt-0.5">
                    Orders will be routed directly to this WhatsApp number.
                  </p>
                </div>
              </div>

              {/* Product Description */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the item condition, accessories, reason for selling..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] p-3 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              {/* Image Upload & Presets */}
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                  Product Image (Upload file or choose a preset photo)
                </label>
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-xs text-[#7A7A6A] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#5A5A40]/10 file:text-[#5A5A40] hover:file:bg-[#5A5A40]/20 cursor-pointer"
                    />
                    
                    <div className="pt-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-[#7A7A6A] block mb-1">
                        Or pick a sample photo preset:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_PRESET_IMAGES.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setImageUrl(preset.url)}
                            className="px-2.5 py-1 rounded-full text-[10px] bg-[#F5F5F0] hover:bg-[#E8E8DF] text-[#2D2D2A] border border-[#E0E0D5] transition"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Image Preview Box */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5] overflow-hidden flex items-center justify-center shrink-0">
                    {imageUrl ? (
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-[#7A7A6A]">
                        <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50 text-[#5A5A40]" />
                        <span className="text-[10px]">No image yet</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="submit-new-listing-btn"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] py-3.5 text-sm font-bold text-white shadow-md transition disabled:opacity-60"
              >
                <PlusCircle className="h-5 w-5" />
                <span>{loading ? 'Posting...' : 'Publish Listing on Mini Campus Marketplace'}</span>
              </button>
            </form>
          </div>
        )}

        {/* My Listings Tab */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif font-bold text-[#2D2D2A]">Your Active Listings</h2>
                <p className="text-xs text-[#7A7A6A]">
                  Manage availability, edit details, or mark items as sold.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#5A5A40] bg-[#E8E8DF] hover:bg-[#dedecf] px-3.5 py-2 rounded-full border border-[#E0E0D5] transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Another Item</span>
              </button>
            </div>

            {userListings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-[#E0E0D5] p-8">
                <div className="w-14 h-14 rounded-full bg-[#F5F5F0] flex items-center justify-center text-[#7A7A6A] mx-auto mb-3">
                  📦
                </div>
                <h3 className="text-sm font-serif font-bold text-[#2D2D2A]">No listings posted yet</h3>
                <p className="text-xs text-[#7A7A6A] mt-1 max-w-sm mx-auto">
                  Ready to sell? Post your books, electronics, or hostel gear in less than 1 minute.
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#5A5A40] text-white text-xs font-semibold shadow-xs"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Create First Listing</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userListings.map((item) => (
                  <div
                    key={item.id}
                    id={`seller-item-${item.id}`}
                    className="flex flex-col rounded-3xl bg-white border border-[#E0E0D5] p-4 shadow-xs hover:border-[#5A5A40]/40 transition"
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-20 h-20 rounded-2xl object-cover border border-[#E0E0D5] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {item.isFeatured && (
                            <span className="text-[10px] bg-[#5A5A40]/10 text-[#5A5A40] font-bold px-2 py-0.5 rounded-full border border-[#5A5A40]/25">
                              Featured
                            </span>
                          )}
                          {item.isSold ? (
                            <span className="text-[10px] bg-[#E0E0D5] text-[#7A7A6A] font-bold px-2 py-0.5 rounded-full">
                              Sold Out
                            </span>
                          ) : (
                            <span className="text-[10px] bg-[#E8E8DF] text-[#5A5A40] font-bold px-2 py-0.5 rounded-full border border-[#E0E0D5]">
                              Active
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-[#2D2D2A] line-clamp-1">{item.title}</h4>
                        <div className="text-sm font-serif font-bold text-[#5A5A40] mt-0.5">
                          ₦{item.price.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[#7A7A6A] mt-0.5 flex items-center gap-2">
                          <span>👀 {item.viewsCount} views</span>
                          <span>💬 {item.inquiriesCount} WhatsApp clicks</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 pt-3 border-t border-[#E0E0D5] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onToggleSold(item.id)}
                          className={`text-xs px-3 py-1.5 rounded-full font-semibold transition ${
                            item.isSold
                              ? 'bg-[#F5F5F0] text-[#7A7A6A] hover:bg-[#E8E8DF]'
                              : 'bg-[#E8E8DF] text-[#5A5A40] hover:bg-[#dedecf] border border-[#E0E0D5]'
                          }`}
                        >
                          {item.isSold ? 'Mark Available' : 'Mark Sold'}
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-full border border-[#E0E0D5] text-[#2D2D2A] hover:bg-[#E8E8DF] transition"
                          title="Edit this product"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.title}"?`)) {
                            onDeleteListing(item.id);
                          }
                        }}
                        className="p-1.5 rounded-full text-[#7A7A6A] hover:text-rose-700 hover:bg-rose-50 transition"
                        title="Delete listing"
                        aria-label="Delete listing"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit My Product Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E0E0D5]">
            <button
              onClick={() => setEditingListing(null)}
              className="absolute right-4 top-4 p-2 rounded-full text-[#7A7A6A] hover:bg-[#F5F5F0]"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-serif font-bold text-[#2D2D2A] mb-4">Edit Product Listing</h3>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as ProductCategory)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A]"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Mini Campus Location</label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A]"
                >
                  {UNILORIN_CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] p-3 text-xs text-[#2D2D2A]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-4 py-2 rounded-full border border-[#E0E0D5] text-xs font-semibold text-[#7A7A6A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2 rounded-full bg-[#5A5A40] hover:bg-[#474732] text-white text-xs font-bold transition shadow-xs disabled:opacity-60"
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
