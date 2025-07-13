import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { usePosts } from '../context/PostContext';
import { useUser } from '../context/UserContext';
import Post from './Post';
import {
  UserIcon,
  HomeIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import CommentModal from './CommentModal';
import ShareModal from './ShareModal';
import MetadataModal from './MetadataModal';

interface PostData {
  id: string;
  content: string;
  image?: string | null;
  timestamp: string;
  author: {
    address: string;
    displayName: string;
  };
  trustScore: number;
  likes: number;
  comments: number;
  commentList: any[];
  verified: boolean;
  deleted?: boolean;
  solanaLogged?: boolean;
  solanaTxHash?: string | null;
  post_hash?: string;
}

const Dashboard: React.FC = () => {
  const { publicKey, disconnect } = useWallet();
  const navigate = useNavigate();
  const { posts, loading: postsLoading, error: postsError, likePost, unlikePost, addComment, editPost, softDeletePost } = usePosts();
  const { user, loading: userLoading } = useUser();
  const [modalType, setModalType] = useState<null | 'comment' | 'edit' | 'delete' | 'share'>(null);
  const [modalPost, setModalPost] = useState<PostData | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState<string | null>(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [metadataModalPost, setMetadataModalPost] = useState<PostData | null>(null);
  const [tab, setTab] = useState<'feed' | 'explore'>('feed');
  const [explorePosts, setExplorePosts] = useState<PostData[]>([]);
  const [exploreLoading, setExploreLoading] = useState(false);
  const [exploreError, setExploreError] = useState<string | null>(null);

  useEffect(() => {
    if (tab === 'explore') {
      // Instead of fetching, use dummy posts for exploration
      setExploreLoading(true);
      setExploreError(null);
      // Dummy posts array
      const dummyPosts: PostData[] = [
        {
          id: 'explore1',
          content: 'Discover the future of decentralized social media! 🌐✨',
          image: null,
          timestamp: new Date().toISOString(),
          author: {
            address: 'explore_wallet_1',
            displayName: 'ExplorerBot',
          },
          trustScore: 95,
          likes: 42,
          comments: 7,
          commentList: [],
          verified: true,
        },
        {
          id: 'explore2',
          content: 'Check out trending posts and connect with new creators! 🚀',
          image: null,
          timestamp: new Date().toISOString(),
          author: {
            address: 'explore_wallet_2',
            displayName: 'TrendSeeker',
          },
          trustScore: 88,
          likes: 30,
          comments: 3,
          commentList: [],
          verified: false,
        },
        {
          id: 'explore3',
          content: 'Join the conversation and share your thoughts! 💬',
          image: null,
          timestamp: new Date().toISOString(),
          author: {
            address: 'explore_wallet_3',
            displayName: 'ChatGuru',
          },
          trustScore: 80,
          likes: 15,
          comments: 1,
          commentList: [],
          verified: false,
        },
      ];
      setTimeout(() => {
        setExplorePosts(dummyPosts);
        setExploreLoading(false);
      }, 800); // Simulate loading
    }
  }, [tab]);

  const displayName = user?.display_name || '';
  const isProfileCompleted = user?.profile_completed || false;

  const handleDisconnect = async () => {
    try {
      await disconnect();
      localStorage.removeItem('vortex_login_complete');
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const shortenAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

  const openModal = (type: 'comment' | 'edit' | 'delete' | 'share', post: PostData) => {
    setModalType(type);
    setModalPost(post);
    if (type === 'edit') {
      setEditContent(post.content);
      setEditImage(post.image || null);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setModalPost(null);
  };

  const openMetadataModal = (post: PostData) => {
    setMetadataModalPost(post);
    setShowMetadataModal(true);
  };
  
  const closeMetadataModal = () => {
    setShowMetadataModal(false);
    setMetadataModalPost(null);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#111116] to-[#1a1a22] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-[#06b6d4]/10 to-[#6366f1]/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="glass-heavy p-10 flex flex-col items-center animate-scaleIn relative z-10 rounded-3xl border border-white/10" 
             style={{ 
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
             }}>
          <div className="h-16 w-16 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-3xl flex items-center justify-center mb-6 animate-pulseGlow border border-white/20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-[#6366f1] border-r-[#8b5cf6]"></div>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Loading Profile</h3>
          <p className="text-[var(--color-text-muted)] text-center font-medium">Preparing your PROVEXA experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111116] to-[#1a1a22] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-[#06b6d4]/10 to-[#6366f1]/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-[#8b5cf6]/5 to-[#06b6d4]/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Glassy Header */}
      <header className="fixed top-0 left-0 w-full z-40 bg-black/40 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/20">
                <SparklesIcon className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-black tracking-tight text-white" style={{ letterSpacing: '-0.03em' }}>PROVEXA</span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-white hover:text-[var(--color-accent)] px-4 py-2 rounded-2xl text-base font-bold flex items-center space-x-2 transition-all duration-300 hover:bg-white/10 group">
                <HomeIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Home</span>
              </a>
              <a href="#" className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] px-4 py-2 rounded-2xl text-base font-bold flex items-center space-x-2 transition-all duration-300 hover:bg-white/10 group">
                <BellIcon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span>Notifications</span>
              </a>
            </nav>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/5 border border-white/20 rounded-3xl px-6 py-3 shadow-2xl backdrop-blur-xl hover:bg-white/10 transition-all duration-300">
                {user?.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt="Avatar"
                    className="h-10 w-10 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-2xl flex items-center justify-center border-2 border-white/20">
                    <UserIcon className="h-5 w-5 text-[var(--color-accent)]" />
                  </div>
                )}
                <span className="text-base font-bold text-white">
                  {displayName ? displayName : shortenAddress(publicKey?.toBase58() || '')}
                </span>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
                title="Settings"
              >
                <Cog6ToothIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={handleDisconnect}
                className="text-[var(--color-text-muted)] hover:text-red-400 p-3 rounded-2xl hover:bg-white/10 transition-all duration-300 group"
                title="Disconnect Wallet"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto pt-32 pb-10 sm:px-6 lg:px-8 animate-fadeInUp relative z-10">
        {/* Welcome Card */}
        <div className="flex justify-center mb-12">
          <div className="glass-heavy rounded-3xl shadow-2xl border border-white/10 px-12 py-16 flex flex-col items-center gap-10 w-full max-w-6xl" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <div className="text-center">
              <h2 className="text-4xl font-black tracking-tight text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
                Welcome, <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">{displayName ? displayName : shortenAddress(publicKey?.toBase58() || '')}</span> to <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">PROVEXA</span>!
              </h2>
              <p className="text-[var(--color-text-muted)] text-xl font-medium text-center max-w-3xl leading-relaxed">
                Your decentralized social media experience starts here. Share, connect, and verify content with AI-powered transparency.
              </p>
            </div>
            
            {!isProfileCompleted && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-3xl p-6 flex items-center space-x-4 w-full max-w-lg mx-auto backdrop-blur-sm">
                <div className="h-10 w-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-yellow-200 text-lg font-medium">
                  Please <button onClick={() => navigate('/settings')} className="underline text-yellow-300 hover:text-yellow-100 font-bold">complete your profile</button> to set a custom display name.
                </span>
              </div>
            )}
            
            {/* Stats */}
            <div className="flex flex-wrap gap-8 justify-center w-full mt-4">
              <div className="bg-white/5 border border-white/20 rounded-3xl p-8 min-w-[140px] text-center shadow-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-2xl font-black text-white mb-2">{posts.length}</div>
                <div className="text-[var(--color-text-muted)] text-lg font-bold">Posts</div>
              </div>
              <div className="bg-white/5 border border-white/20 rounded-3xl p-8 min-w-[140px] text-center shadow-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-2xl font-black text-white mb-2">0</div>
                <div className="text-[var(--color-text-muted)] text-lg font-bold">Followers</div>
              </div>
              <div className="bg-white/5 border border-white/20 rounded-3xl p-8 min-w-[140px] text-center shadow-2xl backdrop-blur-sm hover:scale-105 transition-transform duration-300">
                <div className="text-2xl font-black text-white mb-2">100</div>
                <div className="text-[var(--color-text-muted)] text-lg font-bold">Trust Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Feed/Explore Tabs + New Post Button */}
        <div className="flex justify-center mb-10">
          <div className="flex gap-2 bg-white/5 border border-white/20 rounded-3xl p-2 shadow-2xl items-center backdrop-blur-sm">
            <button
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                tab === 'feed' 
                  ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white shadow-lg' 
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setTab('feed')}
            >
              Feed
            </button>
            <button
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                tab === 'explore' 
                  ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white shadow-lg' 
                  : 'text-[var(--color-text-muted)] hover:text-white hover:bg-white/10'
              }`}
              onClick={() => setTab('explore')}
            >
              Explore
            </button>
            <button
              className="ml-4 px-8 py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white hover:from-[var(--color-accent-secondary)] hover:to-[var(--color-accent)] transition-all duration-300 shadow-lg hover:scale-105"
              onClick={() => navigate('/create-post')}
            >
              + New Post
            </button>
          </div>
        </div>

        {/* Feed or Explore Posts */}
        <div className="flex justify-center">
          <div className="glass-heavy rounded-3xl shadow-2xl border border-white/10 px-10 py-10 w-full max-w-7xl" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            {tab === 'feed' ? (
              postsLoading ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-[var(--color-accent)] border-r-[var(--color-accent-secondary)]"></div>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-xl font-bold">Loading feed...</p>
                </div>
              ) : postsError ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-red-400 text-xl font-bold">{postsError}</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="h-8 w-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-xl font-bold mb-4">No posts yet. Create one!</p>
                  <button
                    onClick={() => navigate('/create-post')}
                    className="px-8 py-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white rounded-2xl font-bold text-lg hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    Create Your First Post
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  {posts.map(post => (
                    <Post key={post.id} post={post} onLike={likePost} onUnlike={unlikePost} openModal={openModal} openMetadataModal={openMetadataModal} />
                  ))}
                </div>
              )
            ) : (
              exploreLoading ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-[var(--color-accent)] border-r-[var(--color-accent-secondary)]"></div>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-xl font-bold">Loading explore...</p>
                </div>
              ) : exploreError ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-red-400 text-xl font-bold">{exploreError}</p>
                </div>
              ) : explorePosts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="h-16 w-16 bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent-secondary)]/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <svg className="h-8 w-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <p className="text-[var(--color-text-muted)] text-xl font-bold">No posts to explore yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {explorePosts.map(post => (
                    <Post key={post.id} post={post} onLike={likePost} onUnlike={unlikePost} openModal={openModal} openMetadataModal={openMetadataModal} />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Bar */}
      {posts.length > 0 && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 flex justify-center w-full pointer-events-none">
          <div className="glass-heavy flex items-center gap-6 px-8 py-4 rounded-3xl shadow-2xl pointer-events-auto border border-white/10 backdrop-blur-2xl" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <button
              onClick={() => navigate('/create-post')}
              className="flex items-center gap-3 px-6 py-3 text-lg font-bold shadow-lg hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/30 transition-all duration-300 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%)',
                minWidth: 140
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Post
            </button>
            <button
              onClick={() => {/* TODO: navigate to explore */}}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white hover:bg-white/10 transition-all duration-300 group"
              title="Explore Feed"
            >
              <svg className="h-5 w-5 text-green-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden md:inline font-bold">Explore</span>
            </button>
            <button
              onClick={() => {/* TODO: navigate to trust snapshot */}}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white hover:bg-white/10 transition-all duration-300 group"
              title="Trust Snapshot"
            >
              <ShieldCheckIcon className="h-5 w-5 text-[var(--color-accent)] group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline font-bold">Trust</span>
            </button>
          </div>
        </div>
      )}

      {/* Render modals at dashboard root */}
      {modalType === 'comment' && modalPost && (
        <CommentModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={comment => { addComment(modalPost.id, comment); closeModal(); }}
          postContent={modalPost.content}
        />
      )}
      {modalType === 'share' && modalPost && (
        <ShareModal
          isOpen={true}
          onClose={closeModal}
          postContent={modalPost.content}
        />
      )}
      {modalType === 'edit' && modalPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-heavy rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <h3 className="text-2xl font-bold text-white mb-6">Edit Post</h3>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              rows={5}
              className="w-full px-5 py-4 border border-white/20 rounded-2xl focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] bg-white/5 text-white placeholder-[var(--color-text-muted)] resize-none mb-6 backdrop-blur-sm text-lg"
            />
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
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
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
                    id={`edit-image-upload-${modalPost.id}`}
                  />
                  <label htmlFor={`edit-image-upload-${modalPost.id}`} className="cursor-pointer text-[var(--color-text-muted)] font-medium">
                    Click to upload an image
                  </label>
                </div>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-4 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { editPost(modalPost.id, editContent, editImage); closeModal(); }}
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
      {modalType === 'delete' && modalPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-heavy rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10" 
               style={{ 
                 boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
               }}>
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-3xl flex items-center justify-center border border-white/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white">Delete Post?</h3>
            </div>
            <p className="text-[var(--color-text-muted)] mb-8 text-lg leading-relaxed">
              Are you sure you want to delete this post? This action can be undone only by admin/dev.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={closeModal}
                className="flex-1 px-6 py-4 border border-white/20 text-[var(--color-text-muted)] rounded-2xl hover:bg-white/10 transition-all duration-300 font-semibold backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => { softDeletePost(modalPost.id); closeModal(); }}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Global Metadata Modal */}
      {showMetadataModal && metadataModalPost && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center modal-backdrop-glassmorphic">
          <MetadataModal
            isOpen={true}
            onClose={closeMetadataModal}
            post={metadataModalPost}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard; 