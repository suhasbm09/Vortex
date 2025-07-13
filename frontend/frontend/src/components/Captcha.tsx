import React, { useState, useEffect } from 'react';


interface CaptchaProps {
  onComplete: (isValid: boolean) => void;
  isVisible: boolean;
}

const Captcha: React.FC<CaptchaProps> = ({ onComplete, isVisible }) => {
  const [captchaValue, setCaptchaValue] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Generate random captcha
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaValue(result);
    setUserInput('');
    setIsValid(false);
  };

  useEffect(() => {
    if (isVisible) {
      generateCaptcha();
    }
  }, [isVisible]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setUserInput(value);
    if (value === captchaValue) {
      setIsValid(true);
      onComplete(true);
    } else if (value.length === captchaValue.length) {
      setIsValid(false);
      onComplete(false);
      setAttempts(prev => prev + 1);
    } else {
      setIsValid(false);
      onComplete(false);
    }
  };

  const handleRefresh = () => {
    generateCaptcha();
    setAttempts(0);
  };

  if (!isVisible) return null;

  return (
    <div className="glass-heavy animate-fadeInUp p-8 w-full flex flex-col items-center shadow-2xl rounded-3xl border border-white/10" 
         style={{ 
           boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
           background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)'
         }}>
      
      {/* Header */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="h-12 w-12 bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-secondary)] rounded-3xl flex items-center justify-center shadow-2xl border border-white/20">
          <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white tracking-tight">
          Human Verification
        </h3>
      </div>

      <div className="w-full space-y-6">
        {/* Captcha Display */}
        <div className="flex flex-col items-center">
          <div className="text-4xl font-mono font-black tracking-widest text-white bg-gradient-to-br from-white/10 to-white/5 px-8 py-6 rounded-3xl shadow-2xl select-none mb-4 border border-white/20 backdrop-blur-sm" 
               style={{
                 background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)',
                 textShadow: '0 0 20px rgba(255, 255, 255, 0.5)'
               }}>
            {captchaValue}
          </div>
          <div className="text-sm text-[var(--color-text-muted)] font-medium">
            Enter the code above
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-4">
          <input
            type="text"
            value={userInput}
            onChange={handleInputChange}
            placeholder="Enter the code"
            className={`w-full px-6 py-5 border-2 rounded-2xl text-center text-2xl font-mono tracking-widest bg-white/5 text-white placeholder-[var(--color-text-muted)] focus:ring-4 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-all duration-300 outline-none backdrop-blur-sm font-bold ${
              userInput.length === captchaValue.length
                ? isValid
                  ? 'border-green-500 bg-green-500/10 shadow-lg shadow-green-500/20'
                  : 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20'
                : 'border-white/20 hover:border-white/40'
            }`}
            maxLength={6}
            autoComplete="off"
            spellCheck={false}
          />
          
          {/* Validation Icon */}
          {userInput.length === captchaValue.length && (
            <div className="flex items-center justify-center space-x-3 animate-fadeIn">
              {isValid ? (
                <>
                  <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <span className="text-green-400 text-lg font-bold">Verified!</span>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-red-400 text-lg font-bold">Incorrect code</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          className="w-full py-4 px-6 font-bold text-lg rounded-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-secondary) 100%)',
            boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.4)'
          }}
          type="button"
        >
          {/* Button shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <div className="flex items-center justify-center space-x-3 relative z-10">
            <svg className="h-5 w-5 group-hover:rotate-180 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <span>Refresh Code</span>
          </div>
        </button>

        {/* Attempts Counter */}
        {attempts > 0 && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/20 backdrop-blur-sm">
              <div className="h-2 w-2 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
              <span className="text-sm text-[var(--color-text-muted)] font-semibold">
                Attempts: {attempts}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Captcha; 