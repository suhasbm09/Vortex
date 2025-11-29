import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  SparklesIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  LinkIcon,
  ClipboardDocumentIcon,
  EyeIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  FingerPrintIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface MetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: {
    id: string;
    content: string;
    image?: string | null;
    timestamp: string;
    author: {
      address: string;
      displayName: string;
    };
    solanaLogged?: boolean;
    solanaTxHash?: string | null;
    post_hash?: string;
  };
}

const MetadataModal: React.FC<MetadataModalProps> = ({ isOpen, onClose, post }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'blockchain' | 'content'>('overview');

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const openSolscan = (txHash: string) => {
    window.open(`https://solscan.io/tx/${txHash}?cluster=devnet`, '_blank');
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getBlockchainStatus = () => {
    if (post.solanaTxHash) {
      return {
        status: 'verified',
        icon: CheckCircleIcon,
        color: 'from-emerald-500 to-green-500',
        bgColor: 'from-emerald-500/20 to-green-500/20',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        label: 'Verified on Blockchain',
        description: 'This post has been permanently recorded on the Solana blockchain'
      };
    } else if (post.solanaLogged) {
      return {
        status: 'pending',
        icon: ClockIcon,
        color: 'from-blue-500 to-cyan-500',
        bgColor: 'from-blue-500/20 to-cyan-500/20',
        borderColor: 'border-blue-500/30',
        textColor: 'text-blue-400',
        label: 'Processing on Blockchain',
        description: 'Transaction is being processed on the Solana network'
      };
    } else {
      return {
        status: 'failed',
        icon: ExclamationTriangleIcon,
        color: 'from-amber-500 to-orange-500',
        bgColor: 'from-amber-500/20 to-orange-500/20',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        label: 'Not on Blockchain',
        description: 'This post was not logged to the Solana blockchain'
      };
    }
  };

  const blockchainStatus = getBlockchainStatus();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(10,10,15,0.95) 0%, rgba(0,0,0,0.98) 100%)',
        backdropFilter: 'blur(20px)',
      }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-[var(--color-accent)]/10 to-[var(--color-accent-secondary)]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-gradient-to-br from-[var(--color-accent-secondary)]/8 to-[var(--color-accent)]/8 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
      </div>

      <div
        className="relative w-full max-w-4xl mx-4 max-h-[90vh] rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl overflow-hidden flex flex-col animate-scaleIn"
        style={{
          boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
        }}
      >
        {/* Premium Header */}
        <div className="sticky top-0 z-20 bg-black/60 backdrop-blur-2xl px-2 sm:px-4 pt-3 sm:pt-3 pb-2 sm:pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-6">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 animate-pulseGlow">
                <SparklesIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                  Post Metadata
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-muted)] font-medium mt-1">
                  Blockchain verification & content details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 sm:p-4 rounded-2xl hover:bg-white/10 transition-all duration-300 text-[var(--color-text-muted)] hover:text-white group hover:scale-110"
              aria-label="Close metadata modal"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 sm:space-x-2 mt-4 sm:mt-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: EyeIcon },
              { id: 'blockchain', label: 'Blockchain', icon: ShieldCheckIcon },
              { id: 'content', label: 'Content', icon: DocumentTextIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-6 py-2 sm:py-3 rounded-2xl font-bold transition-all duration-300 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white shadow-lg'
                    : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-8 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeInUp">
              {/* Blockchain Status Card */}
              <div className="glass-heavy rounded-3xl p-8 border border-white/20 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`h-12 w-12 bg-gradient-to-br ${blockchainStatus.color} rounded-3xl flex items-center justify-center shadow-xl border border-white/20`}>
                        <blockchainStatus.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-white">Blockchain Status</h4>
                        <p className="text-[var(--color-text-muted)] font-medium">{blockchainStatus.description}</p>
                      </div>
                    </div>
                    <span className={`px-6 py-3 bg-gradient-to-r ${blockchainStatus.bgColor} ${blockchainStatus.borderColor} ${blockchainStatus.textColor} rounded-2xl text-sm font-bold backdrop-blur-sm border`}>
                      {blockchainStatus.label}
                    </span>
                  </div>
                  
                  {post.solanaTxHash && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center space-x-4">
                          <FingerPrintIcon className="h-6 w-6 text-[var(--color-accent)]" />
                          <div>
                            <span className="text-sm font-semibold text-[var(--color-text-muted)]">Transaction Hash</span>
                            <div className="flex items-center space-x-3 mt-1">
                              <code className="text-sm text-white font-mono font-bold">
                                {shortenHash(post.solanaTxHash)}
                              </code>
                              <button
                                onClick={() => copyToClipboard(post.solanaTxHash!, 'txHash')}
                                className="p-2 hover:bg-[var(--color-accent)]/20 rounded-xl transition-all duration-200 hover:scale-110"
                                title="Copy hash"
                              >
                                {copiedField === 'txHash' ? (
                                  <CheckCircleIcon className="h-4 w-4 text-green-400" />
                                ) : (
                                  <ClipboardDocumentIcon className="h-4 w-4 text-[var(--color-accent)]" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => openSolscan(post.solanaTxHash!)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] hover:from-[var(--color-accent-secondary)] hover:to-[var(--color-accent)] text-white rounded-xl transition-all duration-300 font-bold hover:scale-105 shadow-lg"
                        >
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Author Info */}
                <div className="glass-heavy rounded-3xl p-6 border border-white/20 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-2xl flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-[var(--color-accent)]" />
                    </div>
                    <h5 className="text-lg font-bold text-white">Author</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20">
                      <span className="text-sm font-semibold text-[var(--color-text-muted)]">Display Name</span>
                      <span className="text-sm text-white font-bold">{post.author.displayName}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20">
                      <span className="text-sm font-semibold text-[var(--color-text-muted)]">Wallet Address</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-white font-mono font-bold">
                          {shortenAddress(post.author.address)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(post.author.address, 'address')}
                          className="p-1 hover:bg-[var(--color-accent)]/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Copy address"
                        >
                          {copiedField === 'address' ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-3 w-3 text-[var(--color-accent)]" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Post Details */}
                <div className="glass-heavy rounded-3xl p-6 border border-white/20 shadow-2xl backdrop-blur-sm">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-2xl flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-[var(--color-accent)]" />
                    </div>
                    <h5 className="text-lg font-bold text-white">Post Details</h5>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20">
                      <span className="text-sm font-semibold text-[var(--color-text-muted)]">Created</span>
                      <span className="text-sm text-white font-medium">{formatTimestamp(post.timestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20">
                      <span className="text-sm font-semibold text-[var(--color-text-muted)]">Post ID</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-white font-mono font-bold">{post.id}</code>
                        <button
                          onClick={() => copyToClipboard(post.id, 'postId')}
                          className="p-1 hover:bg-[var(--color-accent)]/20 rounded-lg transition-all duration-200 hover:scale-110"
                          title="Copy ID"
                        >
                          {copiedField === 'postId' ? (
                            <CheckCircleIcon className="h-3 w-3 text-green-400" />
                          ) : (
                            <ClipboardDocumentIcon className="h-3 w-3 text-[var(--color-accent)]" />
                          )}
                        </button>
                      </div>
                    </div>
                    {post.post_hash && (
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20">
                        <span className="text-sm font-semibold text-[var(--color-text-muted)]">Content Hash</span>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm text-white font-mono font-bold">
                            {shortenHash(post.post_hash)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(post.post_hash!, 'contentHash')}
                            className="p-1 hover:bg-[var(--color-accent)]/20 rounded-lg transition-all duration-200 hover:scale-110"
                            title="Copy hash"
                          >
                            {copiedField === 'contentHash' ? (
                              <CheckCircleIcon className="h-3 w-3 text-green-400" />
                            ) : (
                              <ClipboardDocumentIcon className="h-3 w-3 text-[var(--color-accent)]" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain Tab */}
          {activeTab === 'blockchain' && (
            <div className="space-y-8 animate-fadeInUp">
              <div className="glass-heavy rounded-3xl p-8 border border-white/20 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-4 mb-6">
                  <div className={`h-12 w-12 bg-gradient-to-br ${blockchainStatus.color} rounded-3xl flex items-center justify-center shadow-xl border border-white/20`}>
                    <blockchainStatus.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">Solana Blockchain</h4>
                    <p className="text-[var(--color-text-muted)] font-medium">Transaction verification details</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/20 text-center">
                      <div className={`h-12 w-12 bg-gradient-to-br ${blockchainStatus.color} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                        <ShieldCheckIcon className="h-6 w-6 text-white" />
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">Verification Status</h5>
                      <p className={`text-xs font-medium ${blockchainStatus.textColor}`}>{blockchainStatus.label}</p>
                    </div>
                    
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/20 text-center">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <LinkIcon className="h-6 w-6 text-white" />
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">Network</h5>
                      <p className="text-xs font-medium text-blue-400">Solana Devnet</p>
                    </div>
                    
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/20 text-center">
                      <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <SparklesIcon className="h-6 w-6 text-white" />
                      </div>
                      <h5 className="text-sm font-bold text-white mb-1">Program</h5>
                      <p className="text-xs font-medium text-purple-400">VORTEX Protocol</p>
                    </div>
                  </div>

                  {post.solanaTxHash && (
                    <div className="space-y-4">
                      <h5 className="text-lg font-bold text-white">Transaction Details</h5>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[var(--color-text-muted)]">Transaction Hash</span>
                          <div className="flex items-center space-x-3">
                            <code className="text-sm text-white font-mono font-bold">
                              {shortenHash(post.solanaTxHash)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(post.solanaTxHash!, 'txHash')}
                              className="p-2 hover:bg-[var(--color-accent)]/20 rounded-xl transition-all duration-200 hover:scale-110"
                              title="Copy hash"
                            >
                              {copiedField === 'txHash' ? (
                                <CheckCircleIcon className="h-4 w-4 text-green-400" />
                              ) : (
                                <ClipboardDocumentIcon className="h-4 w-4 text-[var(--color-accent)]" />
                              )}
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => openSolscan(post.solanaTxHash!)}
                          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] hover:from-[var(--color-accent-secondary)] hover:to-[var(--color-accent)] text-white rounded-2xl transition-all duration-300 font-bold hover:scale-[1.02] shadow-xl"
                        >
                          <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                          <span>View on Solscan Explorer</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-8 animate-fadeInUp">
              <div className="glass-heavy rounded-3xl p-8 border border-white/20 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-12 w-12 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">Content Details</h4>
                    <p className="text-[var(--color-text-muted)] font-medium">Post content and metadata</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/20">
                    <h5 className="text-lg font-bold text-white mb-4">Post Content</h5>
                    <div className="p-4 bg-black/20 rounded-2xl border border-white/10">
                      <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                    </div>
                  </div>
                  
                  {post.image && (
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/20">
                      <h5 className="text-lg font-bold text-white mb-4">Attached Image</h5>
                      <div className="relative group">
                        <img
                          src={post.image}
                          alt="Post content"
                          className="w-full rounded-2xl object-cover max-h-64 border border-white/20 shadow-xl group-hover:scale-[1.02] transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  )}
                  
                  {post.post_hash && (
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/20">
                      <h5 className="text-lg font-bold text-white mb-4">Content Verification</h5>
                      <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/10">
                        <div className="flex items-center space-x-3">
                          <FingerPrintIcon className="h-5 w-5 text-[var(--color-accent)]" />
                          <span className="text-sm font-semibold text-[var(--color-text-muted)]">Content Hash</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <code className="text-sm text-white font-mono font-bold">
                            {shortenHash(post.post_hash)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(post.post_hash!, 'contentHash')}
                            className="p-2 hover:bg-[var(--color-accent)]/20 rounded-xl transition-all duration-200 hover:scale-110"
                            title="Copy hash"
                          >
                            {copiedField === 'contentHash' ? (
                              <CheckCircleIcon className="h-4 w-4 text-green-400" />
                            ) : (
                              <ClipboardDocumentIcon className="h-4 w-4 text-[var(--color-accent)]" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end bg-black/60 backdrop-blur-2xl px-2 sm:px-8 py-2 sm:py-2 sticky bottom-0 z-10 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 sm:px-8 sm:py-3 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-bold backdrop-blur-sm hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/30"
          >
            Close
          </button>
        </div>
      </div>

      {/* Enhanced scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(120deg, rgba(255,255,255,0.1) 40%, var(--color-accent) 100%);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--color-accent) rgba(255,255,255,0.1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
        .animate-fadeInUp { animation: fadeInUp 0.4s ease-out; }
        .animate-pulseGlow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default MetadataModal; 