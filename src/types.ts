export type UserRole = 'student' | 'buyer' | 'business' | 'admin';

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
  sellerId: string;
  sellerName: string;
  sellerPhone: string;
  sellerRole: UserRole;
  sellerMatricVerified?: boolean;
  sellerMatricNumber?: string;
  sellerBusinessName?: string;
  sellerBusinessVerified?: boolean;
  campusLocation: string;
  condition: ItemCondition;
  isSubscription?: boolean;
  subscriptionDuration?: SubscriptionDuration;
  isFeatured?: boolean;
  featuredExpiresAt?: string;
  isSold?: boolean;
  isExpired?: boolean;
  isApproved?: boolean;
  viewsCount: number;
  inquiriesCount: number;
  createdAt: string;
  tags?: string[];
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
}

export interface PlatformStats {
  totalListings: number;
  totalStudentsVerified: number;
  totalBusinesses: number;
  revenueFromListingFees: number;
  revenueFromFeaturedBoosts: number;
  resolvedComplaints: number;
}
