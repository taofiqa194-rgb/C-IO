import React, { useState } from 'react';
import { api } from '../utils/api';
import { ShieldCheck, Lock, User, AlertTriangle, CheckCircle2, ArrowRight, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminAuthenticated: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onAdminAuthenticated,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim() || !password) {
      setError('Please enter both Admin Username/Email and Admin Password.');
      return;
    }

    setLoading(true);
    try {
      await api.adminLogin(identifier.trim(), password);
      onAdminAuthenticated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid administrator credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div
        id="admin-login-card"
        className="relative w-full max-w-md rounded-3xl bg-[#2D2D2A] text-[#F5F5F0] p-6 sm:p-8 shadow-2xl border border-[#5A5A40]/40 my-8"
      >
        <button
          id="close-admin-login-btn"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#A0A090] hover:bg-[#383827] hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Security Badge Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#5A5A40] text-white mb-3 shadow-lg border border-[#D9D9C8]/20">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
            Administrator Portal
          </h2>
          <p className="text-xs text-[#D9D9C8]/80 mt-1 max-w-xs mx-auto">
            Authorized University of Ilorin Mini Campus Marketplace Administration only.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#D9D9C8] mb-1.5 uppercase tracking-wider">
              Admin Username or Email
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-[#A0A090]" />
              <input
                type="text"
                id="admin-username-input"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. admin"
                className="w-full rounded-2xl border border-[#5A5A40]/50 bg-[#1F1F1D] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#7A7A6A] focus:border-[#D9D9C8] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#D9D9C8] mb-1.5 uppercase tracking-wider">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#A0A090]" />
              <input
                type="password"
                id="admin-password-input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-2xl border border-[#5A5A40]/50 bg-[#1F1F1D] pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-[#7A7A6A] focus:border-[#D9D9C8] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="submit-admin-login-btn"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white font-bold py-3 rounded-full text-xs sm:text-sm transition shadow-lg border border-[#D9D9C8]/30 disabled:opacity-60"
            >
              <span>{loading ? 'Authenticating...' : 'Secure Admin Login'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[#5A5A40]/30 text-center">
          <p className="text-[11px] text-[#A0A090] leading-relaxed">
            All administrative actions are authenticated and validated on the server.
          </p>
        </div>
      </div>
    </div>
  );
};
