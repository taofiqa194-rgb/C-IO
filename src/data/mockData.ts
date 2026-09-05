import { User, Listing, ComplaintTicket } from '../types';

// The marketplace starts strictly clean: NO demo accounts, NO demo products, NO demo complaints.
export const INITIAL_USERS: User[] = [];

export const INITIAL_LISTINGS: Listing[] = [];

export const INITIAL_COMPLAINTS: ComplaintTicket[] = [];

// Strictly University of Ilorin Mini Campus locations and surrounding student lodge areas
export const UNILORIN_CAMPUS_LOCATIONS = [
  'University of Ilorin Mini Campus - Main Gate',
  'University of Ilorin Mini Campus - Lecture Halls & Theatres',
  'University of Ilorin Mini Campus - Library Complex',
  'University of Ilorin Mini Campus - Student Center & SUB',
  'University of Ilorin Mini Campus - Sports Complex',
  'Sabo Oke Student Lodges (Mini Campus Area)',
  'Fadipe / Stadium Road Area',
  'Post Graduate Hostel Quarters (Mini Campus)',
  'Muritala Mohammed Road (Mini Campus Access)',
  'Offa Road / Government Area',
  'Surulere / Taiwo Isale Area',
  'Approved Off-Campus Vendor Location',
];

export const PRODUCT_CATEGORIES = [
  'Subscriptions & Digital',
  'Textbooks & Handouts',
  'Phones & Gadgets',
  'Hostel Essentials',
  'Fashion & Footwear',
  'Food & Provisions',
  'Beauty & Grooming',
  'Services & Tutorials',
] as const;

// The ONLY official C'IO support phone and WhatsApp number
export const OFFICIAL_SUPPORT_PHONE = '09076930244';
export const OFFICIAL_SUPPORT_WHATSAPP = '2349076930244';
