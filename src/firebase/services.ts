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
  increment,
  limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './config';
import { User, Listing, ComplaintTicket, PlatformSettings, UserRole, SiteHeaderSettings, DEFAULT_HEADER_SETTINGS } from '../types';
import { OFFICIAL_SUPPORT_PHONE, OFFICIAL_SUPPORT_WHATSAPP } from '../data/mockData';

// -------------------------------------------------------------
// CLIENT-SIDE TTL CACHING STORES (Massively reduces Firestore reads)
// -------------------------------------------------------------
export const PRODUCTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const USER_PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
export const SETTINGS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes
export const USERS_LIST_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

let _productsMemoryCache: Listing[] | null = null;
let _productsCacheTimestamp = 0;

const _userProfileMemoryCache = new Map<string, { profile: User; timestamp: number }>();

let _platformSettingsCache: PlatformSettings | null = null;
let _platformSettingsCacheTimestamp = 0;

let _siteHeaderSettingsCache: SiteHeaderSettings | null = null;
let _siteHeaderSettingsCacheTimestamp = 0;

let _allUsersCache: User[] | null = null;
let _allUsersCacheTimestamp = 0;

export function invalidateProductsCache(): void {
  _productsMemoryCache = null;
  _productsCacheTimestamp = 0;
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem('cio_products_cache_time');
    } catch {}
  }
}

export function updateProductInLocalCache(updatedProduct: Partial<Listing> & { id: string }): void {
  if (_productsMemoryCache) {
    _productsMemoryCache = _productsMemoryCache.map((p) => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem('cio_cached_products');
      if (cached) {
        let list: Listing[] = JSON.parse(cached);
        if (Array.isArray(list)) {
          list = list.map((p) => (p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p));
          localStorage.setItem('cio_cached_products', JSON.stringify(list));
        }
      }
    } catch {}
  }
}

export function addProductToLocalCache(newProduct: Listing): void {
  if (_productsMemoryCache) {
    _productsMemoryCache = [newProduct, ..._productsMemoryCache.filter((p) => p.id !== newProduct.id)];
  } else {
    _productsMemoryCache = [newProduct];
  }
  _productsCacheTimestamp = Date.now();
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem('cio_cached_products');
      let list: Listing[] = cached ? JSON.parse(cached) : [];
      if (Array.isArray(list)) {
        list = [newProduct, ...list.filter((p) => p.id !== newProduct.id)];
        localStorage.setItem('cio_cached_products', JSON.stringify(list));
        localStorage.setItem('cio_products_cache_time', Date.now().toString());
      }
    } catch {}
  }
}

export function removeProductFromLocalCache(productId: string): void {
  if (_productsMemoryCache) {
    _productsMemoryCache = _productsMemoryCache.filter((p) => p.id !== productId);
  }
  if (typeof localStorage !== 'undefined') {
    try {
      const cached = localStorage.getItem('cio_cached_products');
      if (cached) {
        let list: Listing[] = JSON.parse(cached);
        if (Array.isArray(list)) {
          list = list.filter((p) => p.id !== productId);
          localStorage.setItem('cio_cached_products', JSON.stringify(list));
        }
      }
    } catch {}
  }
}

export function updateCachedUserProfile(userId: string, updates: Partial<User>): void {
  const existing = _userProfileMemoryCache.get(userId);
  if (existing) {
    _userProfileMemoryCache.set(userId, {
      profile: { ...existing.profile, ...updates },
      timestamp: Date.now(),
    });
  }
}

export function invalidateAllUsersCache(): void {
  _allUsersCache = null;
  _allUsersCacheTimestamp = 0;
}

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

export function isFirestoreQuotaError(err: unknown): boolean {
  if (!err) return false;
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as any)?.code || '';
  return (
    code === 'resource-exhausted' ||
    msg.includes('Quota limit exceeded') ||
    msg.includes('Quota exceeded') ||
    msg.includes('Free daily read units') ||
    msg.includes('resource-exhausted')
  );
}

export function notifyQuotaExceeded(err?: unknown): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('cio_quota_exceeded_timestamp', Date.now().toString());
    } catch {}
    window.dispatchEvent(new CustomEvent('cio_firestore_quota_exceeded', { detail: err }));
  }
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
  try {
    await updateDoc(doc(db, 'users', userId), safePayload);
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('updateUserProfile firestore update notice:', err);
  }

  const existingProfile = _userProfileMemoryCache.get(userId)?.profile;
  const merged: User = {
    ...(existingProfile || ({} as User)),
    id: userId,
    ...payload,
  } as User;
  _userProfileMemoryCache.set(userId, { profile: merged, timestamp: Date.now() });
  return merged;
}

