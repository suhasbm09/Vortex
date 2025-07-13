import React from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  postUrl?: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ 
  isOpen, 
  onClose, 
  postContent,
  postUrl
}) => {
  const shareText = postContent.length > 100 ? `${postContent.slice(0, 100)}...` : postContent;
  // Use window.location.origin for the postUrl if not provided
  const urlToShare = postUrl || window.location.origin;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
        </svg>
      ),
      color: 'text-green-400 hover:bg-green-500/10',
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${urlToShare}`)}`;
        window.open(url, '_blank');
      }
    },
    {
      name: 'X (Twitter)',
      icon: (
        <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      color: 'text-blue-400 hover:bg-blue-500/10',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n\n${urlToShare}`)}`;
        window.open(url, '_blank');
      }
    },
    {
      name: 'Copy Link',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      ),
      color: 'text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
      action: async () => {
        try {
          await navigator.clipboard.writeText(urlToShare);
          alert('Link copied to clipboard!');
        } catch (err) {
          console.error('Failed to copy link:', err);
        }
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-heavy rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10" 
           style={{ 
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
             background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
           }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Share Post</h3>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl hover:bg-white/10 transition-all duration-200 text-[var(--color-text-muted)] hover:text-white group"
          >
            <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Post Preview */}
        <div className="bg-gradient-to-br from-white/8 to-white/4 rounded-2xl p-6 mb-8 border border-white/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-3">
            <div className="h-4 w-4 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-full"></div>
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">Sharing:</p>
          </div>
          <p className="text-white text-base leading-relaxed">
            {shareText}
          </p>
        </div>

        {/* Share Options */}
        <div className="space-y-4">
          {shareOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.action();
                onClose();
              }}
              className={`w-full flex items-center space-x-4 p-5 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300 group ${option.color} backdrop-blur-sm hover:scale-[1.02]`}
            >
              <div className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                {option.icon}
              </div>
              <span className="font-bold text-white text-lg">
                {option.name}
              </span>
              <svg className="h-5 w-5 ml-auto text-[var(--color-text-muted)] group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareModal; 