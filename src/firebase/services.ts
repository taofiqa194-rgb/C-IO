import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  deleteField,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  increment 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './config';
import { User, Listing, ComplaintTicket, PlatformSettings, UserRole } from '../types';
import { OFFICIAL_SUPPORT_PHONE, OFFICIAL_SUPPORT_WHATSAPP } from '../data/mockData';

export const PRIMARY_ADMIN_EMAIL = 'admin@unilorinmarketplace.com';
export const OWNER_ADMIN_EMAIL = 'hammedolawumiolawumi@gmail.com';

export function isPrimaryAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower === 'admin@unilorinmarketplace.com' ||
    lower === 'hammedolawumiolawumi@gmail.com' ||
    lower === PRIMARY_ADMIN_EMAIL.toLowerCase() ||
    lower === OWNER_ADMIN_EMAIL.toLowerCase()
  );
}

/**
 * Recursively strips undefined values from an object or array before passing to Firestore.
 * Firestore setDoc(), addDoc(), and updateDoc() reject `undefined` values with:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    // Preserve Firestore sentinels (deleteField, increment, serverTimestamp) and Date instances
    if (
      data instanceof Date ||
      (data.constructor &&
        (data.constructor.name === 'FieldValue' ||
         data.constructor.name === 'Timestamp' ||
         data.constructor.name === 'GeoPoint' ||
         data.constructor.name === 'Bytes')) ||
      ('_methodName' in (data as Record<string, any>))
    ) {
      return data;
    }

    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(data as Record<string, any>)) {
      if (val !== undefined) {
        cleaned[key] = sanitizeForFirestore(val);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Helper: Convert File to Base64 (fallback if Storage CORS or bucket is restricted)
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Fast Image Upload with local /api/upload and zero-latency fallback
export async function uploadImageFile(path: string, file: File): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: base64,
        filename: file.name,
        sizeKb: Math.round(file.size / 1024),
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
    return base64;
  } catch (err) {
    console.warn('Fast /api/upload failed, using base64 fallback:', err);
    return await fileToBase64(file);
  }
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & USER PROFILE
// -------------------------------------------------------------

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  campusLocation: string;
  matricNumber?: string;
  faculty?: string;
  department?: string;
  businessName?: string;
  avatarUrl?: string;
}): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, params.email.trim(), params.password);
  const fbUser = credential.user;

  await updateProfile(fbUser, {
    displayName: params.name.trim(),
  }).catch(() => {});

  const newUser: User = {
    id: fbUser.uid,
    name: params.name.trim(),
    email: params.email.trim().toLowerCase(),
    phone: params.phone.trim(),
    role: params.role || 'student',
    campusLocation: params.campusLocation || 'Hostel A, Mini Campus',
    matricNumber: params.matricNumber?.trim() || '',
    isMatricVerified: false,
    faculty: params.faculty || '',
    department: params.department || '',
    businessName: params.businessName || '',
    isBusinessVerified: false,
    isProMember: false,
    isBanned: false,
    createdAt: new Date().toISOString().split('T')[0],
    avatarUrl: params.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(params.name)}`,
  };

  // Persist real user profile into Firestore
  await setDoc(doc(db, 'users', fbUser.uid), newUser);
  return newUser;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const fbUser = credential.user;
  const isPrimary = isPrimaryAdminEmail(fbUser.email);

  // Default profile in case of offline/network fallback
  const fallbackProfile: User = {
    id: fbUser.uid,
    name: fbUser.displayName || (isPrimary ? 'Campus Marketplace Administrator' : 'Campus User'),
    email: fbUser.email || '',
    phone: OFFICIAL_SUPPORT_PHONE,
    role: isPrimary ? 'admin' : 'student',
    campusLocation: 'University of Ilorin Mini Campus',
    isMatricVerified: isPrimary,
    isBusinessVerified: isPrimary,
    isProMember: false,
    isBanned: false,
    createdAt: new Date().toISOString().split('T')[0],
    avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.email || 'User')}`,
  };

  // Fetch Firestore profile safely
  const userRef = doc(db, 'users', fbUser.uid);
  let userSnap = null;
  try {
    userSnap = await getDoc(userRef);
  } catch (docErr) {
    console.warn('Firestore profile fetch fallback (offline/delay):', docErr);
    // Asynchronously cache/set profile without blocking the login
    setDoc(userRef, sanitizeForFirestore(fallbackProfile)).catch(() => {});
    return fallbackProfile;
  }
  
  if (userSnap && userSnap.exists()) {
    let userProfile = userSnap.data() as User;

    // The primary administrator account can NEVER be suspended and MUST have role 'admin'
    if (isPrimary || userProfile.role === 'admin' || userProfile.role === 'super_admin') {
      if (userProfile.isBanned || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin')) {
        userProfile = {
          ...userProfile,
          isBanned: false,
          role: 'admin',
        };
        // Update actual Firestore record so suspended status is permanently removed
        await updateDoc(userRef, {
          isBanned: false,
          role: 'admin',
        }).catch((err) => console.warn('Could not auto-repair admin status in Firestore:', err));
      }
      return userProfile;
    }

    // Normal users check suspension
    if (userProfile.isBanned) {
      await signOut(auth);
      throw new Error('This account has been suspended by campus administration.');
    }
    return userProfile;
  }

  // If profile doesn't exist yet (e.g. admin or created directly in Firebase Auth console)
  await setDoc(userRef, sanitizeForFirestore(fallbackProfile)).catch(() => {});
  return fallbackProfile;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetUserPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function updateUserProfile(userId: string, updates: Partial<User>, avatarFile?: File): Promise<User> {
  let updatedAvatarUrl = updates.avatarUrl;
  if (avatarFile) {
    updatedAvatarUrl = await uploadImageFile(`avatars/${userId}/${Date.now()}_${avatarFile.name}`, avatarFile);
  }

  const payload: Partial<User> = {
    ...updates,
    ...(updatedAvatarUrl ? { avatarUrl: updatedAvatarUrl } : {}),
  };

  const safePayload = sanitizeForFirestore(payload);
  await updateDoc(doc(db, 'users', userId), safePayload);
  const fresh = await getDoc(doc(db, 'users', userId));
  return fresh.data() as User;
}

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // If current auth user matches this ID and is admin, build temporary profile
      const current = auth.currentUser;
      if (current && current.uid === userId && isPrimaryAdminEmail(current.email)) {
        return {
          id: current.uid,
          name: current.displayName || 'Campus Marketplace Administrator',
          email: current.email || '',
          phone: OFFICIAL_SUPPORT_PHONE,
          role: 'admin',
          campusLocation: 'University of Ilorin Mini Campus',
          isMatricVerified: true,
          isBusinessVerified: true,
          isProMember: false,
          isBanned: false,
          createdAt: new Date().toISOString().split('T')[0],
          avatarUrl: current.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=Admin`,
        };
      }
      return null;
    }
    const data = snap.data() as User;
    if (isPrimaryAdminEmail(data.email)) {
      if (data.isBanned || (data.role !== 'admin' && data.role !== 'super_admin')) {
        data.isBanned = false;
        data.role = 'admin';
        updateDoc(userRef, { isBanned: false, role: 'admin' }).catch(() => {});
      }
    }
    return data;
  } catch (err) {
    console.warn('getUserProfile offline/fetch fallback:', err);
    const current = auth.currentUser;
    if (current && current.uid === userId) {
      const isPrimary = isPrimaryAdminEmail(current.email);
      return {
        id: current.uid,
        name: current.displayName || (isPrimary ? 'Campus Marketplace Administrator' : 'Campus User'),
        email: current.email || '',
        phone: OFFICIAL_SUPPORT_PHONE,
        role: isPrimary ? 'admin' : 'student',
        campusLocation: 'University of Ilorin Mini Campus',
        isMatricVerified: isPrimary,
        isBusinessVerified: isPrimary,
        isProMember: false,
        isBanned: false,
        createdAt: new Date().toISOString().split('T')[0],
        avatarUrl: current.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(current.email || 'User')}`,
      };
    }
    return null;
  }
}

// Admin determination helper
export function checkIsAdminUser(user: User | null, fbUser: FirebaseUser | null): boolean {
  if (!user && !fbUser) return false;
  if (user?.role === 'admin' || user?.role === 'super_admin') return true;
  if (isPrimaryAdminEmail(user?.email) || isPrimaryAdminEmail(fbUser?.email)) return true;
  return false;
}

// Auth State Subscriber
export function subscribeToAuth(callback: (user: User | null, isAdmin: boolean) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null, false);
      return;
    }

    const isPrimary = isPrimaryAdminEmail(fbUser.email);
    const fallbackProfile: User = {
      id: fbUser.uid,
      name: fbUser.displayName || (isPrimary ? 'Campus Marketplace Administrator' : 'Campus User'),
      email: fbUser.email || '',
      phone: OFFICIAL_SUPPORT_PHONE,
      role: isPrimary ? 'admin' : 'student',
      campusLocation: 'University of Ilorin Mini Campus',
      isMatricVerified: isPrimary,
      isBusinessVerified: isPrimary,
      isProMember: false,
      isBanned: false,
      createdAt: new Date().toISOString().split('T')[0],
      avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.email || 'User')}`,
    };

    try {
      const userRef = doc(db, 'users', fbUser.uid);
      let snap = null;
      try {
        snap = await getDoc(userRef);
      } catch (err) {
        console.warn('Auth state getDoc fallback:', err);
      }

      let userProfile: User;

      if (snap && snap.exists()) {
        userProfile = snap.data() as User;
        if (isPrimary && (userProfile.isBanned || (userProfile.role !== 'admin' && userProfile.role !== 'super_admin'))) {
          userProfile.isBanned = false;
          userProfile.role = 'admin';
          updateDoc(userRef, {
            isBanned: false,
            role: 'admin',
          }).catch(() => {});
        }
      } else {
        userProfile = fallbackProfile;
        setDoc(userRef, sanitizeForFirestore(userProfile)).catch(() => {});
      }

      const isAdmin = checkIsAdminUser(userProfile, fbUser);
      callback(userProfile, isAdmin);
    } catch (e) {
      console.error('Error fetching user profile in auth state changed:', e);
      callback(fallbackProfile, isPrimary);
    }
  });
}

// -------------------------------------------------------------
// 2. PRODUCTS (MARKETPLACE LISTINGS)
// -------------------------------------------------------------

export function subscribeToProducts(callback: (products: Listing[]) => void): () => void {
  const colRef = collection(db, 'products');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Listing[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as Listing);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    },
    (error) => {
      console.error('Firestore products subscription error:', error);
    }
  );
}

export async function fetchProductsOnce(): Promise<Listing[]> {
  const snapshot = await getDocs(collection(db, 'products'));
  const list: Listing[] = [];
  snapshot.forEach((docSnap) => {
    list.push({ ...docSnap.data(), id: docSnap.id } as Listing);
  });
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return list;
}

export async function createProductListing(
  productData: Partial<Listing>, 
  imageFile?: File,
  additionalFiles?: File[]
): Promise<Listing> {
  const user = auth.currentUser;
  if (!user) throw new Error('You must be logged in to create a product.');

  let mainImageUrl = productData.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
  if (imageFile) {
    mainImageUrl = await uploadImageFile(`products/${user.uid}/${Date.now()}_${imageFile.name}`, imageFile);
  } else if (mainImageUrl.startsWith('data:image/')) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: mainImageUrl,
          filename: 'listing.jpg',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) mainImageUrl = data.url;
      }
    } catch (e) {
      console.warn('Fast upload endpoint fallback to direct data URI:', e);
    }
  }

  const extraImages: string[] = (
    Array.isArray(productData.additionalImages) ? productData.additionalImages :
    Array.isArray((productData as any).images) ? (productData as any).images : []
  ).filter((url): url is string => typeof url === 'string' && url.length > 0);

  if (additionalFiles && additionalFiles.length > 0) {
    for (const f of additionalFiles) {
      const extraUrl = await uploadImageFile(`products/${user.uid}/${Date.now()}_extra_${f.name}`, f);
      if (extraUrl) extraImages.push(extraUrl);
    }
  }

  const newDocRef = doc(collection(db, 'products'));

  // Ensure safe, validated price
  const parsedPrice = Number(productData.price);
  const safePrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

  // Safe handling of originalPrice:
  // ONLY attach if provided and is a valid positive number. Otherwise DO NOT attach to the document.
  let safeOriginalPrice: number | undefined = undefined;
  if (
    productData.originalPrice !== undefined && 
    productData.originalPrice !== null && 
    productData.originalPrice !== ('' as any)
  ) {
    const parsedOriginal = Number(productData.originalPrice);
    if (!isNaN(parsedOriginal) && parsedOriginal > 0) {
      safeOriginalPrice = parsedOriginal;
    }
  }

  const campusLocationValue = 
    productData.campusLocation?.trim() || 
    (productData as any).location?.trim() || 
    'Hostel A, Mini Campus';

  const newProductPayload: Record<string, any> = {
    id: newDocRef.id,
    title: productData.title?.trim() || 'Untitled Listing',
    price: safePrice,
    category: productData.category || 'Phones & Gadgets',
    description: productData.description?.trim() || '',
    imageUrl: mainImageUrl,
    additionalImages: extraImages,
    images: [mainImageUrl, ...extraImages],
    sellerId: user.uid,
    sellerName: productData.sellerName?.trim() || user.displayName || 'Campus Seller',
    sellerPhone: productData.sellerPhone?.trim() || OFFICIAL_SUPPORT_PHONE,
    sellerRole: productData.sellerRole || 'student',
    sellerMatricVerified: Boolean(productData.sellerMatricVerified),
    sellerMatricNumber: productData.sellerMatricNumber || '',
    sellerBusinessName: productData.sellerBusinessName || '',
    sellerBusinessVerified: Boolean(productData.sellerBusinessVerified),
    campus: 'University of Ilorin Mini Campus',
    campusLocation: campusLocationValue,
    location: campusLocationValue,
    condition: productData.condition || 'Like New',
    isSubscription: Boolean(productData.isSubscription),
    isFeatured: Boolean(productData.isFeatured),
    isSold: false,
    isExpired: false,
    isApproved: true,
    status: 'active',
    viewsCount: 1,
    inquiriesCount: 0,
    createdAt: productData.createdAt || new Date().toISOString().split('T')[0],
    tags: Array.isArray(productData.tags) ? productData.tags.filter(Boolean) : [],
  };

  // Only attach originalPrice if seller entered a valid positive number
  if (safeOriginalPrice !== undefined) {
    newProductPayload.originalPrice = safeOriginalPrice;
  }

  // Only attach subscriptionDuration if subscription is active and specified
  if (productData.isSubscription && productData.subscriptionDuration) {
    newProductPayload.subscriptionDuration = productData.subscriptionDuration;
  }

  const safeData = sanitizeForFirestore(newProductPayload);
  await setDoc(newDocRef, safeData);
  return safeData as Listing;
}

export async function updateProductListing(
  productId: string, 
  updates: Partial<Listing>,
  newImageFile?: File
): Promise<void> {
  const updatePayload: Record<string, any> = {};

  if (updates.title !== undefined) updatePayload.title = updates.title.trim();
  if (updates.price !== undefined) {
    const num = Number(updates.price);
    updatePayload.price = !isNaN(num) && num >= 0 ? num : 0;
  }

  // Safe handling of originalPrice during updates:
  // If explicitly specified in updates:
  // - valid positive number => update to that number
  // - empty, null, undefined, or <= 0 => deleteField() so it's cleanly removed from Firestore
  if ('originalPrice' in updates) {
    if (
      updates.originalPrice === undefined || 
      updates.originalPrice === null || 
      updates.originalPrice === ('' as any) || 
      isNaN(Number(updates.originalPrice)) || 
      Number(updates.originalPrice) <= 0
    ) {
      updatePayload.originalPrice = deleteField();
    } else {
      updatePayload.originalPrice = Number(updates.originalPrice);
    }
  }

  if (updates.description !== undefined) updatePayload.description = updates.description.trim();
  if (updates.category !== undefined) updatePayload.category = updates.category;

  if (updates.campusLocation !== undefined) {
    updatePayload.campusLocation = updates.campusLocation;
    updatePayload.location = updates.campusLocation;
    updatePayload.campus = 'University of Ilorin Mini Campus';
  } else if ((updates as any).location !== undefined) {
    updatePayload.campusLocation = (updates as any).location;
    updatePayload.location = (updates as any).location;
  }

  if ((updates as any).campus !== undefined) {
    updatePayload.campus = (updates as any).campus;
  }

  if (updates.condition !== undefined) updatePayload.condition = updates.condition;
  if (updates.isSubscription !== undefined) updatePayload.isSubscription = Boolean(updates.isSubscription);
  if (updates.subscriptionDuration !== undefined) {
    if (updates.subscriptionDuration) {
      updatePayload.subscriptionDuration = updates.subscriptionDuration;
    } else {
      updatePayload.subscriptionDuration = deleteField();
    }
  }

  if (updates.isFeatured !== undefined) updatePayload.isFeatured = Boolean(updates.isFeatured);
  if (updates.isSold !== undefined) {
    updatePayload.isSold = Boolean(updates.isSold);
    updatePayload.status = updates.isSold ? 'sold' : 'active';
  }
  if (updates.isExpired !== undefined) updatePayload.isExpired = Boolean(updates.isExpired);
  if (updates.isApproved !== undefined) updatePayload.isApproved = Boolean(updates.isApproved);
  if ((updates as any).status !== undefined) updatePayload.status = (updates as any).status;
  if (updates.sellerName !== undefined) updatePayload.sellerName = updates.sellerName.trim();
  if (updates.sellerPhone !== undefined) updatePayload.sellerPhone = updates.sellerPhone.trim();

  if (updates.imageUrl !== undefined) updatePayload.imageUrl = updates.imageUrl;
  if (updates.additionalImages !== undefined) {
    updatePayload.additionalImages = Array.isArray(updates.additionalImages)
      ? updates.additionalImages.filter(Boolean)
      : [];
    if (updatePayload.imageUrl) {
      updatePayload.images = [updatePayload.imageUrl, ...updatePayload.additionalImages];
    }
  }
  if (updates.tags !== undefined) {
    updatePayload.tags = Array.isArray(updates.tags) ? updates.tags.filter(Boolean) : [];
  }

  // Preserve any other safe properties explicitly set without undefined
  for (const [key, val] of Object.entries(updates)) {
    if (!(key in updatePayload)) {
      if (val !== undefined) {
        updatePayload[key] = val;
      }
    }
  }

  // Image handling if file uploaded
  if (newImageFile) {
    const user = auth.currentUser;
    const uid = user ? user.uid : 'admin';
    updatePayload.imageUrl = await uploadImageFile(`products/${uid}/${Date.now()}_${newImageFile.name}`, newImageFile);
    if (updatePayload.additionalImages) {
      updatePayload.images = [updatePayload.imageUrl, ...updatePayload.additionalImages];
    }
  } else if (updatePayload.imageUrl && typeof updatePayload.imageUrl === 'string' && updatePayload.imageUrl.startsWith('data:image/')) {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: updatePayload.imageUrl,
          filename: 'listing.jpg',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) updatePayload.imageUrl = data.url;
      }
    } catch (e) {
      console.warn('Storage upload fallback:', e);
    }
  }

  const safePayload = sanitizeForFirestore(updatePayload);
  await updateDoc(doc(db, 'products', productId), safePayload);
}

export async function deleteProductListing(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

export async function toggleProductListingSold(productId: string, isSold: boolean): Promise<void> {
  await updateDoc(doc(db, 'products', productId), { isSold });
}

export async function toggleProductListingFeatured(productId: string, isFeatured: boolean): Promise<void> {
  await updateDoc(doc(db, 'products', productId), { isFeatured });
}

export async function recordProductView(productId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', productId), {
      viewsCount: increment(1),
    });
  } catch {
    // Non-critical background metric
  }
}

export async function recordProductInquiry(productId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'products', productId), {
      inquiriesCount: increment(1),
    });
  } catch {
    // Non-critical background metric
  }
}

// -------------------------------------------------------------
// 3. USER SAVED FAVORITES (STORED IN FIRESTORE PER USER)
// -------------------------------------------------------------

export async function getUserFavorites(userId: string): Promise<string[]> {
  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'favorites'));
    const favIds: string[] = [];
    snapshot.forEach((d) => favIds.push(d.id));
    return favIds;
  } catch (e) {
    console.error('Error fetching favorites from Firestore:', e);
    return [];
  }
}

export async function toggleUserFavorite(userId: string, productId: string, shouldFavorite: boolean): Promise<void> {
  const favDocRef = doc(db, 'users', userId, 'favorites', productId);
  if (shouldFavorite) {
    await setDoc(favDocRef, { productId, savedAt: new Date().toISOString() });
  } else {
    await deleteDoc(favDocRef);
  }
}

// -------------------------------------------------------------
// 4. CUSTOMER SUPPORT & COMPLAINT TICKETS
// -------------------------------------------------------------

export async function submitSupportComplaint(data: Partial<ComplaintTicket>): Promise<ComplaintTicket> {
  const user = auth.currentUser;
  const newDocRef = doc(collection(db, 'complaints'));

  const ticket: ComplaintTicket = {
    id: newDocRef.id,
    userId: user?.uid || data.userId || '',
    userName: data.userName || user?.displayName || 'Anonymous Student',
    userPhone: data.userPhone || OFFICIAL_SUPPORT_PHONE,
    category: data.category || 'Other complaints',
    title: data.title || 'Support Request',
    description: data.description || '',
    listingId: data.listingId,
    accusedSellerName: data.accusedSellerName,
    status: 'Open',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };

  await setDoc(newDocRef, sanitizeForFirestore(ticket));
  return ticket;
}

export function subscribeToComplaints(
  callback: (tickets: ComplaintTicket[]) => void, 
  userId?: string, 
  isAdmin?: boolean
): () => void {
  const colRef = collection(db, 'complaints');
  const q = (!isAdmin && userId) 
    ? query(colRef, where('userId', '==', userId))
    : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const tickets: ComplaintTicket[] = [];
      snapshot.forEach((docSnap) => {
        tickets.push({ ...docSnap.data(), id: docSnap.id } as ComplaintTicket);
      });
      tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(tickets);
    },
    (err) => {
      console.error('Complaints subscription error:', err);
    }
  );
}

export async function replyToComplaint(
  ticketId: string, 
  reply: string, 
  status: ComplaintTicket['status']
): Promise<void> {
  await updateDoc(doc(db, 'complaints', ticketId), {
    adminReply: reply,
    status,
    adminRepliedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
  });
}

export async function deleteComplaintTicket(ticketId: string): Promise<void> {
  await deleteDoc(doc(db, 'complaints', ticketId));
}

// -------------------------------------------------------------
// 5. ADMIN MANAGEMENT & SETTINGS
// -------------------------------------------------------------

export async function fetchAllUsers(): Promise<User[]> {
  const snapshot = await getDocs(collection(db, 'users'));
  const users: User[] = [];
  snapshot.forEach((docSnap) => {
    const u = { ...docSnap.data(), id: docSnap.id } as User;
    // Auto-heal primary admin account if ever found suspended or demoted
    if (isPrimaryAdminEmail(u.email)) {
      if (u.isBanned || (u.role !== 'admin' && u.role !== 'super_admin')) {
        u.isBanned = false;
        u.role = 'admin';
        updateDoc(docSnap.ref, { isBanned: false, role: 'admin' }).catch(() => {});
      }
    }
    users.push(u);
  });
  return users;
}

export async function setStudentMatricVerification(userId: string, isVerified: boolean): Promise<void> {
  // Update user profile
  await updateDoc(doc(db, 'users', userId), { isMatricVerified: isVerified });

  // Synchronously update all listings by this seller
  const q = query(collection(db, 'products'), where('sellerId', '==', userId));
  const snap = await getDocs(q);
  const updates = snap.docs.map((docSnap) =>
    updateDoc(docSnap.ref, { sellerMatricVerified: isVerified })
  );
  await Promise.all(updates);
}

export async function setAccountBanStatus(userId: string, isBanned: boolean): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data() as User;
    if (isPrimaryAdminEmail(data.email) || data.role === 'admin' || data.role === 'super_admin') {
      if (isBanned) {
        throw new Error('The primary administrator account cannot be suspended.');
      }
    }
  }
  await updateDoc(userRef, { isBanned });
}

export async function removeUserAccount(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data() as User;
    if (isPrimaryAdminEmail(data.email) || data.role === 'admin' || data.role === 'super_admin') {
      throw new Error('The primary campus administrator account cannot be deleted.');
    }
  }
  await deleteDoc(userRef);
}

/**
 * Synchronize and migrate administrator accounts:
 * - Demotes and removes legacy administrator privileges from the old account (admin@unilorinmini.edu.ng).
 * - Ensures the new primary administrator account is active, unsuspended, and assigned the admin role.
 */