export async function getUserProfile(userId: string, forceRefresh = false): Promise<User | null> {
  const now = Date.now();
  if (!forceRefresh) {
    const cached = _userProfileMemoryCache.get(userId);
    if (cached && (now - cached.timestamp < USER_PROFILE_CACHE_TTL)) {
      return cached.profile;
    }
  }

  try {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // If current auth user matches this ID and is admin, build temporary profile
      const current = auth.currentUser;
      if (current && current.uid === userId && isPrimaryAdminEmail(current.email)) {
        const adminProfile: User = {
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
        _userProfileMemoryCache.set(userId, { profile: adminProfile, timestamp: now });
        return adminProfile;
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
    _userProfileMemoryCache.set(userId, { profile: data, timestamp: now });
    return data;
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('getUserProfile offline/fetch fallback:', err);
    // Return cached if available
    const cached = _userProfileMemoryCache.get(userId);
    if (cached) return cached.profile;

    const current = auth.currentUser;
    if (current && current.uid === userId) {
      const isPrimary = isPrimaryAdminEmail(current.email);
      const fallbackUser: User = {
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
      _userProfileMemoryCache.set(userId, { profile: fallbackUser, timestamp: now });
      return fallbackUser;
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
      _userProfileMemoryCache.set(userProfile.id, { profile: userProfile, timestamp: Date.now() });
      callback(userProfile, isAdmin);
    } catch (e) {
      if (isFirestoreQuotaError(e)) {
        notifyQuotaExceeded(e);
        console.warn('Daily read quota reached during auth user profile fetch; serving fallback profile.');
      } else {
        console.warn('Notice fetching user profile in auth state changed:', e);
      }
      _userProfileMemoryCache.set(fallbackProfile.id, { profile: fallbackProfile, timestamp: Date.now() });
      callback(fallbackProfile, isPrimary);
    }
  });
}

// -------------------------------------------------------------
// 2. PRODUCTS (MARKETPLACE LISTINGS)
// -------------------------------------------------------------

export function subscribeToProducts(callback: (products: Listing[]) => void): () => void {
  const colRef = collection(db, 'products');
  try {
    return onSnapshot(
      query(colRef, limit(150)),
      (snapshot) => {
        const list: Listing[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Listing);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        _productsMemoryCache = list;
        _productsCacheTimestamp = Date.now();
        if (typeof localStorage !== 'undefined' && list.length > 0) {
          try {
            localStorage.setItem('cio_cached_products', JSON.stringify(list));
            localStorage.setItem('cio_products_cache_time', Date.now().toString());
          } catch {}
        }
        callback(list);
      },
      (error) => {
        if (isFirestoreQuotaError(error)) {
          notifyQuotaExceeded(error);
          console.warn('Firestore read quota exceeded: Serving cached products to maintain marketplace availability.');
        } else {
          console.warn('Firestore products subscription notice:', error);
        }
        // Emit cached listings so the UI does not stay blank
        if (_productsMemoryCache && _productsMemoryCache.length > 0) {
          callback(_productsMemoryCache);
          return;
        }
        if (typeof localStorage !== 'undefined') {
          try {
            const cached = localStorage.getItem('cio_cached_products');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                callback(parsed);
              }
            }
          } catch {}
        }
      }
    );
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    return () => {};
  }
}

