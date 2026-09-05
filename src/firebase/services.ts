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

// Helper: Convert File to Base64 (fallback if Storage CORS or bucket is restricted)
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Upload file to Firebase Storage with reliable base64 fallback
export async function uploadImageFile(path: string, file: File): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn('Firebase Storage upload fell back to local data URL:', err);
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

  // Fetch Firestore profile
  const userSnap = await getDoc(doc(db, 'users', fbUser.uid));
  
  if (userSnap.exists()) {
    const userProfile = userSnap.data() as User;
    if (userProfile.isBanned) {
      await signOut(auth);
      throw new Error('This account has been suspended by campus administration.');
    }
    return userProfile;
  }

  // If profile doesn't exist yet (e.g. admin or created directly in Firebase Auth console)
  const isAdminEmail = fbUser.email?.toLowerCase() === 'admin@unilorinmini.edu.ng';
  const generatedProfile: User = {
    id: fbUser.uid,
    name: fbUser.displayName || (isAdminEmail ? 'System Administrator' : 'Campus User'),
    email: fbUser.email || '',
    phone: OFFICIAL_SUPPORT_PHONE,
    role: isAdminEmail ? 'admin' : 'student',
    campusLocation: 'Academic Complex, Mini Campus',
    isMatricVerified: isAdminEmail,
    isBusinessVerified: false,
    isProMember: false,
    isBanned: false,
    createdAt: new Date().toISOString().split('T')[0],
    avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.email || 'User')}`,
  };

  await setDoc(doc(db, 'users', fbUser.uid), generatedProfile);
  return generatedProfile;
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

  await updateDoc(doc(db, 'users', userId), payload);
  const fresh = await getDoc(doc(db, 'users', userId));
  return fresh.data() as User;
}

export async function getUserProfile(userId: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? (snap.data() as User) : null;
}

// Admin determination helper
export function checkIsAdminUser(user: User | null, fbUser: FirebaseUser | null): boolean {
  if (!user && !fbUser) return false;
  if (user?.role === 'admin') return true;
  if (fbUser?.email?.toLowerCase() === 'admin@unilorinmini.edu.ng') return true;
  return false;
}

// Auth State Subscriber
export function subscribeToAuth(callback: (user: User | null, isAdmin: boolean) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (!fbUser) {
      callback(null, false);
      return;
    }

    try {
      const snap = await getDoc(doc(db, 'users', fbUser.uid));
      let userProfile: User;
      if (snap.exists()) {
        userProfile = snap.data() as User;
      } else {
        const isAdminEmail = fbUser.email?.toLowerCase() === 'admin@unilorinmini.edu.ng';
        userProfile = {
          id: fbUser.uid,
          name: fbUser.displayName || (isAdminEmail ? 'System Administrator' : 'Campus User'),
          email: fbUser.email || '',
          phone: OFFICIAL_SUPPORT_PHONE,
          role: isAdminEmail ? 'admin' : 'student',
          campusLocation: 'Academic Complex, Mini Campus',
          isMatricVerified: isAdminEmail,
          isBusinessVerified: false,
          isProMember: false,
          isBanned: false,
          createdAt: new Date().toISOString().split('T')[0],
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.email || 'User')}`,
        };
        await setDoc(doc(db, 'users', fbUser.uid), userProfile);
      }

      const isAdmin = checkIsAdminUser(userProfile, fbUser);
      callback(userProfile, isAdmin);
    } catch (e) {
      console.error('Error fetching user profile in auth state changed:', e);
      callback(null, false);
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
      const res = await fetch(mainImageUrl);
      const blob = await res.blob();
      const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_listing.jpg`);
      const snap = await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
      mainImageUrl = await getDownloadURL(snap.ref);
    } catch (e) {
      console.warn('Storage upload fallback:', e);
    }
  }

  const extraImages: string[] = productData.additionalImages || [];
  if (additionalFiles && additionalFiles.length > 0) {
    for (const f of additionalFiles) {
      const extraUrl = await uploadImageFile(`products/${user.uid}/${Date.now()}_extra_${f.name}`, f);
      extraImages.push(extraUrl);
    }
  }

  const newDocRef = doc(collection(db, 'products'));
  const newProduct: Listing = {
    id: newDocRef.id,
    title: productData.title || 'Untitled Listing',
    price: Number(productData.price) || 0,
    originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
    category: productData.category || 'Phones & Gadgets',
    description: productData.description || '',
    imageUrl: mainImageUrl,
    additionalImages: extraImages,
    sellerId: user.uid,
    sellerName: productData.sellerName || user.displayName || 'Campus Seller',
    sellerPhone: productData.sellerPhone || OFFICIAL_SUPPORT_PHONE,
    sellerRole: productData.sellerRole || 'student',
    sellerMatricVerified: productData.sellerMatricVerified || false,
    sellerMatricNumber: productData.sellerMatricNumber || '',
    sellerBusinessName: productData.sellerBusinessName || '',
    sellerBusinessVerified: productData.sellerBusinessVerified || false,
    campusLocation: productData.campusLocation || 'Hostel A, Mini Campus',
    condition: productData.condition || 'Like New',
    isSubscription: productData.isSubscription || false,
    subscriptionDuration: productData.subscriptionDuration,
    isFeatured: productData.isFeatured || false,
    isSold: false,
    isExpired: false,
    isApproved: true,
    viewsCount: 1,
    inquiriesCount: 0,
    createdAt: new Date().toISOString().split('T')[0],
    tags: productData.tags || [],
  };

  await setDoc(newDocRef, newProduct);
  return newProduct;
}

export async function updateProductListing(
  productId: string, 
  updates: Partial<Listing>,
  newImageFile?: File
): Promise<void> {
  const updatePayload: Record<string, any> = { ...updates };

  if (newImageFile) {
    const user = auth.currentUser;
    const uid = user ? user.uid : 'admin';
    updatePayload.imageUrl = await uploadImageFile(`products/${uid}/${Date.now()}_${newImageFile.name}`, newImageFile);
  } else if (updatePayload.imageUrl && typeof updatePayload.imageUrl === 'string' && updatePayload.imageUrl.startsWith('data:image/')) {
    try {
      const user = auth.currentUser;
      const uid = user ? user.uid : 'admin';
      const res = await fetch(updatePayload.imageUrl);
      const blob = await res.blob();
      const storageRef = ref(storage, `products/${uid}/${Date.now()}_listing.jpg`);
      const snap = await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
      updatePayload.imageUrl = await getDownloadURL(snap.ref);
    } catch (e) {
      console.warn('Storage upload fallback:', e);
    }
  }

  await updateDoc(doc(db, 'products', productId), updatePayload);
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

  await setDoc(newDocRef, ticket);
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
    users.push({ ...docSnap.data(), id: docSnap.id } as User);
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
  await updateDoc(doc(db, 'users', userId), { isBanned });
}

export async function removeUserAccount(userId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId));
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const settingDocRef = doc(db, 'settings', 'global');
  const snap = await getDoc(settingDocRef);

  if (snap.exists()) {
    return snap.data() as PlatformSettings;
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

  await setDoc(settingDocRef, defaultSettings).catch(() => {});
  return defaultSettings;
}

export async function updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<void> {
  const settingDocRef = doc(db, 'settings', 'global');
  await setDoc(settingDocRef, settings, { merge: true });
}
