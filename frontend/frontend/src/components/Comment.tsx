import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    timestamp: string;
    author: {
      address: string;
      displayName: string;
    };
  };
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="flex space-x-4 p-5 hover:bg-white/5 rounded-2xl transition-all duration-300 group backdrop-blur-sm border border-white/5 hover:border-white/10">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-lg group-hover:scale-110 transition-transform duration-300">
          <UserIcon className="h-5 w-5 text-[var(--color-accent)]" />
        </div>
      </div>
      
      {/* Comment Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3 mb-2">
          <span className="font-bold text-white text-base">
            {comment.author.displayName}
          </span>
          <span className="text-[var(--color-text-muted)] text-sm font-medium">
            {comment.author.address}
          </span>
          <span className="text-[var(--color-text-muted)] text-sm">
            •
          </span>
          <span className="text-[var(--color-text-muted)] text-sm font-medium">
            {formatTimestamp(comment.timestamp)}
          </span>
        </div>
        <p className="text-white text-base leading-relaxed">
          {comment.content}
        </p>
      </div>
    </div>
  );
};

export default Comment; 