export async function fetchProductsOnce(forceRefresh = false): Promise<Listing[]> {
  const now = Date.now();

  // 1. Instant return from in-memory cache if fresh (< 5 mins)
  if (!forceRefresh && _productsMemoryCache && (now - _productsCacheTimestamp < PRODUCTS_CACHE_TTL)) {
    return _productsMemoryCache;
  }

  // 2. Instant return from localStorage cache if fresh
  if (!forceRefresh && typeof localStorage !== 'undefined') {
    try {
      const timeStr = localStorage.getItem('cio_products_cache_time');
      const cached = localStorage.getItem('cio_cached_products');
      if (timeStr && cached) {
        const cachedTime = Number(timeStr);
        if (!isNaN(cachedTime) && (now - cachedTime < PRODUCTS_CACHE_TTL)) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            _productsMemoryCache = parsed;
            _productsCacheTimestamp = cachedTime;
            return parsed;
          }
        }
      }
    } catch {}
  }

  // 3. Read from Firestore using bounded limit(150)
  try {
    const q = query(collection(db, 'products'), limit(150));
    const snapshot = await getDocs(q);
    const list: Listing[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Listing);
    });
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    _productsMemoryCache = list;
    _productsCacheTimestamp = now;

    if (typeof localStorage !== 'undefined' && list.length > 0) {
      try {
        localStorage.setItem('cio_cached_products', JSON.stringify(list));
        localStorage.setItem('cio_products_cache_time', now.toString());
      } catch {}
    }
    return list;
  } catch (err: any) {
    if (isFirestoreQuotaError(err)) {
      notifyQuotaExceeded(err);
      console.warn('Firestore read quota reached. Falling back to cached products.');
    } else {
      console.warn('Firestore fetchProductsOnce notice:', err);
    }
    // Fallback to memory cache
    if (_productsMemoryCache && _productsMemoryCache.length > 0) {
      return _productsMemoryCache;
    }
    // 1. Try local storage cache
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem('cio_cached_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    // 2. Try server API
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const serverProds = await res.json();
        if (Array.isArray(serverProds) && serverProds.length > 0) {
          return serverProds;
        }
      }
    } catch {}
    return [];
  }
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

  const safeData = sanitizeForFirestore(newProductPayload) as Listing;
  try {
    await setDoc(newDocRef, safeData);
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('Firestore setDoc notice for new product:', err);
  }

  // Also cache to memory and localStorage so it is immediately visible even in offline/quota-exceeded mode
  addProductToLocalCache(safeData);

  // Also push to local Express backend /api/products
  try {
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeData),
    }).catch(() => {});
  } catch {}

  return safeData;
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

  // Update local memory and persistent cache
  updateProductInLocalCache({ ...updates, id: productId });

  try {
    const safePayload = sanitizeForFirestore(updatePayload);
    await updateDoc(doc(db, 'products', productId), safePayload);
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('Firestore updateDoc notice for product:', err);
  }
}

export async function deleteProductListing(productId: string): Promise<void> {
  // Update local memory and persistent cache
  removeProductFromLocalCache(productId);

  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('Firestore deleteDoc notice for product:', err);
  }
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
  const localCacheKey = `cio_user_favs_${userId}`;
  let cachedFavs: string[] = [];
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(localCacheKey) || localStorage.getItem('cio_favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) cachedFavs = parsed;
      }
    } catch {}
  }

  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'favorites'));
    const favIds: string[] = [];
    snapshot.forEach((d) => favIds.push(d.id));
    if (typeof localStorage !== 'undefined' && favIds.length > 0) {
      try {
        localStorage.setItem(localCacheKey, JSON.stringify(favIds));
      } catch {}
    }
    return favIds.length > 0 ? favIds : cachedFavs;
  } catch (e: any) {
    if (isFirestoreQuotaError(e)) {
      notifyQuotaExceeded(e);
      console.warn('Daily read quota reached while fetching favorites; using cached favorites.');
    } else {
      console.warn('Notice fetching favorites from Firestore:', e);
    }
    return cachedFavs;
  }
}

