import React, { useState, useEffect } from 'react';
import { User, Listing, ComplaintTicket, PlatformSettings } from '../types';
import { PRODUCT_CATEGORIES, UNILORIN_CAMPUS_LOCATIONS } from '../data/mockData';
import { cleanPhoneNumber } from '../utils/whatsapp';
import { api } from '../utils/api';
import { isPrimaryAdminEmail } from '../firebase/services';
import { WelcomeAnnouncementModal } from './WelcomeAnnouncementModal';
import { 
  ShieldCheck, 
  Users, 
  ShoppingBag, 
  MessageSquare, 
  TrendingUp, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Trash2, 
  AlertTriangle, 
  Send, 
  ExternalLink, 
  Edit3, 
  Eye, 
  Lock, 
  Clock, 
  LogOut, 
  UserX, 
  UserCheck, 
  Ban, 
  Search, 
  Filter, 
  AlertOctagon,
  X,
  Globe,
  Megaphone
} from 'lucide-react';

interface AdminDashboardProps {
  users: User[];
  listings: Listing[];
  complaints: ComplaintTicket[];
  settings: PlatformSettings;
  onRefreshData: () => Promise<void>;
  onLogoutAdmin: () => void;
  onViewProduct: (product: Listing) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  listings,
  complaints,
  settings,
  onRefreshData,
  onLogoutAdmin,
  onViewProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'listings' | 'users' | 'complaints' | 'activity' | 'settings'>('listings');

  // Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<'all' | 'active' | 'expired' | 'featured' | 'pending'>('all');
  const [userSearch, setUserSearch] = useState('');
  const [complaintFilter, setComplaintFilter] = useState<'all' | 'Open' | 'Under Investigation' | 'Resolved'>('all');

