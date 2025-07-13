import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';

export interface Comment {
  id: string;
  content: string;
  timestamp: string;
  author: {
    address: string;
    displayName: string;
  };
}

export interface Post {
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
  deleted?: boolean;
  solanaLogged?: boolean;
  solanaTxHash?: string | null;
  post_hash?: string;
}

interface PostContextType {
  posts: Post[];
  loading: boolean;
  error: string | null;
  addPost: (post: Post) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;
  addComment: (postId: string, comment: string) => void;
  editPost: (postId: string, newContent: string, newImage?: string | null) => void;
  softDeletePost: (postId: string) => void;
  getPosts: () => Post[];
  clearPosts: () => void;
  refreshPosts: () => Promise<void>;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const usePosts = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePosts must be used within a PostProvider');
  }
  return context;
};

interface PostProviderProps {
  children: ReactNode;
}

export const PostProvider: React.FC<PostProviderProps> = ({ children }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { publicKey } = useWallet();

  // Load posts from database on mount and when wallet changes
  const loadPosts = useCallback(async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/posts/all');
      if (!response.ok) {
        throw new Error(`Failed to load posts: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Fetch user profiles for all unique wallet addresses
      const walletAddresses = Array.from(new Set(data.map((post: any) => post.wallet_address))) as string[];
      const userProfiles: Record<string, any> = {};
      await Promise.all((walletAddresses as string[]).map(async (address: string) => {
        try {
          const res = await fetch(`http://localhost:8000/api/users/me/${address}`);
          if (res.ok) {
            const userData = await res.json();
            if (userData.success && userData.user) {
              userProfiles[address] = userData.user;
            }
          }
        } catch (e) {
          // Ignore errors, fallback to no profile image
        }
      }));

      // Transform backend data to match our Post interface, including profile image
      const transformedPosts: Post[] = data.map((post: any) => ({
        id: post.post_id || post.id,
        content: post.text || post.content,
        image: post.image_url || post.image,
        timestamp: post.timestamp,
        author: {
          address: post.wallet_address || post.author?.address || 'Unknown',
          displayName: post.display_name || post.author?.displayName || 'Anonymous',
          profileImage: userProfiles[post.wallet_address]?.profile_image || null
        },
        trustScore: post.trust_score || 95,
        likes: post.likes || 0,
        comments: post.comments || 0,
        commentList: post.comment_list || post.commentList || [],
        verified: post.verified || true,
        deleted: post.deleted || false,
        solanaLogged: post.solana_logged || post.solanaLogged || false,
        solanaTxHash: post.solana_tx_hash || post.solanaTxHash || null,
        post_hash: post.post_hash || null
      }));
      
      setPosts(transformedPosts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load posts';
      setError(errorMessage);
      console.error('Failed to load posts:', err);
      toast.error('Failed to load posts. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Load posts on mount and when wallet changes
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const addPost = useCallback(async (post: Post) => {
    // Add to local state immediately for optimistic UI
    setPosts(prevPosts => [post, ...prevPosts]);
    
    // Sync with backend
    try {
      const response = await fetch('http://localhost:8000/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_id: post.id,
          wallet_address: post.author.address,
          display_name: post.author.displayName,
          text: post.content,
          image_url: post.image || "",
          timestamp: post.timestamp,
          post_hash: post.post_hash,
          action_type: 0,
          solana_tx_hash: post.solanaTxHash
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync post with database');
      }
    } catch (err) {
      console.error('Failed to sync post:', err);
      toast.warning('Post created but failed to sync with database');
    }
  }, []);

  const likePost = useCallback(async (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId && !post.deleted
          ? { ...post, likes: post.likes + 1 }
          : post
      )
    );
    
    // Sync with backend
    try {
      await fetch(`http://localhost:8000/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: publicKey?.toBase58()
        }),
      });
    } catch (err) {
      console.error('Failed to sync like:', err);
    }
  }, [publicKey]);

  const unlikePost = useCallback(async (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId && !post.deleted
          ? { ...post, likes: Math.max(0, post.likes - 1) }
          : post
      )
    );
    
    // Sync with backend
    try {
      await fetch(`http://localhost:8000/api/posts/${postId}/unlike`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: publicKey?.toBase58()
        }),
      });
    } catch (err) {
      console.error('Failed to sync unlike:', err);
    }
  }, [publicKey]);

  const addComment = useCallback(async (postId: string, comment: string) => {
    const newComment: Comment = {
      id: Date.now().toString(),
      content: comment,
      timestamp: new Date().toISOString(),
      author: {
        address: publicKey?.toBase58() || 'Unknown',
        displayName: 'Vortex User'
      }
    };
    
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId && !post.deleted
          ? { 
              ...post, 
              comments: post.comments + 1,
              commentList: [...(post.commentList || []), newComment]
            }
          : post
      )
    );
    
    // Sync with backend
    try {
      await fetch(`http://localhost:8000/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: comment,
          wallet_address: publicKey?.toBase58(),
          display_name: 'Vortex User'
        }),
      });
    } catch (err) {
      console.error('Failed to sync comment:', err);
    }
  }, [publicKey]);

  const editPost = useCallback(async (postId: string, newContent: string, newImage?: string | null) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId && !post.deleted
          ? { ...post, content: newContent, image: newImage }
          : post
      )
    );
    
    // Sync with backend
    try {
      await fetch(`http://localhost:8000/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newContent,
          image_url: newImage || ""
        }),
      });
    } catch (err) {
      console.error('Failed to sync edit:', err);
      toast.warning('Post updated but failed to sync with database');
    }
  }, []);

  const softDeletePost = useCallback(async (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId ? { ...post, deleted: true } : post
      )
    );
    
    // Sync with backend
    try {
      await fetch(`http://localhost:8000/api/posts/${postId}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to sync delete:', err);
      toast.warning('Post deleted but failed to sync with database');
    }
  }, []);

  const getPosts = useCallback(() => {
    return posts.filter(post => !post.deleted);
  }, [posts]);

  const clearPosts = useCallback(() => {
    setPosts([]);
  }, []);

  const refreshPosts = useCallback(async () => {
    await loadPosts();
  }, [loadPosts]);

  const value = useMemo<PostContextType>(() => ({
    posts: posts.filter(post => !post.deleted),
    loading,
    error,
    addPost,
    likePost,
    unlikePost,
    addComment,
    editPost,
    softDeletePost,
    getPosts,
    clearPosts,
    refreshPosts,
  }), [posts, loading, error, addPost, likePost, unlikePost, addComment, editPost, softDeletePost, getPosts, clearPosts, refreshPosts]);

  return (
    <PostContext.Provider value={value}>
      {children}
    </PostContext.Provider>
  );
}; 