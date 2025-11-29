import React, { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOnRectangleIcon, SparklesIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (connected) {
      if (localStorage.getItem('vortex_login_complete') === 'true') {
        navigate('/dashboard');
      } else {
        navigate('/verify');
      }
    }
  }, [connected, navigate]);

  const handleConnectWallet = () => {
    try {
      setVisible(true);
    } catch (err) {
      // Optionally handle error
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#1a1a2e]" style={{ minHeight: '100dvh' }}>
      {/* Premium animated background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Primary accent glow */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] opacity-15 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/2 -right-20 w-[400px] h-[400px] bg-gradient-to-br from-[var(--color-accent-secondary)] to-[var(--color-accent)] opacity-10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        {/* <div className="absolute -bottom-32 left-1/3 w-[300px] h-[300px] bg-gradient-to-br from-[var(--color-accent)] to-purple-600 opacity-8 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} /> */}
        
                 {/* Subtle grid pattern */}
         <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
      </div>

      {/* Main content container */}
      <div className="relative z-10 max-w-md w-full px-6">
        {/* Premium glassmorphism card */}
        <div className="rounded-3xl shadow-2xl border border-white/10 bg-white/5 backdrop-blur-2xl px-6 py-7 flex flex-col items-center gap-5 animate-fadeInUp" 
             style={{ 
               boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
               background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
             }}>
          
          {/* Logo and branding */}
          <div className="flex flex-col items-center gap-6">
            {/* Animated logo container */}
            <div className="relative">
              <div className="h-20 w-20 rounded-3xl flex items-center justify-center bg-gradient-to-br from-[var(--color-accent)] via-[var(--color-accent-secondary)] to-[var(--color-accent)] shadow-2xl border border-white/20 animate-fadeIn relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <SparklesIcon className="h-10 w-10 text-white relative z-10 animate-pulse" style={{ animationDuration: '2s' }} />
              </div>
              {/* Glow effect */}
              <div className="absolute inset-0 h-20 w-20 rounded-3xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] blur-xl opacity-30 animate-pulse" style={{ animationDuration: '3s' }} />
            </div>
            
            {/* Title and tagline */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-black tracking-tight text-white mb-3 animate-fadeIn" style={{ letterSpacing: '-0.04em' }}>
                PROVEXA
              </h1>
              <div className="space-y-2">
                <p className="text-[var(--color-text-muted)] text-base font-semibold">
                  Decentralized Social Media
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-[var(--color-text-muted)] tracking-wide">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Truth • Transparency • Trust</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connect wallet button */}
          <div className="w-full space-y-4">
            <button
              onClick={handleConnectWallet}
              className="group w-full py-5 text-lg flex items-center justify-center space-x-3 rounded-2xl font-bold shadow-2xl bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent-secondary)] to-[var(--color-accent)] text-white hover:scale-[1.02] hover:shadow-3xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)]/30 relative overflow-hidden"
              style={{ 
                letterSpacing: '0.02em',
                backgroundSize: '200% 100%',
                animation: 'gradientShift 3s ease infinite'
              }}
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              
                             <span className="relative z-10">Connect Wallet</span>
               <ArrowRightOnRectangleIcon className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            {/* Wallet info panel */}
            <div className="w-full bg-gradient-to-br from-white/8 to-white/4 border border-white/10 rounded-2xl p-5 animate-fadeIn backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-white font-bold">💡</span>
                </div>
                <div className="space-y-2">
                  <p className="text-[var(--color-text-muted)] text-sm font-medium">
                    Don't have Phantom Wallet?
                  </p>
                  <a 
                    href="https://phantom.app/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-secondary)] font-semibold text-sm transition-colors duration-200 group"
                  >
                                         <span>Download it here</span>
                     <ArrowRightOnRectangleIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Security badge */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] opacity-60">
            <ShieldCheckIcon className="h-3 w-3" />
            <span>Secure • Private • Decentralized</span>
          </div>
        </div>
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none z-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoginPage; 