  // Confirmation Modals
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<Listing | null>(null);
  const [deleteUserConfirm, setDeleteUserConfirm] = useState<User | null>(null);

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Listing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editOriginalPrice, setEditOriginalPrice] = useState('');
  const [editCategory, setEditCategory] = useState<Listing['category']>('Textbooks & Handouts');
  const [editLocation, setEditLocation] = useState(UNILORIN_CAMPUS_LOCATIONS[0]);
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsExpired, setEditIsExpired] = useState(false);
  const [editIsApproved, setEditIsApproved] = useState(true);

  // Complaint reply states
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(complaints[0]?.id || null);
  const [replyText, setReplyText] = useState('');
  const [ticketStatusSelect, setTicketStatusSelect] = useState<ComplaintTicket['status']>('Resolved');

  // Admin Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Settings State
  const [moderationEnabled, setModerationEnabled] = useState(settings.listingModerationEnabled);
  const [registrationEnabled, setRegistrationEnabled] = useState(settings.registrationEnabled);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Website Name & Branding State
  const [siteNameInput, setSiteNameInput] = useState(settings.siteName || "C'IO");
  const [siteTaglineInput, setSiteTaglineInput] = useState(settings.siteTagline || "University of Ilorin Mini Campus Marketplace");
  const [siteShortNameInput, setSiteShortNameInput] = useState(settings.siteShortName || "C'IO");
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingMsg, setBrandingMsg] = useState('');

  // Welcome Popup & Announcement State
  const [welcomePopupEnabled, setWelcomePopupEnabled] = useState(settings.welcomePopupEnabled !== false);
  const [welcomePopupTitle, setWelcomePopupTitle] = useState(settings.welcomePopupTitle || "Welcome to C'IO Mini Campus Marketplace! 🎓");
  const [welcomePopupMessage, setWelcomePopupMessage] = useState(
    settings.welcomePopupMessage || "Welcome to the official University of Ilorin Mini Campus student marketplace! Easily buy and sell textbooks, gadgets, hostel accessories, and student passes. Always inspect items in daylight at Mini Campus Gate or the Student Center before making payment."
  );
  const [welcomePopupBadge, setWelcomePopupBadge] = useState(settings.welcomePopupBadge || "Campus Announcement & Safety Notice");
  const [welcomePopupActionText, setWelcomePopupActionText] = useState(settings.welcomePopupActionText || "Explore Marketplace");
  const [announcementAlertInput, setAnnouncementAlertInput] = useState(settings.announcementAlert || "Inspect items in daylight at Mini Campus Gate or Student Center before payment.");
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [isPreviewingWelcomeModal, setIsPreviewingWelcomeModal] = useState(false);

  // Sync state if settings prop changes externally
  useEffect(() => {
    if (settings) {
      if (settings.siteName) setSiteNameInput(settings.siteName);
      if (settings.siteTagline) setSiteTaglineInput(settings.siteTagline);
      if (settings.siteShortName) setSiteShortNameInput(settings.siteShortName);
      setWelcomePopupEnabled(settings.welcomePopupEnabled !== false);
      if (settings.welcomePopupTitle) setWelcomePopupTitle(settings.welcomePopupTitle);
      if (settings.welcomePopupMessage) setWelcomePopupMessage(settings.welcomePopupMessage);
      if (settings.welcomePopupBadge) setWelcomePopupBadge(settings.welcomePopupBadge);
      if (settings.welcomePopupActionText) setWelcomePopupActionText(settings.welcomePopupActionText);
      if (settings.announcementAlert) setAnnouncementAlertInput(settings.announcementAlert);
      setModerationEnabled(Boolean(settings.listingModerationEnabled));
      setRegistrationEnabled(settings.registrationEnabled !== false);
    }
  }, [settings]);

  // Action Loading states
  const [actionLoading, setActionLoading] = useState(false);

  // Filtered Products
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      l.sellerName.toLowerCase().includes(productSearch.toLowerCase()) ||
      l.category.toLowerCase().includes(productSearch.toLowerCase());

    if (!matchesSearch) return false;
    if (productFilter === 'active') return !l.isExpired && !l.isSold;
    if (productFilter === 'expired') return l.isExpired;
    if (productFilter === 'featured') return l.isFeatured;
    if (productFilter === 'pending') return l.isApproved === false;
    return true;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch) ||
      (u.matricNumber && u.matricNumber.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()))
    );
  });

  // Filtered Complaints
  const filteredComplaints = complaints.filter((c) => {
    if (complaintFilter === 'all') return true;
    return c.status === complaintFilter;
  });

  const selectedTicket = complaints.find((c) => c.id === selectedTicketId) || filteredComplaints[0];

  // ==========================================
  // PRODUCT ACTIONS
  // ==========================================
  const handleOpenEditProduct = (prod: Listing) => {
    setEditingProduct(prod);
    setEditTitle(prod.title);
    setEditPrice(prod.price.toString());
    setEditOriginalPrice(prod.originalPrice ? prod.originalPrice.toString() : '');
    setEditCategory(prod.category);
    setEditLocation(prod.campusLocation);
    setEditDescription(prod.description);
    setEditImageUrl(prod.imageUrl);
    setEditIsFeatured(Boolean(prod.isFeatured));
    setEditIsExpired(Boolean(prod.isExpired));
    setEditIsApproved(prod.isApproved !== false);
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setActionLoading(true);
    try {
      const parsedOriginal = editOriginalPrice.trim() ? parseFloat(editOriginalPrice.trim()) : undefined;
      const updateData: Partial<Listing> = {
        title: editTitle.trim(),
        price: parseFloat(editPrice) || editingProduct.price,
        category: editCategory,
        campusLocation: editLocation,
        description: editDescription.trim(),
        imageUrl: editImageUrl.trim() || editingProduct.imageUrl,
        isFeatured: editIsFeatured,
        isExpired: editIsExpired,
        isApproved: editIsApproved,
      };

      // Set valid positive number, or undefined if cleared
      if (parsedOriginal !== undefined && !isNaN(parsedOriginal) && parsedOriginal > 0) {
        updateData.originalPrice = parsedOriginal;
      } else {
        updateData.originalPrice = undefined;
      }

      await api.updateProduct(editingProduct.id, updateData, true);
      await onRefreshData();
      setEditingProduct(null);
    } catch (err: any) {
      alert('Error updating product: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProductPermanent = async () => {
    if (!deleteProductConfirm) return;
    setActionLoading(true);
    try {
      await api.deleteProduct(deleteProductConfirm.id, true);
      await onRefreshData();
      setDeleteProductConfirm(null);
    } catch (err: any) {
      alert('Error deleting product: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleExpire = async (prod: Listing) => {
    try {
      await api.updateProductStatus(prod.id, { isExpired: !prod.isExpired }, true);
      await onRefreshData();
    } catch (err: any) {
      alert('Error updating product status: ' + err.message);
    }
  };

  const handleToggleApprove = async (prod: Listing, approve: boolean) => {
    try {
      await api.updateProductStatus(prod.id, { isApproved: approve }, true);
      await onRefreshData();
    } catch (err: any) {
      alert('Error moderating listing: ' + err.message);
    }
  };

  const handleToggleFeatured = async (prod: Listing) => {
    try {
      await api.updateProductStatus(prod.id, { isFeatured: !prod.isFeatured }, true);
      await onRefreshData();
    } catch (err: any) {
      alert('Error toggling featured: ' + err.message);
    }
  };

  // ==========================================
  // USER ACTIONS
  // ==========================================
  const handleToggleUserSuspend = async (targetUser: User) => {
    if (
      isPrimaryAdminEmail(targetUser.email) ||
      targetUser.role === 'admin' ||
      targetUser.role === 'super_admin'
    ) {
      alert('The primary campus administrator account cannot be suspended.');
      return;
    }

    try {
      if (targetUser.isBanned) {
        await api.unsuspendUser(targetUser.id);
      } else {
        await api.suspendUser(targetUser.id);
      }
      await onRefreshData();
    } catch (err: any) {
      alert('Error updating user status: ' + err.message);
    }
  };

  const handleDeleteUserPermanent = async () => {
    if (!deleteUserConfirm) return;
    if (
      isPrimaryAdminEmail(deleteUserConfirm.email) ||
      deleteUserConfirm.role === 'admin' ||
      deleteUserConfirm.role === 'super_admin'
    ) {
      alert('The primary campus administrator account cannot be deleted.');
      setDeleteUserConfirm(null);
      return;
    }
    setActionLoading(true);
    try {
      await api.deleteUser(deleteUserConfirm.id);
      await onRefreshData();
      setDeleteUserConfirm(null);
    } catch (err: any) {
      alert('Error deleting user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyMatric = async (userId: string, isVerified: boolean) => {
    try {
      await api.verifyUserMatric(userId, isVerified);
      await onRefreshData();
    } catch (err: any) {
      alert('Error verifying student matric: ' + err.message);
    }
  };

  // ==========================================
  // COMPLAINT ACTIONS
  // ==========================================
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    try {
      await api.resolveReport(selectedTicket.id, replyText.trim(), ticketStatusSelect);
      await onRefreshData();
      setReplyText('');
    } catch (err: any) {
      alert('Error resolving complaint: ' + err.message);
    }
  };

  const handleOpenWhatsAppResolution = (ticket: ComplaintTicket) => {
    const phone = cleanPhoneNumber(ticket.userPhone);
    const msg = `Hello ${ticket.userName}, this is C'IO Support Administration (University of Ilorin Mini Campus Marketplace) regarding your ticket #${ticket.id} (${ticket.category}).\n\nResolution: ${ticket.adminReply || replyText || 'Our safety team has completed the investigation.'}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  // ==========================================
  // PASSWORD CHANGE
  // ==========================================
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.changeAdminPassword(currentPassword, newPassword);
      setPasswordMsg({ type: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ==========================================
  // SETTINGS: PLATFORM CONTROLS
  // ==========================================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateSettings({
        listingModerationEnabled: moderationEnabled,
        registrationEnabled,
      });
      setSettingsMsg('Platform controls saved successfully!');
      setTimeout(() => setSettingsMsg(''), 2500);
      await onRefreshData();
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    }
  };

  // ==========================================
  // SETTINGS: WEBSITE NAME & BRANDING
  // ==========================================
  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteNameInput.trim()) {
      alert('Website name cannot be empty.');
      return;
    }
    try {
      setBrandingLoading(true);
      await api.updateSettings({
        siteName: siteNameInput.trim(),
        siteTagline: siteTaglineInput.trim(),
        siteShortName: siteShortNameInput.trim() || siteNameInput.trim(),
      });
      setBrandingMsg('Website name and branding synced successfully across the website!');
      setTimeout(() => setBrandingMsg(''), 3000);
      await onRefreshData();
    } catch (err: any) {
      alert('Error saving website name: ' + err.message);
    } finally {
      setBrandingLoading(false);
    }
  };

  // ==========================================
  // SETTINGS: WELCOME POPUP & ANNOUNCEMENT
  // ==========================================
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAnnouncementLoading(true);
      await api.updateSettings({
        welcomePopupEnabled,
        welcomePopupTitle: welcomePopupTitle.trim(),
        welcomePopupMessage: welcomePopupMessage.trim(),
        welcomePopupBadge: welcomePopupBadge.trim(),
        welcomePopupActionText: welcomePopupActionText.trim(),
        announcementAlert: announcementAlertInput.trim(),
        announcementUpdatedAt: new Date().toISOString(),
      });
      setAnnouncementMsg('Home page welcome announcement saved and active!');
      setTimeout(() => setAnnouncementMsg(''), 3000);
      await onRefreshData();
    } catch (err: any) {
      alert('Error saving announcement: ' + err.message);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#2D2D2A] text-white p-6 rounded-3xl shadow-xl border border-[#5A5A40]/30 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5A5A40] text-xs font-bold text-white mb-2">
            <ShieldCheck className="h-4 w-4" />
            {settings.siteName || "C'IO"} Administration Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white">
            {settings.siteTagline || "University of Ilorin Mini Campus Marketplace"} Desk
          </h1>
          <p className="text-xs text-[#D9D9C8]/80 mt-1">
            Real-time management for listings, verified student accounts, inquiries, and security moderation.
          </p>
        </div>

        <button
          onClick={onLogoutAdmin}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-bold transition border border-red-500/30"
        >
          <LogOut className="h-4 w-4" />
          <span>Exit Admin Session</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-[#E0E0D5] mb-6 scrollbar-none">
        <button
          id="admin-tab-listings"
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'listings'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Products & Listings ({listings.length})</span>
        </button>

        <button
          id="admin-tab-users"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'users'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Registered Users ({users.length})</span>
        </button>

        <button
          id="admin-tab-complaints"
          onClick={() => setActiveTab('complaints')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'complaints'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Complaints & Reports ({complaints.filter((c) => c.status === 'Open').length} Open)</span>
        </button>

        <button
          id="admin-tab-activity"
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'activity'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Marketplace Activity</span>
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition shrink-0 ${
            activeTab === 'settings'
              ? 'bg-[#5A5A40] text-white shadow-xs'
              : 'text-[#2D2D2A] hover:bg-[#E8E8DF]'
          }`}
        >
          <SettingsIcon className="h-4 w-4" />
          <span>Settings & Security</span>
        </button>
      </div>

      {/* ========================================== */}
      {/* 1. PRODUCT MANAGEMENT TAB */}
      {/* ========================================== */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0D5]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7A7A6A]" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by title, seller, or category..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-[#E0E0D5] bg-[#F5F5F0] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {(['all', 'active', 'expired', 'featured', 'pending'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setProductFilter(filter)}
                  className={`px-3 py-1.5 rounded-full text-xs capitalize transition ${
                    productFilter === filter
                      ? 'bg-[#5A5A40] text-white font-bold'
                      : 'bg-[#F5F5F0] text-[#7A7A6A] hover:bg-[#E8E8DF]'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Product Listings Table */}
          {filteredListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E0E0D5] p-6">
              <ShoppingBag className="h-12 w-12 text-[#A0A090] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#2D2D2A]">No Products Found</h3>
              <p className="text-xs text-[#7A7A6A] mt-1 max-w-sm mx-auto">
                {listings.length === 0
                  ? "The database is currently clean with no demo products. Real products will appear here as students and sellers add them."
                  : "No products match the selected filters or search query."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E0E0D5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F0] text-[#7A7A6A] uppercase font-bold border-b border-[#E0E0D5]">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Price</th>
                      <th className="px-4 py-3">Seller & Location</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0D5]">
                    {filteredListings.map((prod) => (
                      <tr key={prod.id} className="hover:bg-[#F5F5F0]/50 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.imageUrl}
                              alt={prod.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[#E0E0D5]"
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-[#2D2D2A] truncate max-w-xs">{prod.title}</h4>
                              <span className="text-[10px] text-[#7A7A6A] block">Posted: {prod.createdAt}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-[#2D2D2A]">
                          <span className="px-2 py-0.5 rounded-full bg-[#E8E8DF] text-[11px] font-medium">
                            {prod.category}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold font-serif text-[#5A5A40] text-sm">
                          ₦{prod.price.toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-[#2D2D2A] font-semibold">{prod.sellerName}</div>
                          <div className="text-[11px] text-[#7A7A6A] truncate max-w-xs">{prod.campusLocation}</div>
                          <div className="text-[10px] font-mono text-[#5A5A40]">{prod.sellerPhone}</div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-col gap-1">
                            {prod.isExpired && (
                              <span className="inline-block text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full w-fit">
                                Expired
                              </span>
                            )}
                            {prod.isSold && (
                              <span className="inline-block text-[10px] bg-gray-200 text-gray-700 font-bold px-2 py-0.5 rounded-full w-fit">
                                Sold Out
                              </span>
                            )}
                            {!prod.isExpired && !prod.isSold && (
                              <span className="inline-block text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full w-fit">
                                Active
                              </span>
                            )}
                            {prod.isFeatured && (
                              <span className="inline-block text-[10px] bg-[#5A5A40]/15 text-[#5A5A40] font-bold px-2 py-0.5 rounded-full w-fit">
                                ★ Featured
                              </span>
                            )}
                            {prod.isApproved === false && (
                              <span className="inline-block text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full w-fit">
                                Pending Moderation
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* VIEW button */}
                            <button
                              onClick={() => onViewProduct(prod)}
                              title="View Product"
                              className="p-1.5 rounded-lg border border-[#E0E0D5] bg-white text-[#2D2D2A] hover:bg-[#E8E8DF] transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* EDIT button */}
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              title="Edit Product"
                              className="p-1.5 rounded-lg border border-[#5A5A40]/30 bg-[#5A5A40]/10 text-[#5A5A40] hover:bg-[#5A5A40]/20 transition"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            {/* REMOVE / EXPIRE button */}
                            <button
                              onClick={() => handleToggleExpire(prod)}
                              title={prod.isExpired ? 'Re-activate product' : 'Mark product as expired'}
                              className={`p-1.5 rounded-lg border text-xs font-semibold transition flex items-center gap-1 ${
                                prod.isExpired
                                  ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                                  : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{prod.isExpired ? 'Active' : 'Expire'}</span>
                            </button>

                            {/* DELETE button with confirmation */}
                            <button
                              onClick={() => setDeleteProductConfirm(prod)}
                              title="Permanently Delete Product"
                              className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 2. USER MANAGEMENT TAB */}
      {/* ========================================== */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#E0E0D5]">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#7A7A6A]" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name, phone, matric number, or email..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-[#E0E0D5] bg-[#F5F5F0] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>
            <div className="text-xs text-[#7A7A6A]">
              Showing {filteredUsers.length} of {users.length} registered users
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E0E0D5] p-6">
              <Users className="h-12 w-12 text-[#A0A090] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#2D2D2A]">No Users Found</h3>
              <p className="text-xs text-[#7A7A6A] mt-1 max-w-sm mx-auto">
                {users.length === 0
                  ? "The marketplace currently has 0 registered users. As students register their accounts, they will appear here."
                  : "No users match your search query."}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#E0E0D5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F5F0] text-[#7A7A6A] uppercase font-bold border-b border-[#E0E0D5]">
                    <tr>
                      <th className="px-4 py-3">User & Profile</th>
                      <th className="px-4 py-3">Role & Verification</th>
                      <th className="px-4 py-3">Campus Location</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Registered</th>
                      <th className="px-4 py-3 text-right">User Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0D5]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#F5F5F0]/50 transition">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={u.name}
                              className="w-10 h-10 rounded-full object-cover border border-[#E0E0D5]"
                            />
                            <div>
                              <div className="font-bold text-[#2D2D2A]">{u.name}</div>
                              {u.matricNumber && (
                                <div className="text-[10px] font-mono text-[#5A5A40]">
                                  Matric: {u.matricNumber}
                                </div>
                              )}
                              {u.businessName && (
                                <div className="text-[10px] text-[#7A7A6A]">
                                  Biz: {u.businessName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="capitalize px-2 py-0.5 rounded-full bg-[#E8E8DF] text-[10px] font-bold">
                              {u.role}
                            </span>
                            {u.isMatricVerified && (
                              <span className="px-2 py-0.5 rounded-full bg-[#5A5A40]/15 text-[#5A5A40] text-[10px] font-bold inline-flex items-center gap-0.5">
                                <ShieldCheck className="h-3 w-3" /> Verified
                              </span>
                            )}
                            {u.isBanned && (
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                                Suspended
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-[#2D2D2A] text-[11px]">
                          {u.campusLocation}
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[#5A5A40]">
                          <div>{u.phone}</div>
                          {u.email && <div className="text-[10px] text-[#7A7A6A]">{u.email}</div>}
                        </td>

                        <td className="px-4 py-3.5 text-[11px] text-[#7A7A6A]">
                          {u.createdAt}
                        </td>

                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Verify Matric Badge Toggle */}
                            {u.role === 'student' && (
                              <button
                                onClick={() => handleVerifyMatric(u.id, !u.isMatricVerified)}
                                title={u.isMatricVerified ? 'Revoke Verified Student Badge' : 'Approve Student Matric Badge'}
                                className={`px-2 py-1 rounded-lg text-[11px] font-bold border transition ${
                                  u.isMatricVerified
                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                    : 'border-[#5A5A40] bg-[#5A5A40]/10 text-[#5A5A40] hover:bg-[#5A5A40]/20'
                                }`}
                              >
                                {u.isMatricVerified ? 'Revoke Badge' : 'Verify Matric'}
                              </button>
                            )}

                            {/* Suspend / Unsuspend */}
                            {isPrimaryAdminEmail(u.email) || u.role === 'admin' || u.role === 'super_admin' ? (
                              <span
                                title="Primary administrator account (Protected)"
                                className="p-1.5 rounded-lg border border-[#D9D9C8]/40 bg-[#F5F5F0] text-[#5A5A40] cursor-not-allowed opacity-70 inline-flex items-center justify-center"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                              </span>
                            ) : (
                              <button
                                onClick={() => handleToggleUserSuspend(u)}
                                title={u.isBanned ? 'Unsuspend User Account' : 'Suspend User Account'}
                                className={`p-1.5 rounded-lg border transition ${
                                  u.isBanned
                                    ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                                    : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                                }`}
                              >
                                {u.isBanned ? <UserCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                              </button>
                            )}

                            {/* Delete User */}
                            {isPrimaryAdminEmail(u.email) || u.role === 'admin' || u.role === 'super_admin' ? null : (
                              <button
                                onClick={() => setDeleteUserConfirm(u)}
                                title="Permanently Delete User"
                                className="p-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 3. COMPLAINTS & REPORTS TAB */}
      {/* ========================================== */}
      {activeTab === 'complaints' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaints list */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E0E0D5]">
              <span className="text-xs font-bold text-[#2D2D2A]">Ticket Inbox</span>
              <div className="flex gap-1 text-[11px]">
                {(['all', 'Open', 'Under Investigation', 'Resolved'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setComplaintFilter(st)}
                    className={`px-2 py-0.5 rounded-full transition ${
                      complaintFilter === st
                        ? 'bg-[#5A5A40] text-white font-bold'
                        : 'bg-[#F5F5F0] text-[#7A7A6A]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {filteredComplaints.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-[#E0E0D5] text-[#7A7A6A] text-xs">
                No tickets in this status.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredComplaints.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition ${
                      selectedTicket?.id === ticket.id
                        ? 'border-[#5A5A40] bg-[#5A5A40]/10 shadow-xs'
                        : 'border-[#E0E0D5] bg-white hover:bg-[#F5F5F0]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[#2D2D2A] truncate max-w-[150px]">{ticket.userName}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ticket.status === 'Open'
                            ? 'bg-red-100 text-red-700'
                            : ticket.status === 'Under Investigation'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <div className="font-medium text-[#5A5A40] text-[11px] truncate mb-1">
                      {ticket.category}: {ticket.title}
                    </div>
                    <div className="text-[10px] text-[#7A7A6A] flex items-center justify-between">
                      <span>{ticket.userPhone}</span>
                      <span>{ticket.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ticket Resolution Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#E0E0D5] shadow-xs">
            {selectedTicket ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E0E0D5]">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#7A7A6A] font-mono">
                      Ticket #{selectedTicket.id}
                    </span>
                    <h3 className="text-base font-bold text-[#2D2D2A]">{selectedTicket.title}</h3>
                  </div>
                  <button
                    onClick={() => handleOpenWhatsAppResolution(selectedTicket)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white font-bold text-xs hover:bg-[#20ba5a] transition"
                  >
                    <span>Reply on WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-[#F5F5F0] p-3 rounded-2xl border border-[#E0E0D5]">
                  <div>
                    <span className="text-[#7A7A6A] block">Complainant:</span>
                    <span className="font-bold text-[#2D2D2A]">{selectedTicket.userName}</span>
                  </div>
                  <div>
                    <span className="text-[#7A7A6A] block">Phone (WhatsApp):</span>
                    <span className="font-mono text-[#5A5A40] font-bold">{selectedTicket.userPhone}</span>
                  </div>
                  <div>
                    <span className="text-[#7A7A6A] block">Category:</span>
                    <span className="font-medium text-[#2D2D2A]">{selectedTicket.category}</span>
                  </div>
                  <div>
                    <span className="text-[#7A7A6A] block">Accused / Target:</span>
                    <span className="font-medium text-[#2D2D2A]">
                      {selectedTicket.accusedSellerName || 'N/A'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[#2D2D2A] mb-1">Issue Details:</h4>
                  <p className="text-xs text-[#5A5A50] bg-[#F5F5F0] p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed border border-[#E0E0D5]">
                    {selectedTicket.description}
                  </p>
                </div>

                {selectedTicket.adminReply && (
                  <div className="bg-[#5A5A40]/10 border border-[#5A5A40]/20 p-3.5 rounded-2xl text-xs">
                    <span className="font-bold text-[#5A5A40] block mb-1">Previous Admin Response:</span>
                    <p className="text-[#2D2D2A] leading-relaxed">{selectedTicket.adminReply}</p>
                    <span className="text-[10px] text-[#7A7A6A] block mt-1">
                      Replied on: {selectedTicket.adminRepliedAt}
                    </span>
                  </div>
                )}

                {/* Reply Form */}
                <form onSubmit={handleSendAdminReply} className="pt-2 space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-[#2D2D2A]">Update Status:</label>
                    <select
                      value={ticketStatusSelect}
                      onChange={(e) => setTicketStatusSelect(e.target.value as any)}
                      className="rounded-full border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-1.5 text-xs text-[#2D2D2A]"
                    >
                      <option value="Under Investigation">Under Investigation</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Dismissed">Dismissed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                      Resolution / Safety Feedback:
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type official reply to complainant..."
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] p-3 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#5A5A40] hover:bg-[#474732] text-white text-xs font-bold px-5 py-2.5 rounded-full transition shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Save Response & Update Ticket</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="py-20 text-center text-[#7A7A6A] text-xs">
                Select a ticket on the left to review details and issue responses.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 4. MARKETPLACE ACTIVITY TAB */}
      {/* ========================================== */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E0E0D5] shadow-xs">
              <span className="text-xs text-[#7A7A6A] block">Total Listings</span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2D2A] mt-1">
                {listings.length}
              </div>
              <span className="text-[10px] text-green-600 font-semibold mt-1 block">
                {listings.filter((l) => !l.isExpired && !l.isSold).length} active now
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E0E0D5] shadow-xs">
              <span className="text-xs text-[#7A7A6A] block">Registered Students</span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#5A5A40] mt-1">
                {users.filter((u) => u.role === 'student').length}
              </div>
              <span className="text-[10px] text-[#7A7A6A] font-semibold mt-1 block">
                {users.filter((u) => u.role === 'student' && u.isMatricVerified).length} verified matric
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E0E0D5] shadow-xs">
              <span className="text-xs text-[#7A7A6A] block">Campus Businesses</span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#2D2D2A] mt-1">
                {users.filter((u) => u.role === 'business').length}
              </div>
              <span className="text-[10px] text-[#7A7A6A] font-semibold mt-1 block">
                Mini campus vendors
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E0E0D5] shadow-xs">
              <span className="text-xs text-[#7A7A6A] block">Complaints Resolved</span>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-green-700 mt-1">
                {complaints.filter((c) => c.status === 'Resolved').length}
              </div>
              <span className="text-[10px] text-[#7A7A6A] font-semibold mt-1 block">
                {complaints.filter((c) => c.status === 'Open').length} open tickets
              </span>
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-[#E0E0D5] shadow-xs space-y-4">
            <h3 className="text-base font-serif font-bold text-[#2D2D2A]">
              University of Ilorin Mini Campus Operational Summary
            </h3>
            <div className="space-y-3 text-xs text-[#2D2D2A]">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F0]">
                <span>Official Campus Support Hotline</span>
                <span className="font-mono font-bold text-[#5A5A40]">09076930244</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F0]">
                <span>Designated Pickup Zones</span>
                <span className="font-medium text-[#5A5A40]">Mini Campus Gate, Student Center & SUB</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F5F5F0]">
                <span>Student Protection Rule</span>
                <span className="font-medium text-[#5A5A40]">Physical inspection before payment</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 5. SETTINGS & SECURITY TAB */}
      {/* ========================================== */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SECTION 1: WEBSITE NAME & CAMPUS BRANDING */}
            <div className="bg-white p-6 rounded-3xl border border-[#E0E0D5] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8E8DF] text-[#5A5A40] flex items-center justify-center">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Website Name & Campus Branding</h3>
                    <p className="text-[11px] text-[#7A7A6A]">
                      Change the name of the website. Updates sync dynamically across all client headers, badges, and pages.
                    </p>
                  </div>
                </div>

                {brandingMsg && (
                  <div className="my-3 p-3 rounded-2xl bg-green-50 text-green-700 border border-green-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{brandingMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveBranding} className="space-y-3.5 mt-4">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                      Website Brand Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={siteNameInput}
                      onChange={(e) => setSiteNameInput(e.target.value)}
                      placeholder="e.g. C'IO or Unilorin Mini Campus"
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs text-[#2D2D2A] font-semibold focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                    <span className="text-[10px] text-[#7A7A6A] mt-1 block">
                      Replaces the primary logo title on desktop and mobile navbar and footer.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                      Campus Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={siteTaglineInput}
                      onChange={(e) => setSiteTaglineInput(e.target.value)}
                      placeholder="e.g. University of Ilorin Mini Campus Marketplace"
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                    <span className="text-[10px] text-[#7A7A6A] mt-1 block">
                      Appears beneath the main brand name in header and metadata.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                      Short Initials / Mobile Badge
                    </label>
                    <input
                      type="text"
                      value={siteShortNameInput}
                      onChange={(e) => setSiteShortNameInput(e.target.value)}
                      placeholder="e.g. C'IO or Mini Campus"
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                    <span className="text-[10px] text-[#7A7A6A] mt-1 block">
                      Compact identifier for mobile headers and announcement pills.
                    </span>
                  </div>

                  {/* Live Branding Preview Box */}
                  <div className="p-3.5 rounded-2xl bg-[#0B0B0A] text-white border border-white/10 space-y-1.5 mt-2">
                    <span className="text-[10px] text-white/50 uppercase tracking-wider font-bold block">
                      Live Header Preview:
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#1E1E1C] border border-white/20 flex items-center justify-center text-white text-xs font-serif font-bold">
                        {siteNameInput.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-serif font-bold text-sm text-white">
                            {siteNameInput || "C'IO"}
                          </span>
                          <span className="text-[9px] bg-white/10 text-white font-medium px-1.5 py-0.2 rounded-full border border-white/15">
                            {siteShortNameInput || "Mini Campus"}
                          </span>
                        </div>
                        <div className="text-[9px] text-white/60">
                          {siteTaglineInput || "University of Ilorin Mini Campus Marketplace"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={brandingLoading}
                    className="w-full bg-[#5A5A40] hover:bg-[#474732] text-white font-bold py-2.5 rounded-full text-xs transition shadow-xs disabled:opacity-60 cursor-pointer mt-2"
                  >
                    {brandingLoading ? 'Syncing Website Name...' : 'Save & Sync Website Name'}
                  </button>
                </form>
              </div>
            </div>

            {/* SECTION 2: WELCOMING POPUP & CAMPUS ANNOUNCEMENT */}
            <div className="bg-white p-6 rounded-3xl border border-[#E0E0D5] shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#E8E8DF] text-[#5A5A40] flex items-center justify-center">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Home Page Welcoming Popup & Announcement</h3>
                    <p className="text-[11px] text-[#7A7A6A]">
                      Pops up whenever users navigate to the home page. Admins can edit the message, title, and safety tips anytime.
                    </p>
                  </div>
                </div>

                {announcementMsg && (
                  <div className="my-3 p-3 rounded-2xl bg-green-50 text-green-700 border border-green-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{announcementMsg}</span>
                  </div>
                )}

                <form onSubmit={handleSaveAnnouncement} className="space-y-3.5 mt-4">
                  <div className="p-3 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-[#2D2D2A]">Enable Home Page Popup</h4>
                      <p className="text-[11px] text-[#7A7A6A]">
                        Show welcoming popup whenever visitors navigate to the home marketplace feed.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={welcomePopupEnabled}
                      onChange={(e) => setWelcomePopupEnabled(e.target.checked)}
                      className="h-5 w-5 rounded text-[#5A5A40] focus:ring-[#5A5A40] cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                      Popup Header Title
                    </label>
                    <input
                      type="text"
                      required
                      value={welcomePopupTitle}
                      onChange={(e) => setWelcomePopupTitle(e.target.value)}
                      placeholder="Welcome to C'IO Mini Campus Marketplace! 🎓"
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] font-semibold focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                      Announcement Category / Badge Text
                    </label>
                    <input
                      type="text"
                      value={welcomePopupBadge}
                      onChange={(e) => setWelcomePopupBadge(e.target.value)}
                      placeholder="e.g. Campus Announcement & Safety Guide"
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                      Welcoming & Announcement Message (Multi-paragraph supported)
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={welcomePopupMessage}
                      onChange={(e) => setWelcomePopupMessage(e.target.value)}
                      placeholder="Write your welcoming message, safety warnings, semester notes, or instructions for students..."
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] p-3 text-xs text-[#2D2D2A] leading-relaxed focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                        Action Button Label
                      </label>
                      <input
                        type="text"
                        value={welcomePopupActionText}
                        onChange={(e) => setWelcomePopupActionText(e.target.value)}
                        placeholder="Explore Marketplace"
                        className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#2D2D2A] mb-1">
                        Top Ticker / Alert Bar Text
                      </label>
                      <input
                        type="text"
                        value={announcementAlertInput}
                        onChange={(e) => setAnnouncementAlertInput(e.target.value)}
                        placeholder="Inspect items in daylight at Mini Campus Gate..."
                        className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewingWelcomeModal(true)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#D0D0C5] text-[#2D2D2A] hover:bg-[#E8E8DF] text-xs font-semibold transition cursor-pointer"
                    >
                      <Eye className="h-4 w-4 text-[#5A5A40]" />
                      <span>Preview Popup</span>
                    </button>
                    <button
                      type="submit"
                      disabled={announcementLoading}
                      className="flex-1 bg-[#5A5A40] hover:bg-[#474732] text-white font-bold py-2.5 rounded-full text-xs transition shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      {announcementLoading ? 'Saving...' : 'Save Announcement'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* SECOND ROW: PLATFORM CONTROLS & CHANGE PASSWORD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Website Settings: Platform Controls */}
            <div className="bg-white p-6 rounded-3xl border border-[#E0E0D5] shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <SettingsIcon className="h-5 w-5 text-[#5A5A40]" />
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Platform Controls</h3>
              </div>

              {settingsMsg && (
                <div className="mb-4 p-3 rounded-2xl bg-green-50 text-green-700 border border-green-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{settingsMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#2D2D2A]">Listing Moderation</h4>
                    <p className="text-[11px] text-[#7A7A6A] mt-0.5">
                      When enabled, new products require admin approval before becoming visible to buyers.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={moderationEnabled}
                    onChange={(e) => setModerationEnabled(e.target.checked)}
                    className="h-5 w-5 rounded text-[#5A5A40] focus:ring-[#5A5A40] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-[#2D2D2A]">User Registration</h4>
                    <p className="text-[11px] text-[#7A7A6A] mt-0.5">
                      Allow new students and buyers to register accounts.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={registrationEnabled}
                    onChange={(e) => setRegistrationEnabled(e.target.checked)}
                    className="h-5 w-5 rounded text-[#5A5A40] focus:ring-[#5A5A40] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5]">
                  <span className="text-xs font-bold text-[#2D2D2A] block mb-1">Official Support Number:</span>
                  <span className="font-mono font-bold text-sm text-[#5A5A40]">09076930244</span>
                  <span className="text-[10px] text-[#7A7A6A] block mt-0.5">Standardized across all pages.</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#5A5A40] hover:bg-[#474732] text-white font-bold py-2.5 rounded-full text-xs transition shadow-xs cursor-pointer"
                >
                  Save Platform Controls
                </button>
              </form>
            </div>

            {/* Change Admin Password */}
            <div className="bg-white p-6 rounded-3xl border border-[#E0E0D5] shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Lock className="h-5 w-5 text-[#5A5A40]" />
                <h3 className="text-base font-serif font-bold text-[#2D2D2A]">Change Admin Password</h3>
              </div>
              <p className="text-xs text-[#7A7A6A] mb-4">
                Update the server-side administrator password.
              </p>

              {passwordMsg && (
                <div
                  className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 ${
                    passwordMsg.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Current Admin Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">New Admin Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full bg-[#5A5A40] hover:bg-[#474732] text-white font-bold py-2.5 rounded-full text-xs transition shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {passwordLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            </div>
          </div>

          {/* Admin Preview of Welcome Modal */}
          {isPreviewingWelcomeModal && (
            <WelcomeAnnouncementModal
              isOpen={isPreviewingWelcomeModal}
              onClose={() => setIsPreviewingWelcomeModal(false)}
              settings={{
                ...settings,
                siteName: siteNameInput.trim() || "C'IO",
                siteTagline: siteTaglineInput.trim() || "University of Ilorin Mini Campus Marketplace",
                welcomePopupTitle: welcomePopupTitle.trim(),
                welcomePopupMessage: welcomePopupMessage.trim(),
                welcomePopupBadge: welcomePopupBadge.trim(),
                welcomePopupActionText: welcomePopupActionText.trim(),
              }}
            />
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE PRODUCT CONFIRMATION MODAL */}
      {/* ========================================== */}
      {deleteProductConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#2D2D2A]">Delete Product Permanently?</h3>
            <p className="text-xs text-[#7A7A6A] mt-2 leading-relaxed">
              Are you sure you want to delete <strong className="text-[#2D2D2A]">"{deleteProductConfirm.title}"</strong>? 
              This will permanently remove the item from the database. This action cannot be undone.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteProductConfirm(null)}
                className="px-4 py-2 rounded-full border border-[#E0E0D5] text-xs font-semibold text-[#7A7A6A] hover:bg-[#F5F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProductPermanent}
                disabled={actionLoading}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-60"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* DELETE USER CONFIRMATION MODAL */}
      {/* ========================================== */}
      {deleteUserConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-[#2D2D2A]">Delete User Account?</h3>
            <p className="text-xs text-[#7A7A6A] mt-2 leading-relaxed">
              Are you sure you want to permanently delete user <strong className="text-[#2D2D2A]">"{deleteUserConfirm.name}"</strong>? 
              All products and listings posted by this user will also be permanently deleted from the database.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteUserConfirm(null)}
                className="px-4 py-2 rounded-full border border-[#E0E0D5] text-xs font-semibold text-[#7A7A6A] hover:bg-[#F5F5F0]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUserPermanent}
                disabled={actionLoading}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-60"
              >
                {actionLoading ? 'Deleting...' : 'Yes, Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* EDIT PRODUCT MODAL */}
      {/* ========================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-[#E0E0D5] my-8">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute right-4 top-4 p-2 rounded-full text-[#7A7A6A] hover:bg-[#F5F5F0]"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-serif font-bold text-[#2D2D2A] mb-1">Edit Product Details</h3>
            <p className="text-xs text-[#7A7A6A] mb-4">Product ID: {editingProduct.id}</p>

            <form onSubmit={handleSaveProductEdit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Price (₦)</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Original Price (₦ - Optional)</label>
                  <input
                    type="number"
                    value={editOriginalPrice}
                    placeholder="Leave empty if none"
                    onChange={(e) => setEditOriginalPrice(e.target.value)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as any)}
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A]"
                  >
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">University of Ilorin Mini Campus Location</label>
                <select
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A]"
                >
                  {UNILORIN_CAMPUS_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Image URL</label>
                <input
                  type="text"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs text-[#2D2D2A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] p-3 text-xs text-[#2D2D2A]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsFeatured}
                    onChange={(e) => setEditIsFeatured(e.target.checked)}
                    className="rounded text-[#5A5A40]"
                  />
                  <span className="font-semibold text-[#2D2D2A]">Featured</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsExpired}
                    onChange={(e) => setEditIsExpired(e.target.checked)}
                    className="rounded text-[#5A5A40]"
                  />
                  <span className="font-semibold text-[#2D2D2A]">Expired</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-[#E0E0D5] bg-[#F5F5F0] text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsApproved}
                    onChange={(e) => setEditIsApproved(e.target.checked)}
                    className="rounded text-[#5A5A40]"
                  />
                  <span className="font-semibold text-[#2D2D2A]">Approved</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-full border border-[#E0E0D5] text-xs font-semibold text-[#7A7A6A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-full bg-[#5A5A40] hover:bg-[#474732] text-white text-xs font-bold transition shadow-xs disabled:opacity-60"
                >
                  {actionLoading ? 'Saving...' : 'Save Product Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