export async function toggleUserFavorite(userId: string, productId: string, shouldFavorite: boolean): Promise<void> {
  // Synchronize local cache first
  const localCacheKey = `cio_user_favs_${userId}`;
  if (typeof localStorage !== 'undefined') {
    try {
      const stored = localStorage.getItem(localCacheKey);
      let favs: string[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(favs)) favs = [];
      if (shouldFavorite) {
        if (!favs.includes(productId)) favs.push(productId);
      } else {
        favs = favs.filter((id) => id !== productId);
      }
      localStorage.setItem(localCacheKey, JSON.stringify(favs));
    } catch {}
  }

  try {
    const favDocRef = doc(db, 'users', userId, 'favorites', productId);
    if (shouldFavorite) {
      await setDoc(favDocRef, { productId, savedAt: new Date().toISOString() });
    } else {
      await deleteDoc(favDocRef);
    }
  } catch (e: any) {
    if (isFirestoreQuotaError(e)) {
      notifyQuotaExceeded(e);
      console.warn('Firestore quota reached while toggling favorite; saved locally.');
    } else {
      console.warn('Notice updating favorite in Firestore:', e);
    }
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
      if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
      console.warn('Complaints subscription notice:', err);
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

export async function fetchAllUsers(forceRefresh = false): Promise<User[]> {
  const now = Date.now();
  if (!forceRefresh && _allUsersCache && (now - _allUsersCacheTimestamp < USERS_LIST_CACHE_TTL)) {
    return _allUsersCache;
  }

  try {
    const q = query(collection(db, 'users'), limit(150));
    const snapshot = await getDocs(q);
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
    _allUsersCache = users;
    _allUsersCacheTimestamp = now;
    return users;
  } catch (err: any) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('fetchAllUsers fallback to server /api/admin/users:', err);
    if (_allUsersCache && _allUsersCache.length > 0) return _allUsersCache;
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('cio_admin_token') || 'admin' : 'admin';
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-token': token },
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return [];
  }
}

export async function setStudentMatricVerification(userId: string, isVerified: boolean): Promise<void> {
  // Update user profile in Firestore
  await updateDoc(doc(db, 'users', userId), { isMatricVerified: isVerified });
  updateCachedUserProfile(userId, { isMatricVerified: isVerified });
  if (_allUsersCache) {
    _allUsersCache = _allUsersCache.map((u) => (u.id === userId ? { ...u, isMatricVerified: isVerified } : u));
  }

  // Synchronously update all listings by this seller
  const q = query(collection(db, 'products'), where('sellerId', '==', userId));
  const snap = await getDocs(q);
  const updates = snap.docs.map((docSnap) =>
    updateDoc(docSnap.ref, { sellerMatricVerified: isVerified })
  );
  await Promise.all(updates);

  // Also update local products cache
  if (_productsMemoryCache) {
    _productsMemoryCache = _productsMemoryCache.map((p) => (p.sellerId === userId ? { ...p, sellerMatricVerified: isVerified } : p));
  }
}

export async function setAccountBanStatus(userId: string, isBanned: boolean): Promise<void> {
  const cached = _userProfileMemoryCache.get(userId)?.profile;
  if (cached && (isPrimaryAdminEmail(cached.email) || cached.role === 'admin' || cached.role === 'super_admin')) {
    if (isBanned) {
      throw new Error('The primary administrator account cannot be suspended.');
    }
  }

  const userRef = doc(db, 'users', userId);
  if (!cached) {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as User;
      if (isPrimaryAdminEmail(data.email) || data.role === 'admin' || data.role === 'super_admin') {
        if (isBanned) {
          throw new Error('The primary administrator account cannot be suspended.');
        }
      }
    }
  }

  await updateDoc(userRef, { isBanned });
  updateCachedUserProfile(userId, { isBanned });
  if (_allUsersCache) {
    _allUsersCache = _allUsersCache.map((u) => (u.id === userId ? { ...u, isBanned } : u));
  }
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
  _userProfileMemoryCache.delete(userId);
  if (_allUsersCache) {
    _allUsersCache = _allUsersCache.filter((u) => u.id !== userId);
  }
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
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('Admin account synchronization note:', err);
  }
}

export const restoreAdminAccount = syncAndMigrateAdminAccounts;

export async function getPlatformSettings(forceRefresh = false): Promise<PlatformSettings> {
  const now = Date.now();
  if (!forceRefresh && _platformSettingsCache && (now - _platformSettingsCacheTimestamp < SETTINGS_CACHE_TTL)) {
    return _platformSettingsCache;
  }

  const defaultSettings: PlatformSettings = {
    siteName: "C'IO — University of Ilorin Mini Campus Marketplace",
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
  };

  try {
    const settingDocRef = doc(db, 'settings', 'global');
    const snap = await getDoc(settingDocRef);

    if (snap.exists()) {
      const data = snap.data() as PlatformSettings;
      _platformSettingsCache = data;
      _platformSettingsCacheTimestamp = now;
      return data;
    }

    await setDoc(settingDocRef, defaultSettings).catch(() => {});
    _platformSettingsCache = defaultSettings;
    _platformSettingsCacheTimestamp = now;
    return defaultSettings;
  } catch (err: any) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('getPlatformSettings fallback to defaults:', err);
    return _platformSettingsCache || defaultSettings;
  }
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
  try {
    const settingDocRef = doc(db, 'settings', 'global');
    await setDoc(settingDocRef, settings, { merge: true });
    if (_platformSettingsCache) {
      _platformSettingsCache = { ..._platformSettingsCache, ...settings };
      _platformSettingsCacheTimestamp = Date.now();
    }
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('updatePlatformSettings notice:', err);
  }
}

