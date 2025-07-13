import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { PostProvider } from './context/PostContext';
import { UserProvider } from './context/UserContext';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import SettingsPage from './components/SettingsPage';
import CreatePostWrapper from './components/CreatePostWrapper';
import VerifyPage from './components/VerifyPage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { 
  PhantomWalletAdapter,
  SolflareWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import '@solana/wallet-adapter-react-ui/styles.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#111116] to-[#1a1a22] relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-[#06b6d4]/20 to-[#6366f1]/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          <div className="glass-heavy p-10 flex flex-col items-center max-w-md animate-scaleIn relative z-10">
            <div className="h-20 w-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mb-6 animate-pulseGlow">
              <svg className="h-10 w-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3 text-center">Something went wrong</h2>
            <p className="text-[var(--color-text-muted)] text-center mb-8 leading-relaxed">
              An unexpected error occurred. Please refresh the page and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-accent px-8 py-3 font-semibold text-lg"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { connected, connecting } = useWallet();

  if (connecting) {
    // Show a premium loading state while reconnecting wallet
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#111116] to-[#1a1a22] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[#6366f1]/10 to-[#8b5cf6]/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-br from-[#06b6d4]/10 to-[#6366f1]/10 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="glass-heavy p-10 flex flex-col items-center animate-scaleIn relative z-10">
          <div className="h-16 w-16 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center mb-6 animate-pulseGlow">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-[#6366f1] border-r-[#8b5cf6]"></div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Reconnecting Wallet</h3>
          <p className="text-[var(--color-text-muted)] text-center">Please wait while we reconnect your wallet...</p>
        </div>
      </div>
    );
  }
  if (!connected) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const network = 'devnet';
const endpoint = clusterApiUrl(network);
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter()
];

function App() {
  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <UserProvider>
              <Router>
                <PostProvider>
                  <div className="App min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#111116] to-[#1a1a22] relative overflow-hidden">
                    {/* Animated background elements */}
                    <div className="fixed inset-0 pointer-events-none">
                      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[#6366f1]/5 to-[#8b5cf6]/5 rounded-full blur-3xl animate-pulse"></div>
                      <div className="absolute top-1/2 -right-32 w-80 h-80 bg-gradient-to-br from-[#06b6d4]/5 to-[#6366f1]/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
                      <div className="absolute -bottom-32 left-1/3 w-64 h-64 bg-gradient-to-br from-[#8b5cf6]/5 to-[#06b6d4]/5 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
                    </div>
                    
                    <a href="#main-content" className="skip-link">
                      Skip to main content
                    </a>
                    <Routes>
                      <Route 
                        path="/login" 
                        element={<LoginPage />} 
                      />
                      <Route 
                        path="/verify" 
                        element={<VerifyPage />} 
                      />
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/settings" 
                        element={
                          <ProtectedRoute>
                            <SettingsPage />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/create-post" 
                        element={
                          <ProtectedRoute>
                            <CreatePostWrapper />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                    <ToastContainer 
                      position="bottom-right" 
                      autoClose={4000} 
                      hideProgressBar 
                      newestOnTop 
                      closeOnClick 
                      rtl={false} 
                      pauseOnFocusLoss 
                      draggable 
                      pauseOnHover 
                      theme="dark"
                      toastClassName="glass-heavy !bg-[var(--color-bg-glass-heavy)] !border-[var(--color-border-light)] !text-white !rounded-2xl !shadow-2xl"
                    />
                  </div>
                </PostProvider>
              </Router>
            </UserProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
}

export default App;
