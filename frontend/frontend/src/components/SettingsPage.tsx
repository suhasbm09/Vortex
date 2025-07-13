import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import {
  UserIcon,
  TrashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

// Inline SVGs for missing icons
const CameraIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75V7.5A2.25 2.25 0 014.5 5.25h2.086a2.25 2.25 0 001.591-.659l.828-.828A2.25 2.25 0 0110.914 3h2.172a2.25 2.25 0 011.591.659l.828.828a2.25 2.25 0 001.591.659H19.5a2.25 2.25 0 012.25 2.25v11.25a2.25 2.25 0 01-2.25 2.25H4.5A2.25 2.25 0 012.25 18.75z" />
    <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth={1.5} />
  </svg>
);
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
  </svg>
);
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M21 19a2 2 0 01-1.73 1H4.73A2 2 0 013 19l7.29-12.29a2 2 0 013.42 0L21 19z" />
  </svg>
);

const SettingsPage: React.FC = () => {
  const { publicKey, disconnect } = useWallet();
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    email: '',
    website: '',
    twitter: '',
    instagram: '',
    location: '',
    profileImage: '',
    joined: '',
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.display_name || '',
        bio: user.bio || '',
        email: user.email || '',
        website: user.website || '',
        twitter: user.twitter || '',
        instagram: user.instagram || '',
        location: user.location || '',
        profileImage: user.profile_image || '',
        joined: user.created_at ? new Date(user.created_at).toLocaleDateString() : '',
      });
      setImagePreview(user.profile_image || null);
      setLoading(false);
    }
  }, [user]);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to delete account:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 200x200)
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB. Please choose a smaller image.');
        return;
      }
      
      try {
        const compressedImage = await compressImage(file);
        setImagePreview(compressedImage);
        setProfileData((prev) => ({ ...prev, profileImage: compressedImage }));
        setError(''); // Clear any previous errors
      } catch (error) {
        console.error('Error compressing image:', error);
        setError('Failed to process image. Please try again.');
      }
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!publicKey) return;
    if (!profileData.displayName.trim()) return;
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/api/users/profile/${publicKey.toBase58()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profileData.displayName.trim(),
          bio: profileData.bio,
          email: profileData.email,
          website: profileData.website,
          twitter: profileData.twitter,
          instagram: profileData.instagram,
          location: profileData.location,
          profile_image: profileData.profileImage,
        })
      });
      if (!res.ok) throw new Error('Failed to save profile');
      
      // Fetch updated user data to get the new profile_completed status
      const userRes = await fetch(`http://localhost:8000/api/users/me/${publicKey.toBase58()}`);
      if (userRes.ok) {
        const responseData = await userRes.json();
        if (responseData.success && responseData.user) {
          setUser(responseData.user);
        } else {
          // Fallback: update user context with local data and assume profile is completed
          if (user) {
            const updatedUser = {
              ...user,
              display_name: profileData.displayName.trim(),
              bio: profileData.bio,
              email: profileData.email,
              website: profileData.website,
              twitter: profileData.twitter,
              instagram: profileData.instagram,
              location: profileData.location,
              profile_image: profileData.profileImage,
              profile_completed: true // Since display name is provided, profile should be completed
            };
            setUser(updatedUser);
          }
        }
      } else {
        // Fallback: update user context with local data and assume profile is completed
        if (user) {
          const updatedUser = {
            ...user,
            display_name: profileData.displayName.trim(),
            bio: profileData.bio,
            email: profileData.email,
            website: profileData.website,
            twitter: profileData.twitter,
            instagram: profileData.instagram,
            location: profileData.location,
            profile_image: profileData.profileImage,
            profile_completed: true // Since display name is provided, profile should be completed
          };
          setUser(updatedUser);
        }
      }
      
      setShowSaveModal(true);
      setTimeout(() => setShowSaveModal(false), 3000);
    } catch (err: unknown) {
      const error = err as Error;
      setError(`Failed to save profile: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent-secondary)]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-[var(--color-accent-secondary)]/10 to-[var(--color-accent)]/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="glass-heavy rounded-3xl p-10 flex flex-col items-center max-w-md animate-fadeInUp relative z-10">
          <div className="h-16 w-16 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mb-6 animate-pulseGlow">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-[var(--color-accent)] border-r-[var(--color-accent-secondary)]"></div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Loading Profile</h3>
          <p className="text-[var(--color-text-muted)] text-center">Preparing your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] relative overflow-hidden">
      {/* Premium animated background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-[var(--color-accent)]/8 to-[var(--color-accent-secondary)]/8 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-[var(--color-accent-secondary)]/6 to-[var(--color-accent)]/6 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute -bottom-32 left-1/3 w-[300px] h-[300px] bg-gradient-to-br from-[var(--color-accent)]/4 to-purple-600/4 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />
      </div>

      {/* Premium Glassy Header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-black/60 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-3 rounded-2xl hover:bg-white/10 transition-all duration-200 text-[var(--color-text-muted)] hover:text-[var(--color-accent)] group"
              >
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-secondary)] to-[var(--color-accent)] rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 animate-pulseGlow">
                  <SparklesIcon className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight text-white mb-1" style={{ letterSpacing: '-0.04em' }}>
                    Settings
                  </h1>
                  <p className="text-sm text-[var(--color-text-muted)] font-medium">
                    Manage your PROVEXA profile
                  </p>
                </div>
              </div>
            </div>
            {/* User Info */}
            <div className="flex items-center space-x-3 bg-gradient-to-r from-white/10 to-white/5 border border-white/20 rounded-2xl px-5 py-3 shadow-xl backdrop-blur-xl">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt="Avatar"
                  className="h-10 w-10 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                />
              ) : (
                <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent-secondary)]/30 rounded-2xl flex items-center justify-center border-2 border-white/20">
                  <UserIcon className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">
                  {user?.display_name || 'User'}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Wallet'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-32 px-4 sm:px-6 lg:px-8 animate-fadeInUp">
        <div className="space-y-8">
          {/* Account Profile */}
          <div className="glass-heavy rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <span>Account Profile</span>
            </h2>
            <form className="space-y-8" onSubmit={handleSaveProfile}>
              {/* Avatar Upload */}
              <div className="flex items-center space-x-8 mb-8">
                <div className="relative">
                  {/* Avatar Preview or Placeholder */}
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-24 h-24 object-cover rounded-3xl border-4 border-white/20 shadow-2xl"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center border-4 border-white/20 shadow-2xl">
                      <UserIcon className="w-12 h-12 text-[var(--color-accent)]" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] p-3 rounded-2xl border-2 border-white shadow-xl hover:scale-110 transition-all duration-200"
                    title="Change Avatar"
                  >
                    <CameraIcon className="h-4 w-4 text-white" />
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.displayName}
                    onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                    placeholder="Enter your display name"
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] transition-all duration-300 input-focus-glow text-lg backdrop-blur-sm"
                    required
                  />
                </div>
              </div>
              
              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                  Bio
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] resize-none transition-all duration-300 input-focus-glow text-lg backdrop-blur-sm"
                />
              </div>
              
              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="you@email.com"
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] transition-all duration-300 input-focus-glow backdrop-blur-sm"
                  />
                </div>
                
                {/* Website */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileData.website}
                    onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] transition-all duration-300 input-focus-glow backdrop-blur-sm"
                  />
                </div>
                
                {/* Twitter */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={profileData.twitter}
                    onChange={(e) => setProfileData({ ...profileData, twitter: e.target.value })}
                    placeholder="@twitter"
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] transition-all duration-300 input-focus-glow backdrop-blur-sm"
                  />
                </div>
                
                {/* Instagram */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={profileData.instagram}
                    onChange={(e) => setProfileData({ ...profileData, instagram: e.target.value })}
                    placeholder="@instagram"
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] transition-all duration-300 input-focus-glow backdrop-blur-sm"
                  />
                </div>
                
                {/* Location */}
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Location
                  </label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    placeholder="City, Country"
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] transition-all duration-300 input-focus-glow backdrop-blur-sm"
                  />
                </div>
              </div>
              
              {/* Read-only Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Joined
                  </label>
                  <input
                    type="text"
                    value={profileData.joined}
                    readOnly
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed backdrop-blur-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    value={publicKey ? publicKey.toBase58() : ''}
                    readOnly
                    className="w-full px-5 py-4 border border-white/20 rounded-2xl bg-white/5 text-[var(--color-text-muted)] cursor-not-allowed font-mono backdrop-blur-sm"
                  />
                </div>
              </div>
              
              {/* Save Button */}
              <button
                type="submit"
                disabled={isSaving || !profileData.displayName.trim()}
                className="w-full py-5 px-8 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%)',
                  boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
                }}
              >
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white relative z-10"></div>
                    <span className="relative z-10">Saving...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Save Profile</span>
                    <CheckIcon className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                  </>
                )}
              </button>
              {error && (
                <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-red-300 font-medium">{error}</span>
                  </div>
                </div>
              )}
            </form>
          </div>
          
          {/* Delete Account */}
          <div className="glass-heavy rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center space-x-4">
              <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                <TrashIcon className="h-5 w-5 text-white" />
              </div>
              <span>Delete Account</span>
            </h2>
            <div className="bg-gradient-to-r from-red-500/15 to-pink-500/15 border border-red-500/30 rounded-3xl p-6 mb-8 backdrop-blur-sm">
              <div className="flex items-start space-x-4">
                <div className="h-10 w-10 bg-gradient-to-br from-red-500/30 to-pink-500/30 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 border border-red-500/30">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-200 mb-3">
                    This action cannot be undone
                  </h3>
                  <p className="text-red-300 leading-relaxed">
                    This will permanently delete your account and remove all your data from PROVEXA. 
                    All posts, followers, and trust scores will be lost forever.
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-5 px-8 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-xl"
            >
              Delete Account
            </button>
          </div>
        </div>
      </main>
      
      {/* Save Success Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-heavy rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-14 w-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center border border-white/20 shadow-xl">
                <CheckCircleIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                Profile Saved!
              </h3>
            </div>
            <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed text-lg">
              Your profile information has been successfully saved. Changes will be visible immediately.
            </p>
            <button
              onClick={() => setShowSaveModal(false)}
              className="w-full py-4 px-6 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%)',
                boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative z-10">Got it!</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-heavy rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-14 w-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center border border-white/20 shadow-xl">
                <ExclamationTriangleIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                Delete Account
              </h3>
            </div>
            <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed text-lg">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-4 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-2 shadow-xl"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage; 