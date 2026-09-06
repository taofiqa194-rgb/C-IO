import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, 
  Listing, 
  ComplaintTicket, 
  PlatformSettings, 
  ProductCategory 
} from './types';
import { 
  PRODUCT_CATEGORIES,
  OFFICIAL_SUPPORT_PHONE,
  OFFICIAL_SUPPORT_WHATSAPP
} from './data/mockData';
import { api } from './utils/api';
import { subscribeToProducts, restoreAdminAccount } from './firebase/services';
import { testFirebaseConnection } from './firebase/config';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { WhatsAppOrderModal } from './components/WhatsAppOrderModal';
import { SellerDashboard } from './components/SellerDashboard';
import { SupportSection } from './components/SupportSection';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AuthModal } from './components/AuthModal';
import { FilterDrawer, FilterState } from './components/FilterDrawer';
import { ImageRequirementsModal } from './components/ImageRequirementsModal';
import { WelcomeAnnouncementModal } from './components/WelcomeAnnouncementModal';
import { 
  Sparkles, 
  ShoppingBag, 
  Ticket, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  MessageCircle, 
  ChevronRight,
  Heart,
  Plus,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Main Data States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [complaints, setComplaints] = useState<ComplaintTicket[]>([]);
  const [settings, setSettings] = useState<PlatformSettings>({
    listingFeeNaira: 0,
    featuredBoostFeeNaira: 500,
    vendorSubscriptionSemesterFee: 2500,
    platformSupportPhone: OFFICIAL_SUPPORT_PHONE,
    platformSupportWhatsApp: OFFICIAL_SUPPORT_WHATSAPP,
    allowGuestBrowsing: true,
    requireMatricVerificationForSelling: false,
    maintenanceMode: false,
  });

  // User saved favorites (persisted in localStorage)
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cio_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Views & Modals
  const [activeView, setActiveView] = useState<'feed' | 'subscriptions' | 'sell' | 'favorites' | 'support' | 'admin'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [whatsappOrderListing, setWhatsappOrderListing] = useState<Listing | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'login' | 'register' | 'profile'>('login');
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isImageReqModalOpen, setIsImageReqModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [prefillComplaint, setPrefillComplaint] = useState<{ category: string; targetListingTitle?: string; sellerName?: string } | null>(null);

  // Filter Bar state
  const [activeCategoryPill, setActiveCategoryPill] = useState<string>('All');
  const [filters, setFilters] = useState<FilterState>({
    category: 'All',
    campusLocation: 'All',
    condition: 'All',
    onlySubscriptions: false,
    onlyVerifiedStudents: false,
    onlyBusinesses: false,
    maxPrice: 200000,
    sortBy: 'newest',
  });

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cio_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  // Load and sync user favorites from Firestore when user is authenticated
  useEffect(() => {
    if (currentUser?.id) {
      api.getUserFavorites(currentUser.id).then((cloudFavs) => {
        if (cloudFavs && cloudFavs.length > 0) {
          setFavorites((prev) => Array.from(new Set([...prev, ...cloudFavs])));
        }
      }).catch((e) => console.warn('Could not sync user favorites from Firestore:', e));
    }
  }, [currentUser?.id]);

  // Realtime products subscription from Cloud Firestore
  useEffect(() => {
    testFirebaseConnection();
    restoreAdminAccount().catch((err) => console.warn('Could not auto-restore admin account:', err));
    const unsubscribe = subscribeToProducts((realtimeProducts) => {
      setListings(realtimeProducts);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Platform Settings subscription (site name, announcements, branding)
  useEffect(() => {
    const unsubscribeSettings = api.subscribeSettings((realtimeSettings) => {
      setSettings(realtimeSettings);
    });
    return () => unsubscribeSettings();
  }, []);

  // Sync document title dynamically with website name & tagline
  useEffect(() => {
    if (settings.siteName) {
      document.title = `${settings.siteName} | ${settings.siteTagline || "University of Ilorin Mini Campus Marketplace"}`;
    }
  }, [settings.siteName, settings.siteTagline]);

  // Whenever the user navigates to the home page ('feed'), popup welcoming message
  useEffect(() => {
    if (activeView === 'feed') {
      if (settings.welcomePopupEnabled !== false) {
        setIsWelcomeModalOpen(true);
      }
    } else {
      setIsWelcomeModalOpen(false);
    }
  }, [activeView, settings.welcomePopupEnabled]);

  // Load backend data
  const loadData = useCallback(async () => {
    try {
      const [prods, fetchedSettings] = await Promise.all([
        api.getProducts(),
        api.getSettings(),
      ]);
      setListings(prods);
      setSettings(fetchedSettings);

      // Check current user session
      const userRes = await api.checkUserAuth();
      if (userRes.authenticated && userRes.user) {
        setCurrentUser(userRes.user);
      } else {
        setCurrentUser(null);
      }

      // Check admin session
      const adminRes = await api.checkAdminAuth();
      setIsAdminAuthenticated(adminRes.authenticated);

      if (adminRes.authenticated) {
        const [fetchedUsers, fetchedReports] = await Promise.all([
          api.getUsers(),
          api.getReports(),
        ]);
        setUsers(fetchedUsers);
        setComplaints(fetchedReports);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle URL hash routing on initial load (e.g. #item-prod-123)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#item-')) {
      const id = hash.replace('#item-', '');
      const item = listings.find((l) => l.id === id);
      if (item) {
        setSelectedListing(item);
      }
    }
  }, [listings]);

  // Toggle favorite with Firestore persistence
  const handleToggleFavorite = async (listingId: string) => {
    const isFav = favorites.includes(listingId);
    setFavorites((prev) =>
      isFav ? prev.filter((id) => id !== listingId) : [...prev, listingId]
    );
    if (currentUser?.id) {
      await api.toggleFavorite(currentUser.id, listingId, !isFav).catch((err) => {
        console.warn('Failed to toggle favorite in Firestore:', err);
      });
    }
  };

  // Add listing
  const handleAddListing = async (newListingData: Partial<Listing>) => {
    await api.createProduct(newListingData);
    const updated = await api.getProducts();
    setListings(updated);
  };

  // Update listing
  const handleUpdateListing = async (listingId: string, updatedData: Partial<Listing>) => {
    await api.updateProduct(listingId, updatedData);
    const updated = await api.getProducts();
    setListings(updated);
  };

  // Delete listing
  const handleDeleteListing = async (listingId: string) => {
    await api.deleteProduct(listingId);
    setListings((prev) => prev.filter((item) => item.id !== listingId));
    if (selectedListing?.id === listingId) setSelectedListing(null);
  };

  // Toggle Sold
  const handleToggleSold = async (listingId: string) => {
    await api.toggleSold(listingId);
    setListings((prev) =>
      prev.map((item) => (item.id === listingId ? { ...item, isSold: !item.isSold } : item))
    );
  };

  // Boost to Featured
  const handleBoostFeatured = async (listingId: string) => {
    await api.toggleFeatured(listingId, true);
    setListings((prev) =>
      prev.map((item) => (item.id === listingId ? { ...item, isFeatured: true } : item))
    );
  };

  // Submit Complaint / Report
  const handleSubmitComplaint = async (complaintData: Partial<ComplaintTicket>) => {
    await api.submitReport(complaintData);
    // If admin is also logged in, refresh complaints
    if (isAdminAuthenticated) {
      const refreshed = await api.getReports();
      setComplaints(refreshed);
    }
  };

  // Open Sell with Image Requirements Modal check
  const handleOpenSell = () => {
    try {
      const hideModal = localStorage.getItem('cio_hide_image_requirements') === 'true';
      if (hideModal) {
        setActiveView('sell');
      } else {
        setIsImageReqModalOpen(true);
      }
    } catch {
      setActiveView('sell');
    }
  };

  // Filter and Search Pipeline
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // 1. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesLocation = item.campusLocation.toLowerCase().includes(query);
        const matchesSeller = item.sellerName.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLocation && !matchesSeller && !matchesCategory) {
          return false;
        }
      }

      // 2. Category Pill Filter
      if (activeCategoryPill !== 'All') {
        if (activeCategoryPill === 'Subscriptions & Digital') {
          if (!item.isSubscription && item.category !== 'Subscriptions & Digital') return false;
        } else if (item.category !== activeCategoryPill) {
          return false;
        }
      }

      // 3. Advanced Drawer Filters
      if (filters.category !== 'All' && item.category !== filters.category) return false;
      if (filters.campusLocation !== 'All' && item.campusLocation !== filters.campusLocation) return false;
      if (filters.condition !== 'All' && item.condition !== filters.condition) return false;
      if (filters.onlySubscriptions && !item.isSubscription) return false;
      if (filters.onlyVerifiedStudents && (!item.sellerMatricVerified || item.sellerRole !== 'student')) return false;
      if (filters.onlyBusinesses && item.sellerRole !== 'business') return false;
      if (filters.maxPrice < 200000 && item.price > filters.maxPrice) return false;

      // 4. Active view specific overrides
      if (activeView === 'subscriptions' && !item.isSubscription) return false;
      if (activeView === 'favorites' && !favorites.includes(item.id)) return false;

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'price_asc') return a.price - b.price;
      if (filters.sortBy === 'price_desc') return b.price - a.price;
      if (filters.sortBy === 'popular') return b.viewsCount - a.viewsCount;
      // Default: featured first, then newest
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [listings, searchQuery, activeCategoryPill, filters, activeView, favorites]);

  // Featured listings slice
  const featuredListings = useMemo(() => {
    return listings.filter((item) => item.isFeatured && !item.isSold);
  }, [listings]);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#2D2D2A] flex flex-col font-sans pb-24 md:pb-10 selection:bg-[#E8E8DF] selection:text-[#2D2D2A]">
      {/* Sticky Navbar */}
      <Navbar
        currentUser={currentUser}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setActiveView('favorites')}
        onOpenSell={handleOpenSell}
        onOpenSupport={() => {
          setPrefillComplaint(null);
          setActiveView('support');
        }}
        onOpenAdmin={() => {
          if (!isAdminAuthenticated) {
            setIsAdminLoginModalOpen(true);
          } else {
            setActiveView('admin');
          }
        }}
        onOpenAuth={() => {
          setAuthModalInitialTab(currentUser ? 'profile' : 'login');
          setIsAuthModalOpen(true);
        }}
        onToggleFilterDrawer={() => setIsFilterDrawerOpen(true)}
        activeView={activeView}
        isAdminAuthenticated={isAdminAuthenticated}
        siteName={settings.siteName}
        siteTagline={settings.siteTagline}
        siteShortName={settings.siteShortName}
        announcementAlert={settings.announcementAlert}
        onOpenAnnouncement={() => setIsWelcomeModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1">
        {/* VIEW: MAIN FEED or SUBSCRIPTIONS or FAVORITES */}
        {(activeView === 'feed' || activeView === 'subscriptions' || activeView === 'favorites') && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
            {/* Active View Title Header (if subscriptions or favorites) */}
            {activeView === 'subscriptions' && (
              <div className="bg-[#5A5A40] rounded-3xl text-[#F5F5F0] p-5 sm:p-7 shadow-xs border border-[#474732]/30">
                <div className="flex items-center gap-2 text-[#D9D9C8] text-xs font-bold uppercase tracking-wider mb-1">
                  <Ticket className="h-4 w-4 text-[#D9D9C8]" />
                  <span>Student Subscriptions & Digital Services</span>
                </div>
                <h1 className="text-xl sm:text-3xl font-serif font-bold tracking-tight">
                  University of Ilorin Mini Campus Student Subscriptions
                </h1>
                <p className="text-xs sm:text-sm text-[#D9D9C8] mt-1 max-w-xl leading-relaxed">
                  Browse or post student subscriptions, software accounts, tutorials, and digital passes verified for University of Ilorin Mini Campus students.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleOpenSell}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#5A5A40] text-xs font-bold shadow-xs hover:bg-[#F5F5F0] transition"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Post a Subscription</span>
                  </button>
                  <button
                    onClick={() => setActiveView('feed')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-white/15 text-[#F5F5F0] text-xs font-semibold hover:bg-white/20 transition"
                  >
                    <span>Back to All Physical Products</span>
                  </button>
                </div>
              </div>
            )}

            {activeView === 'favorites' && (
              <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E0E0D5] p-4 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#E8E8DF] text-[#5A5A40] flex items-center justify-center">
                    <Heart className="h-5 w-5 fill-[#5A5A40]" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-serif font-bold text-[#2D2D2A]">
                      Your Saved Favorites ({filteredListings.length})
                    </h1>
                    <p className="text-xs text-[#7A7A6A]">
                      Items bookmarked for quick review or WhatsApp ordering.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveView('feed')}
                  className="text-xs font-bold text-[#5A5A40] hover:underline"
                >
                  Explore All Listings →
                </button>
              </div>
            )}

            {/* Horizontal Scrollable Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar text-xs">
              <button
                id="cat-pill-all"
                onClick={() => {
                  setActiveCategoryPill('All');
                  if (activeView === 'subscriptions') setActiveView('feed');
                }}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium shrink-0 transition ${
                  activeCategoryPill === 'All' && activeView !== 'subscriptions'
                    ? 'bg-[#5A5A40] text-white shadow-xs font-bold'
                    : 'bg-white border border-[#E0E0D5] text-[#2D2D2A] hover:bg-[#E8E8DF]'
                }`}
              >
                All Products
              </button>

              {/* Special Subscriptions pill */}
              <button
                id="cat-pill-subs"
                onClick={() => {
                  setActiveCategoryPill('Subscriptions & Digital');
                  setActiveView('subscriptions');
                }}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium shrink-0 transition flex items-center gap-1.5 ${
                  activeView === 'subscriptions' || activeCategoryPill === 'Subscriptions & Digital'
                    ? 'bg-[#5A5A40] text-white shadow-xs font-bold'
                    : 'bg-[#E8E8DF] border border-[#E0E0D5] text-[#5A5A40] hover:bg-[#D9D9C8]'
                }`}
              >
                <span>🎟️ Student Subscriptions</span>
              </button>

              {PRODUCT_CATEGORIES.filter((c) => c !== 'Subscriptions & Digital').map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategoryPill(cat);
                    if (activeView === 'subscriptions') setActiveView('feed');
                  }}
                  className={`px-3.5 py-1.5 rounded-full whitespace-nowrap font-medium shrink-0 transition ${
                    activeCategoryPill === cat && activeView !== 'subscriptions'
                      ? 'bg-[#5A5A40] text-white shadow-xs font-bold'
                      : 'bg-white border border-[#E0E0D5] text-[#2D2D2A] hover:bg-[#E8E8DF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Featured Boosted Listings Section (if in main feed) */}
            {activeView === 'feed' && activeCategoryPill === 'All' && !searchQuery && featuredListings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#5A5A40]" />
                    <h2 className="text-sm font-bold text-[#2D2D2A] uppercase tracking-wider font-serif">
                      Featured Mini Campus Deals
                    </h2>
                    <span className="text-[10px] bg-[#5A5A40]/10 text-[#5A5A40] border border-[#5A5A40]/20 font-bold px-2 py-0.5 rounded-full">
                      High Interest
                    </span>
                  </div>
                  <span className="text-xs text-[#7A7A6A]">Pinned to top</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {featuredListings.slice(0, 4).map((listing) => (
                    <ProductCard
                      key={`feat-${listing.id}`}
                      listing={listing}
                      isFavorite={favorites.includes(listing.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onOpenDetails={(item) => setSelectedListing(item)}
                      onOpenWhatsAppOrder={(item) => setWhatsappOrderListing(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main Listings Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#2D2D2A]">
                    {activeView === 'subscriptions'
                      ? 'Available Student Subscriptions'
                      : activeCategoryPill === 'All'
                      ? 'University of Ilorin Mini Campus Listings'
                      : activeCategoryPill}
                  </h2>
                  <span className="text-xs text-[#7A7A6A] font-medium">
                    ({filteredListings.length} {filteredListings.length === 1 ? 'item' : 'items'})
                  </span>
                </div>

                {/* Filter indicator */}
                <button
                  onClick={() => setIsFilterDrawerOpen(true)}
                  className="text-xs font-semibold text-[#5A5A40] hover:underline flex items-center gap-1"
                >
                  <span>Filter / Sort</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {filteredListings.length === 0 ? (
                <div className="bg-white rounded-3xl border border-[#E0E0D5] p-8 sm:p-12 text-center max-w-md mx-auto my-8 shadow-xs">
                  <div className="w-16 h-16 rounded-full bg-[#E8E8DF] text-[#5A5A40] flex items-center justify-center mx-auto mb-3 text-2xl">
                    📦
                  </div>
                  <h3 className="text-base font-serif font-bold text-[#2D2D2A]">No products listed yet</h3>
                  <p className="text-xs text-[#7A7A6A] mt-1 leading-relaxed">
                    The marketplace starts clean for real Mini Campus sellers. Post your textbooks, electronics, or campus essentials to start selling!
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <button
                      onClick={handleOpenSell}
                      className="px-5 py-2.5 rounded-full bg-[#5A5A40] hover:bg-[#474732] text-xs font-bold text-white shadow-xs"
                    >
                      Post First Product
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {filteredListings.map((listing) => (
                    <ProductCard
                      key={listing.id}
                      listing={listing}
                      isFavorite={favorites.includes(listing.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onOpenDetails={(item) => setSelectedListing(item)}
                      onOpenWhatsAppOrder={(item) => setWhatsappOrderListing(item)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Safety & Support Footer CTA */}
            <div className="mt-10 rounded-3xl bg-white border border-[#E0E0D5] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase text-[#5A5A40] tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  {settings.siteName || "C'IO"} — {settings.siteTagline || "University of Ilorin Mini Campus Help Desk"}
                </span>
                <h4 className="text-base font-serif font-bold text-[#2D2D2A] mt-1">
                  Have an issue or need student verification?
                </h4>
                <p className="text-xs text-[#7A7A6A] mt-0.5">
                  Official Support Helpline: <strong className="text-[#2D2D2A] font-mono">{OFFICIAL_SUPPORT_PHONE}</strong>. Our safety team assists with registration, login, uploads, and scam investigations.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPrefillComplaint(null);
                    setActiveView('support');
                  }}
                  className="px-4 py-2.5 rounded-full bg-[#F5F5F0] hover:bg-[#E8E8DF] text-[#2D2D2A] text-xs font-bold transition border border-[#E0E0D5]"
                >
                  Visit Help Desk
                </button>
                <button
                  onClick={() => {
                    const msg = `Hello ${settings.siteName || "C'IO"} Support (${settings.siteTagline || "University of Ilorin Mini Campus Marketplace"}), I need assistance.`;
                    window.open(`https://wa.me/${OFFICIAL_SUPPORT_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                >
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>WhatsApp Support</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: SELLER DASHBOARD */}
        {activeView === 'sell' && (
          <SellerDashboard
            currentUser={currentUser}
            userListings={currentUser ? listings.filter((l) => l.sellerId === currentUser.id) : []}
            onAddListing={handleAddListing}
            onUpdateListing={handleUpdateListing}
            onDeleteListing={handleDeleteListing}
            onToggleSold={handleToggleSold}
            onBoostFeatured={handleBoostFeatured}
            onOpenAuth={() => {
              setAuthModalInitialTab('register');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {/* VIEW: CUSTOMER SUPPORT & HELP DESK */}
        {activeView === 'support' && (
          <SupportSection
            currentUser={currentUser}
            complaints={complaints}
            onSubmitComplaint={handleSubmitComplaint}
            prefillComplaint={prefillComplaint}
          />
        )}

        {/* VIEW: ADMIN DASHBOARD */}
        {activeView === 'admin' && (
          isAdminAuthenticated ? (
            <AdminDashboard
              users={users}
              listings={listings}
              complaints={complaints}
              settings={settings}
              onRefreshData={loadData}
              onLogoutAdmin={async () => {
                await api.adminLogout();
                setIsAdminAuthenticated(false);
                setActiveView('feed');
              }}
              onViewProduct={(product) => setSelectedListing(product)}
            />
          ) : (
            <div className="w-full max-w-md mx-auto px-4 py-16 text-center">
              <div className="bg-white rounded-3xl p-8 border border-[#E0E0D5] shadow-lg">
                <div className="w-14 h-14 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-serif font-bold text-[#2D2D2A]">
                  Admin Desk Authorization Required
                </h2>
                <p className="text-xs text-[#7A7A6A] mt-2 leading-relaxed">
                  Access to the administrator console requires authentication with authorized administrator credentials.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => setIsAdminLoginModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-[#5A5A40] hover:bg-[#474732] text-white text-xs font-bold py-3 rounded-full transition shadow-xs"
                  >
                    <span>Log In to Admin Console</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setActiveView('feed')}
                    className="text-xs text-[#7A7A6A] hover:underline mt-2"
                  >
                    Return to Marketplace
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        listing={selectedListing}
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        isFavorite={selectedListing ? favorites.includes(selectedListing.id) : false}
        onToggleFavorite={handleToggleFavorite}
        currentUser={currentUser || undefined}
        onReportListing={(item) => {
          setPrefillComplaint({
            category: 'Scam / Fraud Report',
            targetListingTitle: item.title,
            sellerName: item.sellerName,
          });
          setActiveView('support');
        }}
      />

      {/* Direct WhatsApp Order Preview & Launcher Modal */}
      <WhatsAppOrderModal
        listing={whatsappOrderListing}
        isOpen={!!whatsappOrderListing}
        onClose={() => setWhatsappOrderListing(null)}
        currentUser={currentUser || undefined}
      />

      {/* User Auth Modal (Login / Register / Profile) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChange={(updatedUser) => {
          setCurrentUser(updatedUser);
          loadData();
        }}
        initialTab={authModalInitialTab}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onAdminAuthenticated={() => {
          setIsAdminAuthenticated(true);
          setActiveView('admin');
          loadData();
        }}
      />

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onUpdateFilters={(up) => setFilters((prev) => ({ ...prev, ...up }))}
        onResetFilters={() =>
          setFilters({
            category: 'All',
            campusLocation: 'All',
            condition: 'All',
            onlySubscriptions: false,
            onlyVerifiedStudents: false,
            onlyBusinesses: false,
            maxPrice: 200000,
            sortBy: 'newest',
          })
        }
        totalResultsCount={filteredListings.length}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'admin' && !isAdminAuthenticated) {
            setIsAdminLoginModalOpen(true);
            return;
          }
          if (view === 'sell') {
            handleOpenSell();
            return;
          }
          if (view === 'support') setPrefillComplaint(null);
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.length}
      />

      {/* Image Upload Requirements Pre-modal */}
      <ImageRequirementsModal
        isOpen={isImageReqModalOpen}
        onClose={() => setIsImageReqModalOpen(false)}
        onContinue={() => {
          setIsImageReqModalOpen(false);
          setActiveView('sell');
        }}
      />

      {/* Home Page Welcoming Popup & Announcement Modal */}
      <WelcomeAnnouncementModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
        settings={settings}
      />
    </div>
  );
}
