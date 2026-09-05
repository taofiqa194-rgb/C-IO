import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { UNILORIN_CAMPUS_LOCATIONS } from '../data/mockData';
import { api } from '../utils/api';
import { 
  GraduationCap, 
  Store, 
  ShoppingBag, 
  ShieldCheck, 
  X, 
  LogIn, 
  UserPlus, 
  User as UserIcon, 
  LogOut, 
  Camera, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChange: (user: User | null) => void;
  initialTab?: 'login' | 'register' | 'profile';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChange,
  initialTab = 'login',
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'profile'>(
    currentUser ? 'profile' : initialTab
  );

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isResetPasswordMode, setIsResetPasswordMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Registration form state
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [campusLocation, setCampusLocation] = useState(UNILORIN_CAMPUS_LOCATIONS[0]);
  const [matricNumber, setMatricNumber] = useState('');
  const [faculty, setFaculty] = useState('Faculty of Arts / Social Sciences');
  const [department, setDepartment] = useState('Accounting / Business Admin');
  const [businessName, setBusinessName] = useState('');

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || '');
      setEditPhone(currentUser.phone || '');
      setEditEmail(currentUser.email || '');
      setEditLocation(currentUser.campusLocation || UNILORIN_CAMPUS_LOCATIONS[0]);
      setEditAvatar(currentUser.avatarUrl || '');
      if (activeTab === 'login' || activeTab === 'register') {
        setActiveTab('profile');
      }
    } else {
      if (activeTab === 'profile') {
        setActiveTab('login');
      }
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setFormError('Please enter your phone number/email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(loginIdentifier.trim(), loginPassword);
      onUserChange(res.user);
      setSuccessMessage(`Welcome back, ${res.user.name}!`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1000);
    } catch (err: any) {
      setFormError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');
    if (!resetEmail.trim()) {
      setFormError('Please enter your account email address to receive reset instructions.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(resetEmail.trim());
      setSuccessMessage('Password reset link sent! Please check your email inbox.');
      setIsResetPasswordMode(false);
      setResetEmail('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter your WhatsApp phone number');
      return;
    }
    if (!password || password.length < 6) {
      setFormError('Password must be at least 6 characters long');
      return;
    }
    if (role === 'student' && !matricNumber.trim()) {
      setFormError('Please enter your Unilorin matric number');
      return;
    }
    if (role === 'business' && !businessName.trim()) {
      setFormError('Please enter your registered business name');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        campusLocation,
        matricNumber: role === 'student' ? matricNumber.trim().toUpperCase() : undefined,
        faculty: role === 'student' ? faculty : undefined,
        department: role === 'student' ? department : undefined,
        businessName: role === 'business' ? businessName.trim() : undefined,
      };

      const res = await api.register(payload);
      onUserChange(res.user);
      setSuccessMessage('Account created successfully! You are now logged in.');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!editName.trim() || !editPhone.trim()) {
      setFormError('Name and phone number are required.');
      return;
    }

    setLoading(true);
    try {
      const updated = await api.updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
        campusLocation: editLocation,
        avatarUrl: editAvatar || currentUser?.avatarUrl,
      });
      onUserChange(updated);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    onUserChange(null);
    setActiveTab('login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div 
        id="user-auth-modal-card" 
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#E0E0D5] my-8"
      >
        <button
          id="close-user-auth-btn"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-[#7A7A6A] hover:bg-[#F5F5F0] hover:text-[#2D2D2A] transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#5A5A40] text-white font-serif font-bold text-xl mb-2 shadow-xs border border-[#E0E0D5]">
            C'IO
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2D2D2A]">
            {currentUser ? 'My Account' : 'University of Ilorin Mini Campus'}
          </h2>
          <p className="text-xs text-[#7A7A6A] mt-1">
            {currentUser 
              ? `Logged in as ${currentUser.name}`
              : 'Buy and sell safely within University of Ilorin Mini Campus'
            }
          </p>
        </div>

        {/* Error / Success alerts */}
        {formError && (
          <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-[#5A5A40]/10 border border-[#5A5A40]/30 text-[#5A5A40] text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab switcher (Login / Register / Profile) */}
        <div className="flex border-b border-[#E0E0D5] mb-6">
          {!currentUser ? (
            <>
              <button
                id="auth-tab-login"
                onClick={() => { setActiveTab('login'); setFormError(''); }}
                className={`flex-1 pb-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'login'
                    ? 'border-[#5A5A40] text-[#5A5A40]'
                    : 'border-transparent text-[#7A7A6A] hover:text-[#2D2D2A]'
                }`}
              >
                <LogIn className="h-4 w-4" />
                <span>Log In</span>
              </button>
              <button
                id="auth-tab-register"
                onClick={() => { setActiveTab('register'); setFormError(''); }}
                className={`flex-1 pb-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition ${
                  activeTab === 'register'
                    ? 'border-[#5A5A40] text-[#5A5A40]'
                    : 'border-transparent text-[#7A7A6A] hover:text-[#2D2D2A]'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-between pb-3">
              <span className="text-xs font-bold text-[#5A5A40] flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" /> Profile & Settings
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          )}
        </div>

        {/* LOGIN / RESET PASSWORD FORM */}
        {activeTab === 'login' && !currentUser && (
          isResetPasswordMode ? (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                  Your Account Email Address
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="e.g. yourname@gmail.com or matric@unilorin.edu.ng"
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm text-[#2D2D2A] placeholder:text-[#A0A090] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
                <p className="text-[11px] text-[#7A7A6A] mt-1">
                  We'll send a secure password reset link to this email address via Firebase.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white font-bold py-3 rounded-full text-xs sm:text-sm transition shadow-xs disabled:opacity-60"
              >
                {loading ? 'Sending link...' : 'Send Password Reset Email'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setIsResetPasswordMode(false); setFormError(''); }}
                  className="text-xs font-semibold text-[#5A5A40] hover:underline"
                >
                  ← Back to Log In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">
                  Phone Number or Email
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. 08142345678 or student@unilorin.edu.ng"
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm text-[#2D2D2A] placeholder:text-[#A0A090] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#2D2D2A]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setIsResetPasswordMode(true); setFormError(''); setResetEmail(loginIdentifier.includes('@') ? loginIdentifier : ''); }}
                    className="text-[11px] font-medium text-[#5A5A40] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2.5 text-xs sm:text-sm text-[#2D2D2A] placeholder:text-[#A0A090] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white font-bold py-3 rounded-full text-xs sm:text-sm transition shadow-xs disabled:opacity-60"
              >
                {loading ? 'Logging in...' : 'Log In to Account'}
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-[#7A7A6A]">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setFormError(''); }}
                  className="text-xs font-bold text-[#5A5A40] hover:underline"
                >
                  Register Here
                </button>
              </div>
            </form>
          )
        )}

        {/* REGISTRATION FORM */}
        {activeTab === 'register' && !currentUser && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1.5">I am registering as:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-2 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    role === 'student'
                      ? 'border-[#5A5A40] bg-[#5A5A40]/10 text-[#5A5A40] font-bold'
                      : 'border-[#E0E0D5] bg-white text-[#7A7A6A]'
                  }`}
                >
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-[11px]">Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`p-2 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    role === 'buyer'
                      ? 'border-[#5A5A40] bg-[#5A5A40]/10 text-[#5A5A40] font-bold'
                      : 'border-[#E0E0D5] bg-white text-[#7A7A6A]'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span className="text-[11px]">Buyer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('business')}
                  className={`p-2 rounded-2xl border text-center transition flex flex-col items-center gap-1 ${
                    role === 'business'
                      ? 'border-[#5A5A40] bg-[#5A5A40]/10 text-[#5A5A40] font-bold'
                      : 'border-[#E0E0D5] bg-white text-[#7A7A6A]'
                  }`}
                >
                  <Store className="h-4 w-4" />
                  <span className="text-[11px]">Business</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kehinde Adeyemi"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">WhatsApp Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08142345678"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
              <p className="text-[10px] text-[#7A7A6A] mt-0.5">Used by buyers to contact you directly on WhatsApp for orders</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. kehinde@students.unilorin.edu.ng"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Create Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">University of Ilorin Mini Campus Location</label>
              <select
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              >
                {UNILORIN_CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {role === 'student' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Unilorin Matric Number *</label>
                  <input
                    type="text"
                    required
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    placeholder="e.g. 21/55EC102"
                    className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                  />
                  <p className="text-[10px] text-[#7A7A6A] mt-0.5">Admin verifies this to issue your student Verified badge.</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Faculty</label>
                    <input
                      type="text"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      placeholder="e.g. Arts / Management"
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Business Admin"
                      className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                    />
                  </div>
                </div>
              </>
            )}

            {role === 'business' && (
              <div>
                <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Registered Business Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Mini Campus Gadgets & Bookshop"
                  className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white font-bold py-3 rounded-full text-xs sm:text-sm transition shadow-xs disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account & Continue'}
            </button>

            <div className="text-center pt-2">
              <span className="text-xs text-[#7A7A6A]">Already have an account? </span>
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setFormError(''); }}
                className="text-xs font-bold text-[#5A5A40] hover:underline"
              >
                Log In Here
              </button>
            </div>
          </form>
        )}

        {/* PROFILE MANAGEMENT (when user is logged in) */}
        {currentUser && (
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Avatar & Badges */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#F5F5F0] border border-[#E0E0D5]">
              <div className="relative">
                <img
                  src={editAvatar || currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#5A5A40]"
                />
                <label className="absolute bottom-0 right-0 p-1.5 bg-[#5A5A40] hover:bg-[#474732] text-white rounded-full cursor-pointer shadow-xs">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#2D2D2A]">{currentUser.name}</h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[11px] bg-[#E8E8DF] text-[#5A5A40] font-semibold px-2 py-0.5 rounded-full capitalize">
                    {currentUser.role}
                  </span>
                  {currentUser.isMatricVerified && (
                    <span className="text-[11px] bg-[#5A5A40]/15 text-[#5A5A40] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Matric Verified
                    </span>
                  )}
                </div>
                {currentUser.matricNumber && (
                  <p className="text-[11px] font-mono text-[#7A7A6A] mt-1">Matric: {currentUser.matricNumber}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Full Name</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">WhatsApp Phone Number</label>
              <input
                type="tel"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-4 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2D2D2A] mb-1">Primary Campus Pickup Location</label>
              <select
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                className="w-full rounded-2xl border border-[#E0E0D5] bg-[#F5F5F0] px-3 py-2 text-xs sm:text-sm text-[#2D2D2A] focus:bg-white focus:border-[#5A5A40] focus:outline-hidden"
              >
                {UNILORIN_CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5A5A40] hover:bg-[#474732] active:bg-[#383827] text-white font-bold py-3 rounded-full text-xs sm:text-sm transition shadow-xs disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
