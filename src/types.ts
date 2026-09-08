export type UserRole = 'student' | 'buyer' | 'business' | 'admin' | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string; // WhatsApp number
  role: UserRole;
  avatarUrl?: string;
  campusLocation: string;
  matricNumber?: string;
  isMatricVerified?: boolean;
  department?: string;
  faculty?: string;
  businessName?: string;
  isBusinessVerified?: boolean;
  isProMember?: boolean;
  createdAt: string;
  isBanned?: boolean;
}

export type ProductCategory =
  | 'Subscriptions & Digital'
  | 'Textbooks & Handouts'
  | 'Phones & Gadgets'
  | 'Hostel Essentials'
  | 'Fashion & Footwear'
  | 'Food & Provisions'
  | 'Beauty & Grooming'
  | 'Services & Tutorials';

export type ItemCondition = 'Brand New' | 'Like New' | 'Fairly Used' | 'Digital / Account Access';

export type SubscriptionDuration = 'Monthly' | 'Semester-wise' | 'Annual' | 'One-Time Access';

export interface Listing {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  description: string;
  imageUrl: string;
  additionalImages?: string[];
  images?: string[];
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerRole: UserRole;
  sellerMatricVerified?: boolean;
  sellerMatricNumber?: string;
  sellerBusinessName?: string;
  sellerBusinessVerified?: boolean;
  campus?: string;
  location?: string;
  campusLocation: string;
  condition: ItemCondition;
  isSubscription?: boolean;
  subscriptionDuration?: SubscriptionDuration;
  isFeatured?: boolean;
  featuredExpiresAt?: string;
  isSold?: boolean;
  isExpired?: boolean;
  expiresAt?: string;
  isApproved?: boolean;
  status?: 'active' | 'sold' | 'expired' | 'pending';
  viewsCount: number;
  inquiriesCount: number;
  createdAt: string;
  tags?: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'deal';
  createdAt: string;
  read: boolean;
  linkAction?: 'open_listing' | 'open_support' | 'open_subscriptions' | 'open_sell' | 'open_admin';
  targetListingId?: string;
}

export type SupportCategory =
  | 'Login problems'
  | 'Registration problems'
  | 'Unable to add products'
  | 'Unable to add products to cart'
  | 'Problems ordering'
  | 'Reported scams'
  | 'Account problems'
  | 'Other complaints';

export interface ComplaintTicket {
  id: string;
  userId?: string;
  userName: string;
  userPhone: string;
  category: SupportCategory;
  title: string;
  description: string;
  listingId?: string;
  accusedSellerName?: string;
  status: 'Open' | 'Under Investigation' | 'Resolved' | 'Dismissed';
  adminReply?: string;
  adminRepliedAt?: string;
  createdAt: string;
}

export interface PlatformSettings {
  siteName: string;
  officialPhone: string;
  listingModerationEnabled: boolean;
  registrationEnabled: boolean;
  listingFeeNaira?: number;
  featuredBoostFeeNaira?: number;
  vendorSubscriptionSemesterFee?: number;
  platformSupportPhone?: string;
  platformSupportWhatsApp?: string;
  allowGuestBrowsing?: boolean;
  requireMatricVerificationForSelling?: boolean;
  maintenanceMode?: boolean;
  // Announcement settings
  announcementEnabled?: boolean;
  announcementTitle?: string;
  announcementMessage?: string;
  announcementType?: 'verified' | 'notice' | 'alert' | 'event';
  announcementCategory?: string;
  announcementDate?: string;
  // TikTok-style Verified Badge settings
  verifiedBadgeColor?: 'blue' | 'red';
}

export interface NavMenuNames {
  filters: string;
  support: string;
  saved: string;
  admin: string;
  postItem: string;
  login: string;
}

export interface SiteHeaderSettings {
  siteName: string;
  shortSiteName: string;
  logoUrl?: string;
  logoVisible: boolean;
  tagline: string;
  subtitle: string;
  headerBgColor: string;
  headerTextColor: string;
  headerAccentColor: string;
  searchPlaceholder: string;
  navMenuNames: NavMenuNames;
  announcementText: string;
  announcementVisible: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_HEADER_SETTINGS: SiteHeaderSettings = {
  siteName: "C'IO — University of Ilorin Mini Campus Marketplace",
  shortSiteName: "C'IO",
  logoUrl: "",
  logoVisible: true,
  tagline: "Verified Marketplace",
  subtitle: "University of Ilorin Mini Campus",
  headerBgColor: "#141413",
  headerTextColor: "#FFFFFF",
  headerAccentColor: "#8E8E6F",
  searchPlaceholder: "Search products at University of Ilorin Mini Campus...",
  navMenuNames: {
    filters: "Filters",
    support: "Support",
    saved: "Saved",
    admin: "Admin Console",
    postItem: "Post Item",
    login: "Log In",
  },
  announcementText: "Inspect items in daylight at Mini Campus Gate or Student Center before payment.",
  announcementVisible: true,
};

export interface PlatformStats {
  totalListings: number;
  totalStudentsVerified: number;
  totalBusinesses: number;
  revenueFromListingFees: number;
  revenueFromFeaturedBoosts: number;
  resolvedComplaints: number;
}