// 6. WEBSITE SETTINGS (HEADER & BRANDING)
export async function getSiteHeaderSettings(forceRefresh = false): Promise<SiteHeaderSettings> {
  const now = Date.now();
  if (!forceRefresh && _siteHeaderSettingsCache && (now - _siteHeaderSettingsCacheTimestamp < SETTINGS_CACHE_TTL)) {
    return _siteHeaderSettingsCache;
  }

  try {
    const headerDocRef = doc(db, 'siteSettings', 'header');
    const snap = await getDoc(headerDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const merged: SiteHeaderSettings = {
        ...DEFAULT_HEADER_SETTINGS,
        ...data,
        navMenuNames: {
          ...DEFAULT_HEADER_SETTINGS.navMenuNames,
          ...(data.navMenuNames || {}),
        },
      };
      _siteHeaderSettingsCache = merged;
      _siteHeaderSettingsCacheTimestamp = now;
      return merged;
    }

    // Initialize document in Firestore if not existing
    await setDoc(headerDocRef, sanitizeForFirestore(DEFAULT_HEADER_SETTINGS)).catch((e) => {
      console.warn('Could not bootstrap default header settings in Firestore:', e);
    });
    _siteHeaderSettingsCache = DEFAULT_HEADER_SETTINGS;
    _siteHeaderSettingsCacheTimestamp = now;
    return DEFAULT_HEADER_SETTINGS;
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('Error reading header settings from Firestore (serving defaults):', err);
    return _siteHeaderSettingsCache || DEFAULT_HEADER_SETTINGS;
  }
}

export async function updateSiteHeaderSettings(
  settings: Partial<SiteHeaderSettings>,
  adminEmail?: string
): Promise<SiteHeaderSettings> {
  try {
    const headerDocRef = doc(db, 'siteSettings', 'header');
    const payload = sanitizeForFirestore({
      ...settings,
      updatedAt: new Date().toISOString(),
      ...(adminEmail ? { updatedBy: adminEmail } : {}),
    });
    await setDoc(headerDocRef, payload, { merge: true });
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('updateSiteHeaderSettings notice:', err);
  }
  const merged: SiteHeaderSettings = {
    ...(_siteHeaderSettingsCache || DEFAULT_HEADER_SETTINGS),
    ...settings,
  };
  _siteHeaderSettingsCache = merged;
  _siteHeaderSettingsCacheTimestamp = Date.now();
  return merged;
}

export async function resetSiteHeaderSettings(adminEmail?: string): Promise<SiteHeaderSettings> {
  try {
    const headerDocRef = doc(db, 'siteSettings', 'header');
    const payload = sanitizeForFirestore({
      ...DEFAULT_HEADER_SETTINGS,
      updatedAt: new Date().toISOString(),
      ...(adminEmail ? { updatedBy: adminEmail } : {}),
    });
    await setDoc(headerDocRef, payload);
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('resetSiteHeaderSettings notice:', err);
  }
  _siteHeaderSettingsCache = DEFAULT_HEADER_SETTINGS;
  _siteHeaderSettingsCacheTimestamp = Date.now();
  return DEFAULT_HEADER_SETTINGS;
}

export function subscribeToSiteHeaderSettings(
  callback: (settings: SiteHeaderSettings) => void
): () => void {
  try {
    const headerDocRef = doc(db, 'siteSettings', 'header');
    return onSnapshot(
      headerDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callback({
            ...DEFAULT_HEADER_SETTINGS,
            ...data,
            navMenuNames: {
              ...DEFAULT_HEADER_SETTINGS.navMenuNames,
              ...(data.navMenuNames || {}),
            },
          });
        } else {
          callback(DEFAULT_HEADER_SETTINGS);
        }
      },
      (err) => {
        if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
        console.warn('Real-time header settings subscription notice:', err);
      }
    );
  } catch (err) {
    if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
    console.warn('Could not setup onSnapshot for siteSettings:', err);
    return () => {};
  }
}

