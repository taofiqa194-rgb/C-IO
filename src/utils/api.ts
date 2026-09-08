import { User, Listing, ComplaintTicket, PlatformSettings, SiteHeaderSettings, DEFAULT_HEADER_SETTINGS } from '../types';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  resetUserPassword,
  updateUserProfile,
  getUserProfile,
  checkIsAdminUser,
  PRIMARY_ADMIN_EMAIL,
  isPrimaryAdminEmail,
  isFirestoreQuotaError,
  notifyQuotaExceeded,
  fetchProductsOnce,
  createProductListing,
  updateProductListing,
  deleteProductListing,
  toggleProductListingSold,
  toggleProductListingFeatured,
  recordProductView,
  recordProductInquiry,
  getUserFavorites as fetchUserFavoritesFromFirestore,
  toggleUserFavorite as toggleFavoriteInFirestore,
  submitSupportComplaint,
  replyToComplaint,
  deleteComplaintTicket,
  fetchAllUsers,
  setStudentMatricVerification,
  setAccountBanStatus,
  removeUserAccount,
  getPlatformSettings as fetchPlatformSettings,
  updatePlatformSettings as savePlatformSettings,
  getSiteHeaderSettings as fetchSiteHeaderSettings,
  updateSiteHeaderSettings as saveSiteHeaderSettings,
  resetSiteHeaderSettings as resetHeaderSettingsInFirestore,
  subscribeToSiteHeaderSettings,
} from '../firebase/services';
import { DEFAULT_CAMPUS_LISTINGS } from '../data/mockData';
import { auth, db } from '../firebase/config';
import { collection, getDocs, query, where, doc, getDoc, setDoc, limit } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

