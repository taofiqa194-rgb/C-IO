import { User, Listing, ComplaintTicket, PlatformSettings } from '../types';

function getHeaders(isAdmin = false): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (isAdmin) {
    const adminToken = localStorage.getItem('cio_admin_token');
    if (adminToken) headers['x-admin-token'] = adminToken;
  }
  const userToken = localStorage.getItem('cio_user_token');
  if (userToken) headers['x-user-token'] = userToken;

  return headers;
}

export const api = {
  // Public settings
  async getSettings(): Promise<PlatformSettings> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  // Admin Auth
  async adminLogin(usernameOrEmail: string, password: string):Promise<{ token: string; admin: any }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin login failed');
    localStorage.setItem('cio_admin_token', data.token);
    return data;
  },

  async adminLogout(): Promise<void> {
    const token = localStorage.getItem('cio_admin_token');
    if (token) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getHeaders(true),
      }).catch(() => {});
      localStorage.removeItem('cio_admin_token');
    }
  },

  async verifyAdmin(): Promise<boolean> {
    const token = localStorage.getItem('cio_admin_token');
    if (!token) return false;
    try {
      const res = await fetch('/api/admin/verify', {
        headers: getHeaders(true),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change admin password');
    return data;
  },

  async updateSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data.settings;
  },

  // Admin User Management
  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', {
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  },

  async suspendUser(userId: string): Promise<User> {
    const res = await fetch(`/api/admin/users/${userId}/suspend`, {
      method: 'PATCH',
      headers: getHeaders(true),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to suspend user');
    return data.user;
  },

  async deleteUser(userId: string): Promise<void> {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete user');
    }
  },

  async verifyUserMatric(userId: string, isVerified: boolean): Promise<User> {
    const res = await fetch(`/api/admin/users/${userId}/verify-matric`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ isVerified }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify matric');
    return data.user;
  },

  // User Auth
  async register(userData: any): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('cio_user_token', data.token);
    return data;
  },

  async login(identifier: string, password: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('cio_user_token', data.token);
    return data;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('cio_user_token');
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getHeaders(false),
      }).catch(() => {});
      localStorage.removeItem('cio_user_token');
    }
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('cio_user_token');
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: getHeaders(false),
      });
      if (!res.ok) {
        localStorage.removeItem('cio_user_token');
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async updateProfile(profileData: Partial<User>): Promise<User> {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: getHeaders(false),
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data.user;
  },

  // Products
  async getProducts(): Promise<Listing[]> {
    const res = await fetch('/api/products', {
      headers: getHeaders(false),
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  async createProduct(productData: Partial<Listing>): Promise<Listing> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    return data.product;
  },

  async updateProduct(id: string, productData: Partial<Listing>, isAdmin = false): Promise<Listing> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(isAdmin),
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product');
    return data.product;
  },

  async deleteProduct(id: string, isAdmin = false): Promise<void> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(isAdmin),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to delete product');
    }
  },

  async updateProductStatus(id: string, statusData: { isExpired?: boolean; isSold?: boolean; isFeatured?: boolean; isApproved?: boolean }, isAdmin = false): Promise<Listing> {
    const res = await fetch(`/api/products/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(isAdmin),
      body: JSON.stringify(statusData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product status');
    return data.product;
  },

  async recordInquiry(id: string): Promise<void> {
    fetch(`/api/products/${id}/inquiry`, { method: 'POST' }).catch(() => {});
  },

  async recordView(id: string): Promise<void> {
    fetch(`/api/products/${id}/view`, { method: 'POST' }).catch(() => {});
  },

  // Reports
  async getReports(isAdmin = false): Promise<ComplaintTicket[]> {
    const res = await fetch('/api/reports', {
      headers: getHeaders(isAdmin),
    });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async submitReport(reportData: Partial<ComplaintTicket>): Promise<ComplaintTicket> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(reportData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report');
    return data.ticket;
  },

  async resolveReport(id: string, reply: string, status: ComplaintTicket['status']): Promise<ComplaintTicket> {
    const res = await fetch(`/api/admin/reports/${id}/resolve`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ reply, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve report');
    return data.ticket;
  },

  async deleteReport(id: string): Promise<void> {
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    if (!res.ok) throw new Error('Failed to delete report');
  },

  // Convenience aliases for frontend ease of use
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