export async function syncAndMigrateAdminAccounts(): Promise<void> {
  try {
    // 1. Remove legacy admin account or revoke admin privileges
    const legacyEmail = 'admin@unilorinmini.edu.ng';
    const legacyQ = query(collection(db, 'users'), where('email', '==', legacyEmail));
    const legacySnap = await getDocs(legacyQ);
    for (const d of legacySnap.docs) {
      await deleteDoc(d.ref).catch(async () => {
        await updateDoc(d.ref, { role: 'student', isBanned: true });
      });
    }

    // 2. Ensure new primary administrator account is active and has admin role
    const primaryQ = query(collection(db, 'users'), where('email', '==', PRIMARY_ADMIN_EMAIL.toLowerCase()));
    const primarySnap = await getDocs(primaryQ);
    for (const d of primarySnap.docs) {
      const data = d.data() as User;
      if (data.isBanned || (data.role !== 'admin' && data.role !== 'super_admin')) {
        await updateDoc(d.ref, { isBanned: false, role: 'admin' });
      }
    }
  } catch (err) {
    console.warn('Admin account synchronization note:', err);
  }
}

export const restoreAdminAccount = syncAndMigrateAdminAccounts;

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const settingDocRef = doc(db, 'settings', 'global');
  const snap = await getDoc(settingDocRef);

  if (snap.exists()) {
    const data = snap.data() as PlatformSettings;
    return {
      siteName: data.siteName || "C'IO",
      siteTagline: data.siteTagline || "University of Ilorin Mini Campus Marketplace",
      siteShortName: data.siteShortName || "C'IO",
      officialPhone: data.officialPhone || OFFICIAL_SUPPORT_PHONE,
      listingModerationEnabled: Boolean(data.listingModerationEnabled),
      registrationEnabled: data.registrationEnabled !== false,
      listingFeeNaira: data.listingFeeNaira ?? 0,
      featuredBoostFeeNaira: data.featuredBoostFeeNaira ?? 500,
      vendorSubscriptionSemesterFee: data.vendorSubscriptionSemesterFee ?? 2500,
      platformSupportPhone: data.platformSupportPhone || OFFICIAL_SUPPORT_PHONE,
      platformSupportWhatsApp: data.platformSupportWhatsApp || OFFICIAL_SUPPORT_WHATSAPP,
      allowGuestBrowsing: data.allowGuestBrowsing !== false,
      requireMatricVerificationForSelling: Boolean(data.requireMatricVerificationForSelling),
      maintenanceMode: Boolean(data.maintenanceMode),
      welcomePopupEnabled: data.welcomePopupEnabled !== false,
      welcomePopupTitle: data.welcomePopupTitle || "Welcome to C'IO Mini Campus Marketplace! 🎓",
      welcomePopupMessage: data.welcomePopupMessage || "Welcome to the official University of Ilorin Mini Campus student marketplace! Easily buy and sell textbooks, gadgets, hostel accessories, and student passes. Always inspect items in daylight at Mini Campus Gate or the Student Center before making payment.",
      welcomePopupBadge: data.welcomePopupBadge || "Campus Announcement & Safety Notice",
      welcomePopupActionText: data.welcomePopupActionText || "Explore Marketplace",
      announcementAlert: data.announcementAlert || "Inspect items in daylight at Mini Campus Gate or Student Center before payment.",
      announcementUpdatedAt: data.announcementUpdatedAt || new Date().toISOString(),
    };
  }

  const defaultSettings: PlatformSettings = {
    siteName: "C'IO",
    siteTagline: "University of Ilorin Mini Campus Marketplace",
    siteShortName: "C'IO",
    officialPhone: OFFICIAL_SUPPORT_PHONE,
    listingModerationEnabled: false,
    registrationEnabled: true,
    listingFeeNaira: 0,
    featuredBoostFeeNaira: 500,
    vendorSubscriptionSemesterFee: 2500,
    platformSupportPhone: OFFICIAL_SUPPORT_PHONE,
    platformSupportWhatsApp: OFFICIAL_SUPPORT_WHATSAPP,
    allowGuestBrowsing: true,
    requireMatricVerificationForSelling: false,
    maintenanceMode: false,
    welcomePopupEnabled: true,
    welcomePopupTitle: "Welcome to C'IO Mini Campus Marketplace! 🎓",
    welcomePopupMessage: "Welcome to the official University of Ilorin Mini Campus student marketplace! Easily buy and sell textbooks, gadgets, hostel accessories, and student passes. Always inspect items in daylight at Mini Campus Gate or the Student Center before making payment.",
    welcomePopupBadge: "Campus Announcement & Safety Notice",
    welcomePopupActionText: "Explore Marketplace",
    announcementAlert: "Inspect items in daylight at Mini Campus Gate or Student Center before payment.",
    announcementUpdatedAt: new Date().toISOString(),
  };

  await setDoc(settingDocRef, defaultSettings).catch(() => {});
  return defaultSettings;
}

