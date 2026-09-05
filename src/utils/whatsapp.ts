import { Listing } from '../types';

/**
 * Standardize Nigerian phone numbers for WhatsApp wa.me links
 * e.g., '09076930244' -> '2349076930244'
 * '+234 907 693 0244' -> '2349076930244'
 */
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '2349076930244';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = '234' + cleaned.slice(1);
  }
  return cleaned || '2349076930244';
}

/**
 * Generate formatted WhatsApp pre-filled message according to requirement:
 * "Hello, I want to buy [PRODUCT NAME] for ₦[PRICE]. Is it still available?"
 */
export function generateWhatsAppOrderMessage(listing: Listing, buyerName?: string): string {
  const formattedPrice = listing.price.toLocaleString();
  const buyerGreeting = buyerName ? ` My name is ${buyerName}.` : '';

  return (
    `Hello, I want to buy ${listing.title} for ₦${formattedPrice}. Is it still available?\n\n` +
    `📦 Item: ${listing.title}\n` +
    `💰 Price: ₦${formattedPrice}\n` +
    `📍 Campus Location: ${listing.campusLocation || 'University of Ilorin Mini Campus'}\n` +
    `👤 Seller: ${listing.sellerName}\n\n` +
    `Can we meet up at University of Ilorin Mini Campus (e.g., Mini Campus Gate or Student Center)?${buyerGreeting}`
  );
}

/**
 * Open WhatsApp directly with pre-filled message using seller's registered number
 */
export function openWhatsAppOrder(listing: Listing, buyerName?: string): void {
  const phone = cleanPhoneNumber(listing.sellerPhone);
  const message = generateWhatsAppOrderMessage(listing, buyerName);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${phone}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Generate official C'IO support WhatsApp URL using strictly 09076930244
 */
export function getOfficialSupportWhatsAppUrl(topic: string = 'General Inquiry', userDetails?: string): string {
  const phone = '2349076930244';
  const msg = `Hello C'IO Support (University of Ilorin Mini Campus Marketplace),\nI need help with: ${topic}.${
    userDetails ? `\n\nAccount/Issue Info: ${userDetails}` : ''
  }`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
