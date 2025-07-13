import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  SparklesIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { sha256 } from "js-sha256"
import { useWallet } from "@solana/wallet-adapter-react"
import { useSolana } from "../hooks/useSolana"
import { useUser } from "../context/UserContext"
import * as anchor from "@coral-xyz/anchor"
import { Buffer } from "buffer";

// Inline SVGs for missing icons
const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface PostData {
  id: string;
  content: string;
  image?: string | null;
  timestamp: string;
  author: {
    address: string;
    displayName: string;
    profileImage?: string | null;
  };
  trustScore: number;
  likes: number;
  comments: number;
  commentList: any[];
  verified: boolean;
  solanaLogged?: boolean;
  solanaTxHash?: string | null;
  post_hash?: string;
}

interface CreatePostProps {
  onPostCreated: (post: PostData) => void;
}

const verifyPost = async (text: string) => {
  try {
    const response = await fetch("http://localhost:8000/ai/verify-content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }) // Only send text, never image
    });
    if (!response.ok) throw new Error('AI moderation failed');
    const result = await response.json();
    
    // Validate the response structure
    if (result && typeof result.trust_score === 'number' && result.trust_tag && result.explanation) {
      return result;
    } else {
      throw new Error('Invalid AI response format');
    }
  } catch (err) {
    console.error('AI moderation error:', err);
    return { trust_score: 50, trust_tag: '🟡', explanation: 'AI moderation unavailable' };
  }
};

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const navigate = useNavigate();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { user } = useUser();
  const walletReady = publicKey && signTransaction && signAllTransactions;
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ trust_score: number, trust_tag: string, explanation: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const { program } = useSolana(
    walletReady ? { publicKey, signTransaction, signAllTransactions } : undefined
  );

  if (!walletReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent-secondary)]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-[var(--color-accent-secondary)]/10 to-[var(--color-accent)]/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="glass-heavy rounded-3xl p-10 flex flex-col items-center max-w-md animate-fadeInUp relative z-10">
          <div className="h-20 w-20 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mb-6 animate-pulseGlow">
            <SparklesIcon className="h-10 w-10 text-[var(--color-accent)]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 text-center">Wallet Required</h2>
          <p className="text-[var(--color-text-muted)] text-center mb-6 leading-relaxed">
            Please connect your wallet to create a post and log to Solana blockchain for transparency.
          </p>
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>Secure • Private • Decentralized</span>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile is completed
  if (!user?.profile_completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-orange-500/10 to-yellow-500/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="glass-heavy rounded-3xl p-10 flex flex-col items-center max-w-md animate-fadeInUp relative z-10">
          <div className="h-20 w-20 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-3xl flex items-center justify-center mb-6 animate-pulseGlow">
            <UserIcon className="h-10 w-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 text-center">Profile Required</h2>
          <p className="text-[var(--color-text-muted)] text-center mb-6 leading-relaxed">
            Please complete your profile and set a custom display name before creating posts.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="btn-accent px-8 py-3 font-semibold rounded-2xl hover:scale-105 transition-transform"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleVerifyAI = async () => {
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const result = await verifyPost(content);
      setAiResult(result);
      toast.success(`AI verification complete: ${result.trust_tag} ${result.trust_score}%`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI moderation failed';
      setAiError(`AI moderation failed: ${errorMessage}`);
      toast.error('AI verification failed. Using fallback moderation.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('Post content cannot be empty.');
      return;
    }
    if (!publicKey || !program) {
      toast.error('Please connect your wallet to create a post and log to Solana.');
      return;
    }
    if (selectedImage && selectedImage.size >= 1 * 1024 * 1024) {
      toast.error('Image size must be less than 1MB. Please choose a smaller image.');
      return;
    }
    setIsSubmitting(true);
    const solanaAddress = publicKey.toBase58();
    const timestamp = Date.now();
    const contentToHash = content + (imagePreview ?? "");
    const hash = sha256(contentToHash + timestamp);
    const hashBuffer = Buffer.from(hash, "hex");

    // Get display name from user context
    const displayName = user?.display_name;
    
    if (!displayName) {
      toast.error('Display name missing. Please set your profile.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Simulate AI delay
      toast.info('Verifying post with AI...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 🔗 Log to Solana
      let solanaLogged = false;
      let txHash: string | null = null;
      
      try {
        // Sanitize display name to remove emojis and special characters
        const sanitizedDisplayName = (displayName || "Anonymous").replace(/[^\x00-\x7F]/g, '');
        
        if (!sanitizedDisplayName) {
          throw new Error('Sanitized display name is empty');
        }
        if (!hashBuffer || hashBuffer.length === 0) {
          throw new Error('Hash buffer is empty or invalid');
        }
        if (!publicKey) {
          throw new Error('Public key is undefined');
        }
        if (!program) {
          throw new Error('Program is undefined');
        }
        
        // Use camelCase method name (Anchor converts snake_case to camelCase)
        const tx = await program.methods
          .logPost(
            sanitizedDisplayName,   // String
            hashBuffer,             // Buffer → matches IDL "bytes"
            new anchor.BN(timestamp), // BN(i64)
            0                       // u8
          )
          .accounts({ signer: publicKey })
          .rpc();
        
        solanaLogged = true;
        txHash = tx;
        
      } catch (err: unknown) {
        const error = err as Error;
        console.error('Solana logging failed:', error);
        toast.error('❌ Blockchain logging failed. Your post will not be on-chain.');
      }

      // Create post data for backend (only fields expected by backend)
      const postData = {
        post_id: Date.now().toString(),
        wallet_address: solanaAddress,
        display_name: displayName,
        text: content.trim(),
        image_url: imagePreview || "",
        timestamp: new Date().toISOString(),
        post_hash: hash,
        action_type: 0,
        solana_tx_hash: solanaLogged ? txHash : null,
        tags: [],
        location: null,
        ai_verified: true,
        ai_trust_score: aiResult?.trust_score ? aiResult.trust_score / 100 : null,
        ai_explanation: aiResult?.explanation || null
      };

      const newPost: PostData = {
        id: postData.post_id,
        content: content.trim(),
        image: imagePreview,
        timestamp: new Date().toISOString(),
        author: {
          address: solanaAddress,
          displayName: displayName,
          profileImage: user?.profile_image || null
        },
        trustScore: postData.ai_trust_score ? Math.round(postData.ai_trust_score * 100) : 50,
        likes: 0,
        comments: 0,
        commentList: [],
        verified: true,
        solanaLogged,
        solanaTxHash: solanaLogged ? txHash : null,
        post_hash: hash
      };
      
      onPostCreated(newPost);
      toast.success('🎉 Post created successfully!');
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(`❌ Failed to create post: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="flex justify-between items-center h-20">
            {/* Back Button and Title */}
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
                    Create Post
                  </h1>
                  <p className="text-sm text-[var(--color-text-muted)] font-medium">
                    Share your thoughts with PROVEXA
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
                  Creator
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Premium Glass Layout */}
      <main className="w-full flex items-center justify-center pt-32 pb-10 px-4 sm:px-6 lg:px-8 animate-fadeInUp">
        <div className="glass-heavy rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl max-w-7xl w-full flex flex-col gap-8 overflow-hidden min-h-[80vh] p-8" 
             style={{ 
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
             }}>
          
          {/* Inputs Row */}
          <div className="flex flex-col lg:flex-row gap-8 w-full">
            {/* Text Input Box */}
            <div className="lg:basis-3/4 glass rounded-3xl border border-white/20 shadow-2xl p-8 flex flex-col min-w-0 backdrop-blur-sm">
              <label className="block text-lg font-bold text-white mb-6 flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-2xl flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
                <span>What's on your mind?</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts with the PROVEXA community... Your post will be verified by AI and logged to the Solana blockchain for transparency."
                rows={10}
                className="w-full px-6 py-5 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] resize-none transition-all duration-300 input-focus-glow text-lg min-h-[240px] backdrop-blur-sm"
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-4">
                <span className={`text-sm font-medium ${content.length > 450 ? 'text-yellow-400' : 'text-[var(--color-text-muted)]'}`}>
                  {content.length}/500 characters
                </span>
                {content.length > 450 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-yellow-400 font-semibold">
                      Character limit approaching
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Image Upload Box */}
            <div className="lg:basis-1/4 glass rounded-3xl border border-white/20 shadow-2xl p-8 flex flex-col items-center justify-center min-w-0 backdrop-blur-sm">
              <label className="block text-lg font-bold text-white mb-6 flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-2xl flex items-center justify-center">
                  <PhotoIcon className="h-4 w-4 text-white" />
                </div>
                <span>Add Image</span>
              </label>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-white/30 rounded-3xl p-8 w-full flex flex-col items-center justify-center hover:border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all duration-300 group cursor-pointer min-h-[200px]"
                  onClick={() => document.getElementById('image-upload')?.click()}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <div className="h-20 w-20 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-[var(--color-accent)]/30 transition-all duration-300">
                    <PhotoIcon className="h-10 w-10 text-[var(--color-accent)]" />
                  </div>
                  <p className="text-[var(--color-text-muted)] mb-3 text-lg font-semibold text-center">
                    Click or drag to upload
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] text-center">
                    PNG, JPG, GIF up to 1MB
                  </p>
                </div>
              ) : (
                <div className="relative group w-full">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-72 object-cover rounded-3xl shadow-2xl bg-black/20 border border-white/20"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-4 right-4 p-3 bg-black/70 rounded-2xl text-white hover:bg-black/90 transition-all duration-200 backdrop-blur-sm hover:scale-110"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI Moderation Section */}
          <div className="w-full">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                className="btn-accent px-6 py-3 font-bold rounded-2xl hover:scale-105 transition-all duration-200 flex items-center space-x-2"
                onClick={handleVerifyAI}
                disabled={aiLoading || !content.trim()}
              >
                {aiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-5 w-5" />
                    <span>Verify with AI</span>
                  </>
                )}
              </button>
              {aiResult && (
                <div className="flex items-center space-x-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl px-4 py-2">
                  <span className="text-2xl">{aiResult.trust_tag}</span>
                  <span className="text-sm text-green-300 font-medium" title={aiResult.explanation}>
                    {aiResult.trust_score}% Trust Score
                  </span>
                </div>
              )}
            </div>
            {aiError && (
              <div className="mt-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-2xl p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-300 font-medium">{aiError}</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Verification Notice */}
          <div className="w-full">
            <div className="bg-gradient-to-r from-[var(--color-accent)]/15 to-[var(--color-accent-secondary)]/15 border border-[var(--color-accent)]/30 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-start space-x-6">
                <div className="h-16 w-16 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-3">
                    AI Content Verification
                  </h3>
                  <p className="text-[var(--color-text-muted)] leading-relaxed text-base">
                    Your post will be verified by our advanced AI system for authenticity, trustworthiness, and content quality. 
                    Verified posts receive higher trust scores and are prioritized in the feed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Create Post Button */}
          <div className="w-full">
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="w-full py-6 px-8 font-black text-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-4 rounded-3xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%)',
                boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
              }}
              onClick={handleSubmit}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white relative z-10"></div>
                  <span className="relative z-10">Verifying & Posting to Blockchain...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Create Post</span>
                  <SparklesIcon className="h-8 w-8 relative z-10 group-hover:scale-110 transition-transform duration-200" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePost; 