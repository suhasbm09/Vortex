import React from 'react';
import { usePosts } from '../context/PostContext';
import CreatePost from './CreatePost';

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
  solanaLogged?: boolean;
  solanaTxHash?: string | null;
  post_hash?: string;
}

const CreatePostWrapper: React.FC = () => {
  const { addPost } = usePosts();

  const handlePostCreated = (post: PostData) => {
    addPost(post);
  };

  return (
    <div className="animate-fadeInUp">
      <CreatePost onPostCreated={handlePostCreated} />
    </div>
  );
};

export default CreatePostWrapper; 