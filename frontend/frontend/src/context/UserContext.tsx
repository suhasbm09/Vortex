import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface User {
  wallet_address: string;
  username: string;
  display_name: string;
  profile_image?: string;
  bio?: string;
  email?: string;
  website?: string;
  twitter?: string;
  instagram?: string;
  location?: string;
  created_at: string;
  updated_at: string;
  profile_completed: boolean;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { publicKey, connected } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('vortex_user');
  };

  // Fetch user data when wallet connects
  const fetchUser = async (walletAddress: string) => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/users/me/${walletAddress}`);
      if (res.ok) {
        const responseData = await res.json();
        // The backend returns { success: true, user: {...}, message: "..." }
        if (responseData.success && responseData.user) {
          setUser(responseData.user);
          localStorage.setItem('vortex_user', JSON.stringify(responseData.user));
        } else {
          console.error('Invalid user response:', responseData);
          setUser(null);
          localStorage.removeItem('vortex_user');
        }
      } else {
        // User doesn't exist, clear any stored data
        setUser(null);
        localStorage.removeItem('vortex_user');
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      localStorage.removeItem('vortex_user');
    } finally {
      setLoading(false);
    }
  };

  // Load user from localStorage on mount
  React.useEffect(() => {
    const storedUser = localStorage.getItem('vortex_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('vortex_user');
      }
    }
  }, []);

  // Fetch user when wallet connects
  React.useEffect(() => {
    if (connected && publicKey) {
      fetchUser(publicKey.toBase58());
    } else if (!connected) {
      setUser(null);
      localStorage.removeItem('vortex_user');
    }
  }, [connected, publicKey]);

  const value: UserContextType = {
    user,
    setUser: (newUser: User | null) => {
      setUser(newUser);
      if (newUser) {
        localStorage.setItem('vortex_user', JSON.stringify(newUser));
      } else {
        localStorage.removeItem('vortex_user');
      }
    },
    logout,
    loading,
    refreshUser: async () => {
      if (publicKey) {
        await fetchUser(publicKey.toBase58());
      }
    }
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 