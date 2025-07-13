import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';

const generateCaptcha = () => {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b} = ?`, answer: (a + b).toString() };
};

const VerifyPage: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (localStorage.getItem('vortex_login_complete') === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleCaptchaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (captchaInput.trim() !== captcha.answer) {
      setError('Captcha incorrect. Please try again.');
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
      return;
    }
    // Captcha correct, register wallet
    setIsRegistering(true);
    try {
      const res = await fetch('http://localhost:8000/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: publicKey?.toBase58(),
          username: `user_${publicKey?.toBase58().slice(0, 8)}`,
          display_name: publicKey?.toBase58().slice(0, 8) + '...' + publicKey?.toBase58().slice(-4),
          profile_image: null,
          bio: null,
          website: null,
          twitter: null,
          instagram: null,
          location: null,
          email: null,
          created_at: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to register wallet.');
      localStorage.setItem('vortex_login_complete', 'true');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to register wallet. Please try again.');
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
    } finally {
      setIsRegistering(false);
    }
  };

  if (!connected) {
    navigate('/login');
    return null;
  }

  if (isRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#18181c] via-[#101014] to-[#1a1a22]">
        <div className="rounded-3xl shadow-2xl border border-[var(--color-accent)]/40 bg-black/80 backdrop-blur-2xl px-10 py-12 flex flex-col items-center gap-8 animate-fadeInUp" style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.65)' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] shadow-lg border-2 border-[var(--color-accent)] animate-fadeIn">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
              PROVEXA
            </h1>
            <p className="text-[var(--color-text-muted)] text-lg font-medium text-center">
              Decentralized Social Media<br />
              <span className="text-xs font-normal tracking-wide">Truth. Transparency. Trust.</span>
            </p>
          </div>
          <div className="w-full flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-accent)]"></div>
            <span className="text-[var(--color-text-muted)]">Registering wallet...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#18181c] via-[#101014] to-[#1a1a22]" style={{ minHeight: '100dvh' }}>
      {/* Animated background accent (optional) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[var(--color-accent)] opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[var(--color-accent-secondary)] opacity-10 rounded-full blur-2xl animate-pulse" />
      </div>
      {/* Glassy verify panel */}
      <div className="relative z-10 max-w-md w-full">
        <div className="rounded-3xl shadow-2xl border border-[var(--color-accent)]/40 bg-black/80 backdrop-blur-2xl px-10 py-12 flex flex-col items-center gap-8 animate-fadeInUp" style={{ boxShadow: '0 8px 40px 0 rgba(0,0,0,0.65)' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] shadow-lg border-2 border-[var(--color-accent)] animate-fadeIn">
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-1" style={{ letterSpacing: '-0.03em' }}>
              PROVEXA
            </h1>
            <p className="text-[var(--color-text-muted)] text-lg font-medium text-center">
              Security Check<br />
              <span className="text-xs font-normal tracking-wide">Verify you are human to continue</span>
            </p>
          </div>
          <form onSubmit={handleCaptchaSubmit} className="space-y-6 w-full">
            <div className="bg-[var(--color-bg-panel)]/60 border border-[var(--color-border)] rounded-xl p-6 flex flex-col items-center gap-4">
              <span className="text-[var(--color-text-muted)] text-base mb-2">Captcha</span>
              <span className="text-white text-lg font-bold mb-2">{captcha.question}</span>
              <input
                type="text"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-main)]/80 text-white text-center focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent placeholder-[var(--color-text-muted)] transition-all duration-200"
                placeholder="Enter answer"
                autoFocus
                required
              />
              <button
                type="submit"
                className="w-full py-3 text-lg flex items-center justify-center rounded-2xl font-bold shadow-xl bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-secondary)] text-white hover:scale-[1.03] hover:shadow-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              >
                Continue
              </button>
            </div>
            {error && (
              <div className="bg-[var(--color-danger)]/20 border border-[var(--color-danger)]/50 rounded-xl p-4 animate-fadeIn">
                <p className="text-[var(--color-danger)] text-sm text-center">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage; 