export function subscribeToPlatformSettings(callback: (settings: PlatformSettings) => void): () => void {
  const settingDocRef = doc(db, 'settings', 'global');
  return onSnapshot(
    settingDocRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as PlatformSettings;
        callback({
          siteName: data.siteName || "C'IO",
          siteTagline: data.siteTagline || "University of Ilorin Mini Campus Marketplace",
          siteShortName: data.siteShortName || "C'IO",
          officialPhone: data.officialPhone || OFFICIAL_SUPPORT_PHONE,
          listingModerationEnabled: Boolean(data.listingModerationEnabled),
          registrationEnabled: data.registrationEnabled !== false,
          listingFeeNaira: data.listingFeeNaira ?? 0,
          featuredBoostFeeNaira: data.featuredBoostFeeNaira ?? 500,
          vendorSubscriptionSemesterFee: data.vendorSubscriptionSemesterFee ?? 2500,
          platformSupportPhone: data.platformSupportPhone || OFFICIAL_SUPPORT_PHONE,
          platformSupportWhatsApp: data.platformSupportWhatsApp || OFFICIAL_SUPPORT_WHATSAPP,
          allowGuestBrowsing: data.allowGuestBrowsing !== false,
          requireMatricVerificationForSelling: Boolean(data.requireMatricVerificationForSelling),
          maintenanceMode: Boolean(data.maintenanceMode),
          welcomePopupEnabled: data.welcomePopupEnabled !== false,
          welcomePopupTitle: data.welcomePopupTitle || "Welcome to C'IO Mini Campus Marketplace! 🎓",
          welcomePopupMessage: data.welcomePopupMessage || "Welcome to the official University of Ilorin Mini Campus student marketplace! Easily buy and sell textbooks, gadgets, hostel accessories, and student passes. Always inspect items in daylight at Mini Campus Gate or the Student Center before making payment.",
          welcomePopupBadge: data.welcomePopupBadge || "Campus Announcement & Safety Notice",
          welcomePopupActionText: data.welcomePopupActionText || "Explore Marketplace",
          announcementAlert: data.announcementAlert || "Inspect items in daylight at Mini Campus Gate or Student Center before payment.",
          announcementUpdatedAt: data.announcementUpdatedAt || new Date().toISOString(),
        });
      } else {
        getPlatformSettings().then(callback).catch(() => {});
      }
    },
    (err) => {
      console.warn('Settings real-time subscription error:', err);
    }
  );
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
  const settingDocRef = doc(db, 'settings', 'global');
  await setDoc(settingDocRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}