let _reportsCache: ComplaintTicket[] | null = null;
let _reportsCacheTimestamp = 0;
const REPORTS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export const api = {
  // -------------------------------------------------------------
  // Platform Settings
  // -------------------------------------------------------------
  async getSettings(): Promise<PlatformSettings> {
    try {
      const firestoreSettings = await fetchPlatformSettings();
      return firestoreSettings;
    } catch (e) {
      console.warn('Failed to load settings from Firestore, returning defaults:', e);
      return {
        siteName: "C'IO — University of Ilorin Mini Campus Marketplace",
        officialPhone: '09076930244',
        listingModerationEnabled: false,
        registrationEnabled: true,
        listingFeeNaira: 0,
        featuredBoostFeeNaira: 500,
        vendorSubscriptionSemesterFee: 2500,
        platformSupportPhone: '09076930244',
        platformSupportWhatsApp: '2349076930244',
        allowGuestBrowsing: true,
        requireMatricVerificationForSelling: false,
        maintenanceMode: false,
        announcementEnabled: true,
        announcementTitle: "Official Campus Announcement: Verified Student Marketplace Guidelines",
        announcementMessage: "Welcome to C'IO! To ensure safe transactions across the University of Ilorin Mini Campus, inspect all items in daylight at the Mini Campus Gate or Student Center before making payment. Always verify student credentials with the official verified badge.",
        announcementType: 'verified',
        announcementCategory: 'Official Notice',
        announcementDate: 'Current Semester Notice',
        verifiedBadgeColor: 'blue',
      };
    }
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    try {
      await savePlatformSettings(settings);
    } catch (e) {
      console.warn('Could not save settings to Firestore:', e);
    }

    // Also sync to Express backend if admin session exists
    const token = localStorage.getItem('cio_admin_token');
    if (token) {
      try {
        await fetch('/api/admin/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        });
      } catch (err) {
        console.warn('Could not sync settings to /api/admin/settings:', err);
      }
    }

    return await this.getSettings();
  },

  // -------------------------------------------------------------
  // Website Header & Branding Settings (Firestore siteSettings/header)
  // -------------------------------------------------------------
  async getHeaderSettings(): Promise<SiteHeaderSettings> {
    try {
      return await fetchSiteHeaderSettings();
    } catch (e) {
      console.warn('Failed to load header settings from Firestore, returning defaults:', e);
      return DEFAULT_HEADER_SETTINGS;
    }
  },

  async updateHeaderSettings(settings: Partial<SiteHeaderSettings>, adminEmail?: string): Promise<SiteHeaderSettings> {
    const updated = await saveSiteHeaderSettings(settings, adminEmail);
    return updated;
  },

  async resetHeaderSettings(adminEmail?: string): Promise<SiteHeaderSettings> {
    return await resetHeaderSettingsInFirestore(adminEmail);
  },

  subscribeToHeaderSettings(callback: (settings: SiteHeaderSettings) => void): () => void {
    return subscribeToSiteHeaderSettings(callback);
  },

  // -------------------------------------------------------------
  // User Authentication
  // -------------------------------------------------------------
  async register(userData: any): Promise<{ user: User; token: string }> {
    try {
      const user = await registerUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        role: userData.role,
        campusLocation: userData.campusLocation,
        matricNumber: userData.matricNumber,
        faculty: userData.faculty,
        department: userData.department,
        businessName: userData.businessName,
        avatarUrl: userData.avatarUrl,
      });
      localStorage.setItem('cio_user_id', user.id);
      return { user, token: user.id };
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Email/Password sign-in is disabled in your Firebase console. Please go to Firebase Console > Authentication > Sign-in method and enable "Email/Password".'
        );
      }
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email address already exists. Please log in instead.');
      }
      if (error.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters long.');
      }
      throw new Error(error.message || 'Registration failed');
    }
  },

  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    let emailToUse = identifier.trim();

    // If user provided a phone number instead of email, look up their email in Firestore
    if (!identifier.includes('@')) {
      try {
        const q = query(collection(db, 'users'), where('phone', '==', identifier.trim()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const u = snap.docs[0].data() as User;
          if (u.email) emailToUse = u.email;
        } else {
          // If not found by phone, check matric number
          const qMatric = query(collection(db, 'users'), where('matricNumber', '==', identifier.trim()));
          const snapMatric = await getDocs(qMatric);
          if (!snapMatric.empty) {
            const u = snapMatric.docs[0].data() as User;
            if (u.email) emailToUse = u.email;
          }
        }
      } catch {
        // Fallback
      }
    }

    try {
      const user = await loginUser(emailToUse, password);
      localStorage.setItem('cio_user_id', user.id);
      return { user, token: user.id };
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Email/Password sign-in is disabled in your Firebase console. Please go to Firebase Console > Authentication > Sign-in method and enable "Email/Password".'
        );
      }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      }
      if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      }
      throw new Error(error.message || 'Login failed');
    }
  },

  async logout(): Promise<void> {
    await logoutUser().catch(() => {});
    localStorage.removeItem('cio_user_id');
    localStorage.removeItem('cio_admin_token');
  },

  async resetPassword(email: string): Promise<void> {
    try {
      await resetUserPassword(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('No user found with this email address.');
      }
      throw new Error(error.message || 'Failed to send password reset email.');
    }
  },

  async getMe(): Promise<User | null> {
    const currentFbUser = auth.currentUser;
    if (currentFbUser) {
      return await getUserProfile(currentFbUser.uid);
    }
    const savedUserId = localStorage.getItem('cio_user_id');
    if (savedUserId) {
      return await getUserProfile(savedUserId);
    }
    return null;
  },

  async updateProfile(profileData: Partial<User>, avatarFile?: File): Promise<User> {
    const currentFbUser = auth.currentUser;
    const userId = currentFbUser ? currentFbUser.uid : (profileData.id || localStorage.getItem('cio_user_id'));
    if (!userId) throw new Error('You must be logged in to update your profile');
    return await updateUserProfile(userId, profileData, avatarFile);
  },

  // -------------------------------------------------------------
  // Administrator Authentication
  // -------------------------------------------------------------
  async adminLogin(usernameOrEmail: string, password: string): Promise<{ token: string; admin: User }> {
    const trimmed = usernameOrEmail.trim().toLowerCase();
    const adminEmail = trimmed.includes('@') ? trimmed : PRIMARY_ADMIN_EMAIL;

    try {
      const userProfile = await loginUser(adminEmail, password);
      const isAuthAdmin = checkIsAdminUser(userProfile, auth.currentUser);

      if (!isAuthAdmin && userProfile.role !== 'admin' && userProfile.role !== 'super_admin') {
        await logoutUser();
        throw new Error('Access denied: This account does not possess administrator privileges.');
      }

      localStorage.setItem('cio_admin_token', userProfile.id);
      return { token: userProfile.id, admin: userProfile };
    } catch (error: any) {
      // Check server API authentication endpoint as resilient fallback
      try {
        const resp = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ usernameOrEmail: trimmed, password }),
        });
        if (resp.ok) {
          const srvData = await resp.json();
          const fallbackAdmin: User = {
            id: srvData.token || 'admin-local',
            name: 'Campus Marketplace Administrator',
            email: srvData.admin?.email || adminEmail,
            phone: '09076930244',
            role: 'admin',
            campusLocation: 'University of Ilorin Mini Campus',
            isMatricVerified: true,
            isBusinessVerified: true,
            isProMember: false,
            isBanned: false,
            createdAt: new Date().toISOString().split('T')[0],
            avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
          };
          localStorage.setItem('cio_admin_token', fallbackAdmin.id);
          return { token: fallbackAdmin.id, admin: fallbackAdmin };
        }
      } catch {
        // Fall through to standard error handling
      }

      if (error.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Email/Password sign-in is disabled in your Firebase console. Please go to Firebase Console > Authentication > Sign-in method and enable "Email/Password".'
        );
      }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        // Attempt first-time admin initialization if the primary admin account has not yet been provisioned in Firebase Auth
        if (isPrimaryAdminEmail(adminEmail)) {
          try {
            const adminUser = await registerUser({
              name: 'Campus Marketplace Administrator',
              email: adminEmail,
              password: password,
              phone: '09076930244',
              role: 'admin',
              campusLocation: 'University of Ilorin Mini Campus',
            });
            localStorage.setItem('cio_admin_token', adminUser.id);
            return { token: adminUser.id, admin: adminUser };
          } catch (initErr: any) {
            if (initErr.code === 'auth/operation-not-allowed') {
              throw new Error(
                'Email/Password sign-in is disabled in your Firebase console. Please go to Firebase Console > Authentication > Sign-in method and enable "Email/Password".'
              );
            }
          }
        }
        throw new Error('Invalid administrator credentials. Access denied.');
      }
      throw new Error(error.message || 'Admin authentication failed');
    }
  },

  async adminLogout(): Promise<void> {
    await logoutUser().catch(() => {});
    localStorage.removeItem('cio_admin_token');
  },

  async verifyAdmin(): Promise<boolean> {
    const currentFbUser = auth.currentUser;
    if (!currentFbUser) {
      const token = localStorage.getItem('cio_admin_token');
      if (!token) return false;
      const profile = await getUserProfile(token);
      return profile?.role === 'admin' || profile?.role === 'super_admin' || isPrimaryAdminEmail(profile?.email);
    }
    const profile = await getUserProfile(currentFbUser.uid);
    return checkIsAdminUser(profile, currentFbUser);
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No administrator is currently signed in');

    try {
      const cred = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPassword);
      return { success: true, message: 'Admin password updated successfully' };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update administrator password');
    }
  },

  // -------------------------------------------------------------
  // Admin User Management
  // -------------------------------------------------------------
  async getAdminUsers(): Promise<User[]> {
    return await fetchAllUsers();
  },

  async suspendUser(userId: string): Promise<User> {
    const user = await getUserProfile(userId);
    if (user && (isPrimaryAdminEmail(user.email) || user.role === 'admin' || user.role === 'super_admin')) {
      throw new Error('The primary administrator account cannot be suspended.');
    }
    await setAccountBanStatus(userId, true);
    const updated = await getUserProfile(userId);
    if (!updated) throw new Error('User not found');
    return updated;
  },

  async unsuspendUser(userId: string): Promise<User> {
    await setAccountBanStatus(userId, false);
    const updated = await getUserProfile(userId);
    if (!updated) throw new Error('User not found');
    return updated;
  },

  async deleteUser(userId: string): Promise<void> {
    const user = await getUserProfile(userId);
    if (user && (isPrimaryAdminEmail(user.email) || user.role === 'admin' || user.role === 'super_admin')) {
      throw new Error('The primary administrator account cannot be deleted.');
    }
    await removeUserAccount(userId);
  },

  async verifyUserMatric(userId: string, isVerified: boolean): Promise<User> {
    await setStudentMatricVerification(userId, isVerified);
    const updated = await getUserProfile(userId);
    if (!updated) throw new Error('User not found');
    return updated;
  },

  // -------------------------------------------------------------
  // Marketplace Products
  // -------------------------------------------------------------
  async getProducts(forceRefresh = false): Promise<Listing[]> {
    try {
      const prods = await fetchProductsOnce(forceRefresh);
      if (prods && prods.length > 0) {
        return prods;
      }
    } catch (e) {
      console.warn('getProducts error:', e);
    }
    // Fallback to cache or realistic defaults
    if (typeof localStorage !== 'undefined') {
      try {
        const cached = localStorage.getItem('cio_cached_products');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return DEFAULT_CAMPUS_LISTINGS;
  },

  async createProduct(productData: Partial<Listing>, imageFile?: File): Promise<Listing> {
    return await createProductListing(productData, imageFile);
  },

  async updateProduct(id: string, productData: Partial<Listing>, _isAdmin = false, newImageFile?: File): Promise<Listing> {
    await updateProductListing(id, productData, newImageFile);
    return { id, ...productData } as Listing;
  },

  async deleteProduct(id: string, _isAdmin = false): Promise<void> {
    await deleteProductListing(id);
  },

  async updateProductStatus(
    id: string, 
    statusData: { isExpired?: boolean; isSold?: boolean; isFeatured?: boolean; isApproved?: boolean }, 
    _isAdmin = false
  ): Promise<Listing> {
    await updateProductListing(id, statusData);
    return { id, ...statusData } as Listing;
  },

  async recordInquiry(id: string): Promise<void> {
    await recordProductInquiry(id);
  },

  async recordView(id: string): Promise<void> {
    await recordProductView(id);
  },

  // -------------------------------------------------------------
  // User Saved Favorites (Stored in Firestore)
  // -------------------------------------------------------------
  async getUserFavorites(userId: string): Promise<string[]> {
    return await fetchUserFavoritesFromFirestore(userId);
  },

  async toggleFavorite(userId: string, productId: string, isFav: boolean): Promise<void> {
    await toggleFavoriteInFirestore(userId, productId, isFav);
  },

  // -------------------------------------------------------------
  // Reports / Support Complaints
  // -------------------------------------------------------------
  async getReports(_isAdmin = false, forceRefresh = false): Promise<ComplaintTicket[]> {
    const now = Date.now();
    if (!forceRefresh && _reportsCache && (now - _reportsCacheTimestamp < REPORTS_CACHE_TTL)) {
      return _reportsCache;
    }

    try {
      const q = query(collection(db, 'complaints'), limit(100));
      const snapshot = await getDocs(q);
      const tickets: ComplaintTicket[] = [];
      snapshot.forEach((d) => tickets.push({ ...d.data(), id: d.id } as ComplaintTicket));
      tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      _reportsCache = tickets;
      _reportsCacheTimestamp = now;
      return tickets;
    } catch (err) {
      if (isFirestoreQuotaError(err)) notifyQuotaExceeded(err);
      console.warn('Failed to load reports from Firestore:', err);
      return _reportsCache || [];
    }
  },

  async submitReport(reportData: Partial<ComplaintTicket>): Promise<ComplaintTicket> {
    const ticket = await submitSupportComplaint(reportData);
    if (_reportsCache) {
      _reportsCache = [ticket, ..._reportsCache.filter((t) => t.id !== ticket.id)];
    }
    return ticket;
  },

  async resolveReport(id: string, reply: string, status: ComplaintTicket['status']): Promise<ComplaintTicket> {
    await replyToComplaint(id, reply, status);
    const updatedTicket = { id, adminReply: reply, status, adminRepliedAt: new Date().toISOString() } as unknown as ComplaintTicket;
    if (_reportsCache) {
      _reportsCache = _reportsCache.map((t) => (t.id === id ? { ...t, adminReply: reply, status, adminRepliedAt: updatedTicket.adminRepliedAt } : t));
    }
    return updatedTicket;
  },

  async deleteReport(id: string): Promise<void> {
    await deleteComplaintTicket(id);
    if (_reportsCache) {
      _reportsCache = _reportsCache.filter((t) => t.id !== id);
    }
  },

  // -------------------------------------------------------------
  // Convenience Aliases for UI components
  // -------------------------------------------------------------
  async checkUserAuth(): Promise<{ authenticated: boolean; user: User | null }> {
    const user = await this.getMe();
    return { authenticated: !!user, user };
  },

  async checkAdminAuth(): Promise<{ authenticated: boolean }> {
    const authenticated = await this.verifyAdmin();
    return { authenticated };
  },

  async getUsers(): Promise<User[]> {
    return this.getAdminUsers();
  },

  async toggleSold(id: string): Promise<Listing> {
    return this.updateProductStatus(id, { isSold: true });
  },

  async toggleFeatured(id: string, isFeatured = true): Promise<Listing> {
    return this.updateProductStatus(id, { isFeatured });
  },
};
