import React from 'react';
import { UserIcon, SparklesIcon } from '@heroicons/react/24/outline';

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
  if (!isOpen) return null;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  const shortenHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  };

  const openSolscan = (txHash: string) => {
    window.open(`https://solscan.io/tx/${txHash}?cluster=devnet`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-[2px] transition-all p-4"
      style={{
        // fallback for browsers that don't support backdrop-filter
        background: 'rgba(10,10,15,0.92)',
      }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="relative max-w-3xl w-full rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl overflow-hidden flex flex-col"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
        }}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-2xl px-8 pt-8 pb-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Post Metadata</h3>
              <p className="text-sm text-[var(--color-text-muted)] font-medium">Blockchain transaction details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/10 transition-all duration-200 text-[var(--color-text-muted)] hover:text-white group"
            aria-label="Close metadata modal"
            tabIndex={0}
          >
            <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Content (scrollable) */}
        <div
          className="flex-1 overflow-y-auto px-8 py-8 space-y-8 custom-scrollbar"
          style={{
            maxHeight: '70vh',
          }}
        >
          {/* Solana Status */}
          <div className="glass-heavy rounded-3xl p-8 border border-white/20 shadow-2xl backdrop-blur-sm" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white flex items-center space-x-3">
                <div className="h-6 w-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span>Solana Blockchain Status</span>
              </h4>
              {post.solanaLogged ? (
                <span className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-400 rounded-2xl text-sm font-bold backdrop-blur-sm">
                  Verified on Blockchain
                </span>
              ) : (
                <span className="px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-400 rounded-2xl text-sm font-bold backdrop-blur-sm">
                  Not on Blockchain
                </span>
              )}
            </div>
            {post.solanaLogged && post.solanaTxHash ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                  <span className="text-sm font-semibold text-[var(--color-text-muted)]">Transaction Hash:</span>
                  <div className="flex items-center space-x-3">
                    <code className="text-sm text-white font-mono font-bold">
                      {shortenHash(post.solanaTxHash)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(post.solanaTxHash!)}
                      className="p-2 hover:bg-[var(--color-accent)]/20 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] hover:scale-110"
                      title="Copy hash"
                      tabIndex={0}
                    >
                      <span className="text-[var(--color-accent)] text-sm">📋</span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => openSolscan(post.solanaTxHash!)}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] hover:from-[var(--color-accent-secondary)] hover:to-[var(--color-accent)] text-white rounded-2xl transition-all duration-300 font-bold focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/30 hover:scale-[1.02] shadow-xl"
                  tabIndex={0}
                >
                  <span>🔗</span>
                  <span>View on Solscan</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl backdrop-blur-sm">
                <span className="text-yellow-400 text-xl">⚠️</span>
                <span className="text-sm text-yellow-400 font-medium">
                  This post was not logged to the Solana blockchain
                </span>
              </div>
            )}
          </div>

          {/* Post Details */}
          <div className="glass-heavy rounded-3xl p-8 border border-white/20 shadow-2xl backdrop-blur-sm" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <h4 className="text-xl font-bold text-white mb-6">Post Information</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                <span className="text-sm font-semibold text-[var(--color-text-muted)] flex items-center space-x-3">
                  <UserIcon className="h-5 w-5" />
                  <span>Author:</span>
                </span>
                <span className="text-sm text-white font-bold">{post.author.displayName}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                <span className="text-sm font-semibold text-[var(--color-text-muted)] flex items-center space-x-3">
                  <span>🕐</span>
                  <span>Created:</span>
                </span>
                <span className="text-sm text-white font-medium">{formatTimestamp(post.timestamp)}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                <span className="text-sm font-semibold text-[var(--color-text-muted)]">Post ID:</span>
                <div className="flex items-center space-x-3">
                  <code className="text-sm text-white font-mono font-bold">{post.id}</code>
                  <button
                    onClick={() => copyToClipboard(post.id)}
                    className="p-2 hover:bg-[var(--color-accent)]/20 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] hover:scale-110"
                    title="Copy ID"
                    tabIndex={0}
                  >
                    <span className="text-[var(--color-accent)] text-sm">📋</span>
                  </button>
                </div>
              </div>
              {post.post_hash && (
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
                  <span className="text-sm font-semibold text-[var(--color-text-muted)]">Content Hash:</span>
                  <div className="flex items-center space-x-3">
                    <code className="text-sm text-white font-mono font-bold">
                      {shortenHash(post.post_hash)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(post.post_hash!)}
                      className="p-2 hover:bg-[var(--color-accent)]/20 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] hover:scale-110"
                      title="Copy hash"
                      tabIndex={0}
                    >
                      <span className="text-[var(--color-accent)] text-sm">📋</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Preview */}
          <div className="glass-heavy rounded-3xl p-8 border border-white/20 shadow-2xl backdrop-blur-sm" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <h4 className="text-xl font-bold text-white mb-6">Content Preview</h4>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
              <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
            {post.image && (
              <div className="mt-4">
                <img
                  src={post.image}
                  alt="Post content"
                  className="w-full rounded-2xl object-cover max-h-48 border border-white/20 shadow-xl"
                />
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Footer */}
        <div className="flex justify-end bg-black/60 backdrop-blur-2xl px-8 py-6 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="px-8 py-4 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-bold backdrop-blur-sm hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/30"
            tabIndex={0}
          >
            Close
          </button>
        </div>
      </div>
      {/* Custom dark scrollbar styles */}
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
      `}</style>
    </div>
  );
};

export default MetadataModal; 