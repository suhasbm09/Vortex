import React, { useState } from 'react';


interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  postContent: string;
}

const CommentModal: React.FC<CommentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  postContent 
}) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(comment.trim());
      setComment('');
      onClose();
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="glass-heavy rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-white/10" 
           style={{ 
             boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
             background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
           }}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Add Comment</h3>
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

        {/* Original Post Preview */}
        <div className="bg-gradient-to-br from-white/8 to-white/4 rounded-2xl p-6 mb-8 border border-white/20 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-3">
            <div className="h-4 w-4 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-full"></div>
            <p className="text-sm font-semibold text-[var(--color-text-muted)]">Replying to:</p>
          </div>
          <p className="text-white text-base leading-relaxed">
            {postContent.length > 150 ? `${postContent.slice(0, 150)}...` : postContent}
          </p>
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">
              Your Comment
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] resize-none transition-all duration-300 text-lg backdrop-blur-sm"
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-3">
              <span className={`text-sm font-medium ${comment.length > 450 ? 'text-yellow-400' : 'text-[var(--color-text-muted)]'}`}>
                {comment.length}/500 characters
              </span>
              {comment.length > 450 && (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-400 font-semibold">
                    Character limit approaching
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!comment.trim() || isSubmitting}
              className="flex-1 py-4 px-6 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%)',
                boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
              }}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white relative z-10"></div>
                  <span className="relative z-10">Posting...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Post Comment</span>
                  <svg className="h-5 w-5 relative z-10 group-hover:scale-110 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CommentModal; 