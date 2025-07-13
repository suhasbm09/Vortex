import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  UserIcon,
  SparklesIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/solid';
import MetadataModal from './MetadataModal';
import Comment from './Comment';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePosts } from '../context/PostContext';

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
  commentList: Comment[];
  verified: boolean;
  solanaLogged?: boolean;
  solanaTxHash?: string | null;
  post_hash?: string;
}

interface Comment {
  id: string;
  content: string;
  timestamp: string;
  author: {
    address: string;
    displayName: string;
  };
}

interface PostProps {
  post: PostData;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  openModal: (type: 'comment' | 'edit' | 'delete' | 'share', post: PostData) => void;
  openMetadataModal: (post: PostData) => void;
}

const Post: React.FC<PostProps> = ({ post, onLike, onUnlike, openModal, openMetadataModal }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const { publicKey } = useWallet();
  const { editPost, softDeletePost } = usePosts();
  const [showActions, setShowActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImage, setEditImage] = useState(post.image || null);
  const isAuthor = publicKey && post.author.address && publicKey.toBase58().includes(post.author.address.slice(-4));

  // Utility to shorten wallet address
  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLocalLikes(localLikes - 1);
      onUnlike(post.id);
    } else {
      setIsLiked(true);
      setLocalLikes(localLikes + 1);
      onLike(post.id);
    }
  };

  const handleComment = () => {
    openModal('comment', post);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const handleShare = () => {
    openModal('share', post);
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrustScoreBg = (score: number) => {
    if (score >= 90) return 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30';
    if (score >= 70) return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30';
    return 'bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30';
  };

  const openEditModal = () => {
    setShowEditModal(true);
    openModal('edit', post);
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    openModal('delete', post);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="glass-heavy rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 mb-8 animate-fadeInUp" 
         style={{ 
           boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
         }}>
      
      {/* Post Header */}
      <div className="flex items-start justify-between mb-6 relative">
        <div className="flex items-center space-x-4">
          {/* Profile Image or Default Icon */}
          {post.author.profileImage ? (
            <img
              src={post.author.profileImage}
              alt="Avatar"
              className="h-12 w-12 rounded-3xl object-cover border-2 border-white/20 shadow-lg"
            />
          ) : (
            <div className="h-12 w-12 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center border-2 border-white/20 shadow-lg">
              <UserIcon className="h-6 w-6 text-[var(--color-accent)]" />
            </div>
          )}
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="font-bold text-white text-lg">
                {post.author.displayName}
              </h3>
              {post.verified && (
                <div className="h-5 w-5 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-full flex items-center justify-center shadow-lg border border-white/20">
                  <SparklesIcon className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            {/* Shortened Wallet Address */}
            <p className="text-sm text-[var(--color-text-muted)] font-medium">
              {shortenAddress(post.author.address)}
            </p>
          </div>
        </div>
        
        {/* Trust Score */}
        <div className="flex items-center space-x-3">
          <div className={`px-4 py-2 rounded-2xl border ${getTrustScoreBg(post.trustScore)} backdrop-blur-sm`}>
            <div className="flex items-center space-x-2">
              <ShieldCheckIcon className={`h-4 w-4 ${getTrustScoreColor(post.trustScore)}`} />
              <span className={`text-sm font-bold ${getTrustScoreColor(post.trustScore)}`}>
                {post.trustScore}%
              </span>
            </div>
          </div>
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowActions((v) => !v)}
                className="p-2 rounded-2xl hover:bg-white/10 transition-all duration-200 group"
                title="Post Actions"
              >
                <EllipsisVerticalIcon className="h-5 w-5 text-[var(--color-text-muted)] group-hover:text-white transition-colors" />
              </button>
              {showActions && (
                <div className="absolute right-0 mt-2 w-40 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl z-50">
                  <button
                    onClick={openEditModal}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-white/10 rounded-t-2xl transition-all duration-200"
                  >
                    <PencilIcon className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => openMetadataModal(post)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-all duration-200"
                  >
                    <SparklesIcon className="h-4 w-4" /> Metadata
                  </button>
                  <button
                    onClick={openDeleteModal}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-b-2xl transition-all duration-200"
                  >
                    <TrashIcon className="h-4 w-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-6">
        <p className="text-white leading-relaxed whitespace-pre-wrap text-lg">
          {post.content}
        </p>
      </div>

      {/* Post Image */}
      {post.image && (
        <div className="mb-6">
          <img
            src={post.image}
            alt="Post content"
            className="w-full rounded-3xl object-contain max-h-96 bg-black/20 border border-white/20 shadow-2xl"
          />
        </div>
      )}

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)] mb-6">
        <div className="flex items-center space-x-6">
          <span className="font-semibold">{localLikes} likes</span>
          <button
            onClick={toggleComments}
            className={`hover:text-[var(--color-accent)] transition-all duration-200 cursor-pointer flex items-center space-x-2 font-semibold ${
              showComments ? 'text-[var(--color-accent)]' : ''
            }`}
          >
            <span>{post.comments} comments</span>
            {showComments && (
              <span className="text-xs">▼</span>
            )}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-full flex items-center justify-center">
            <SparklesIcon className="h-2 w-2 text-white" />
          </div>
          <span className="font-semibold">AI Verified</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-white/20 pt-6 animate-fadeIn">
          <div className="space-y-4">
            {post.commentList && post.commentList.length > 0 ? (
              post.commentList.map((comment) => (
                <Comment key={comment.id} comment={comment} />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="h-12 w-12 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <ChatBubbleLeftIcon className="h-6 w-6 text-[var(--color-accent)]" />
                </div>
                <p className="text-[var(--color-text-muted)] text-lg font-medium">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center space-x-6 mt-6 pt-6 border-t border-white/20">
        <button
          className="btn-action-premium group"
          onClick={handleLike}
          aria-label="Like"
        >
          {isLiked ? (
            <HeartIcon className="h-6 w-6 text-red-400 transition-all duration-200 group-hover:scale-110" />
          ) : (
            <HeartIcon className="h-6 w-6 text-[var(--color-text-muted)] group-hover:text-red-400 group-hover:scale-110 transition-all duration-200" />
          )}
        </button>
        <button
          className="btn-action-premium group"
          onClick={handleComment}
          aria-label="Comment"
        >
          <ChatBubbleLeftIcon className="h-6 w-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:scale-110 transition-all duration-200" />
        </button>
        <button
          className="btn-action-premium group"
          onClick={handleShare}
          aria-label="Share"
        >
          <ShareIcon className="h-6 w-6 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] group-hover:scale-110 transition-all duration-200" />
        </button>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-heavy rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <h3 className="text-2xl font-bold text-white mb-6">Edit Post</h3>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={5}
              className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] resize-none mb-6 backdrop-blur-sm text-lg"
            />
            {/* Image editing */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[var(--color-text-muted)] mb-3">Image</label>
              {editImage ? (
                <div className="relative mb-3">
                  <img src={editImage} alt="Preview" className="w-full h-48 object-cover rounded-2xl border border-white/20" />
                  <button
                    type="button"
                    onClick={() => setEditImage(null)}
                    className="absolute top-3 right-3 p-2 bg-black/70 rounded-2xl text-white hover:bg-black/90 transition-all duration-200 backdrop-blur-sm hover:scale-110"
                    title="Remove image"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/30 rounded-2xl p-8 text-center hover:border-[var(--color-accent)] transition-all duration-300 bg-white/5 backdrop-blur-sm">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => setEditImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id={`edit-image-upload-${post.id}`}
                  />
                  <label htmlFor={`edit-image-upload-${post.id}`} className="cursor-pointer text-[var(--color-text-muted)] font-medium">
                    Click to upload an image
                  </label>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={closeEditModal}
                className="flex-1 px-6 py-4 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { editPost(post.id, editContent, editImage); closeEditModal(); }}
                className="flex-1 py-4 px-6 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
                style={{
                  background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%)',
                  boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
                }}
                disabled={editContent.trim() === ''}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10">Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-heavy rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center border border-white/20">
                <TrashIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Delete Post?</h3>
            </div>
            <p className="text-[var(--color-text-muted)] mb-8 text-lg leading-relaxed">
              Are you sure you want to delete this post? This action can be undone only by admin/dev.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-6 py-4 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { softDeletePost(post.id); closeDeleteModal(); }}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Modal */}
      <MetadataModal
        isOpen={false} // This state is now managed by the parent
        onClose={() => {}} // This callback is now managed by the parent
        post={post}
      />
    </div>
  );
};

export default Post; 