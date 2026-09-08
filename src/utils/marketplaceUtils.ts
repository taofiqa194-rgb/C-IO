import { Listing } from '../types';

/** Default duration before a listing expires if not explicitly provided (30 days) */
export const DEFAULT_LISTING_LIFESPAN_DAYS = 30;

/**
 * Calculates the expiration date for a listing.
 * Falls back to 30 days after creation if expiresAt is not explicitly set.
 */
export function getListingExpirationDate(listing: Listing): Date {
  if (listing.expiresAt) {
    const d = new Date(listing.expiresAt);
    if (!isNaN(d.getTime())) return d;
  }
  const created = new Date(listing.createdAt || Date.now());
  const createdTime = isNaN(created.getTime()) ? Date.now() : created.getTime();
  return new Date(createdTime + DEFAULT_LISTING_LIFESPAN_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Checks whether a listing is expired based on its explicit flag or calculated expiration timestamp.
 */
export function isListingExpired(listing: Listing): boolean {
  if (listing.isExpired === true || listing.status === 'expired') return true;
  const expDate = getListingExpirationDate(listing);
  return Date.now() > expDate.getTime();
}

/**
 * Returns the whole days remaining before expiration (can be 0 or negative if expired).
 */
export function getListingDaysRemaining(listing: Listing): number {
  const expDate = getListingExpirationDate(listing);
  const diffMs = expDate.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns a human-friendly string for listing expiration status.
 */
export function formatListingExpiration(listing: Listing): {
  label: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
} {
  if (listing.isSold) {
    return { label: 'Sold Out', isExpired: false, isExpiringSoon: false, daysRemaining: 0 };
  }

  const days = getListingDaysRemaining(listing);
  const expired = days <= 0 || listing.isExpired === true;
  const expiringSoon = !expired && days <= 5;

  let label = 'Active';
  if (expired) {
    label = 'Expired';
  } else if (days === 1) {
    label = 'Expires today';
  } else if (expiringSoon) {
    label = `Expires in ${days} days`;
  } else {
    label = `${days} days active`;
  }

  return { label, isExpired: expired, isExpiringSoon: expiringSoon, daysRemaining: days };
}

/**
 * Session storage deduplication helper for product views.
 * Ensures each listing is only counted once per browser session.
 * Prevents redundant Firestore writes and quota consumption when visitors refresh or re-click cards.
 */
export function recordSessionProductView(productId: string): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) return false;
  try {
    const raw = sessionStorage.getItem('cio_session_viewed_items');
    const viewed: string[] = raw ? JSON.parse(raw) : [];
    if (viewed.includes(productId)) {
      return false; // Already recorded in this session
    }
    viewed.push(productId);
    sessionStorage.setItem('cio_session_viewed_items', JSON.stringify(viewed));
    return true; // Newly viewed
  } catch {
    return false;
  }
}
