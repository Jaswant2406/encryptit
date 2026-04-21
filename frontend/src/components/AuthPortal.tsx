import React, { useState, useEffect, useRef } from 'react';
import { Shield, Mail, Lock, User, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FingerprintLogo } from './Logo';
import { cn } from '@/src/lib/utils';

declare global {
  interface Window {
    google: any;
  }
}

interface AuthPortalProps {
  onLogin: (email: string) => void;
}

export function AuthPortal({ onLogin }: AuthPortalProps) {
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) return;
        const config = await response.json();
        setGoogleClientId(config.googleClientId || '');
      } catch (err) {
        console.error('Failed to load app config', err);
      }
    };

    loadConfig();
  }, []);

  useEffect(() => {
    if (!googleClientId) {
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      const buttonParent = googleButtonRef.current;
      if (window.google && buttonParent) {
        buttonParent.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(
          buttonParent,
          { 
            theme: 'outline', 
            size: 'large', 
            width: 360,
            text: 'continue_with',
            shape: 'rectangular'
          }
        );
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [googleClientId]);

  const handleGoogleResponse = async (response: any) => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Google login failed');
      
      localStorage.setItem('access_token', data.access_token);
      onLogin(data.email);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const validatePassword = (pass: string) => {
    if (pass.length < 6) return "Password must be at least 6 characters";
    if (!/[A-Z]/.test(pass)) return "Password must contain at least 1 uppercase letter";
    if (!/[a-z]/.test(pass)) return "Password must contain at least 1 lowercase letter";
    if (!/[0-9]/.test(pass)) return "Password must contain at least 1 number";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);
    setMessage(null);
    
    try {
      if (mode === 'signup') {
        const passError = validatePassword(password);
        if (passError) throw new Error(passError);

        const response = await fetch('/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, confirmPassword, name }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Signup failed');
        setMessage(data.message || 'Account created! Please check your email to verify your account.');
        setMode('login');
      } else {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) {
          if (response.status === 403) {
            setMessage(data.detail);
            setShowResend(true);
            return;
          }
          throw new Error(data.detail || 'Login failed');
        }
        
        localStorage.setItem('access_token', data.access_token);
        onLogin(email);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message);
    } catch (err: any) {
      setError('Failed to request reset.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to resend verification');
      setMessage(data.message);
      setShowResend(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eeece8] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="bg-black rounded-2xl h-12 w-12 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <FingerprintLogo className="w-6 h-6 text-white stroke-[2.5]" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-abc-bold tracking-tighter text-text-main">Encryptit</h1>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mt-1">
              Military-Grade Privacy Protocol
            </p>
          </div>
        </div>

        <div className="rounded-2xl border-2 border-black bg-white p-0 overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {/* Tabs */}
          <div className="flex border-b-2 border-black">
            <button 
              onClick={() => {
                setMode('login');
                setError(null);
                setMessage(null);
              }}
              className={cn(
                "flex-1 py-4 text-[11px] font-bold uppercase tracking-wider transition-colors",
                mode === 'login' ? "bg-black text-white" : "bg-white text-text-main hover:bg-gray-50"
              )}
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                setMode('signup');
                setError(null);
                setMessage(null);
              }}
              className={cn(
                "flex-1 py-4 text-[11px] font-bold uppercase tracking-wider transition-colors",
                mode === 'signup' ? "bg-black text-white" : "bg-white text-text-main hover:bg-gray-50"
              )}
            >
              Sign Up
            </button>
          </div>

          <div className="p-8 space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-black text-red-600 text-[11px] font-bold p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                <Shield className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {message && (
              <div className="bg-blue-50 border-2 border-black text-text-main text-[11px] font-bold p-4 rounded-xl flex flex-col gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>{message}</span>
                </div>
                {showResend && (
                  <button 
                    onClick={handleResendVerification}
                    className="text-blue-600 underline underline-offset-2 hover:text-blue-700 text-left pl-7"
                  >
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-main block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 w-full rounded-xl border-2 border-black bg-white px-4 pl-10 text-sm font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-main block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-black bg-white px-4 pl-10 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-main block">Password</label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={handleForgotPassword}
                      className="text-[10px] font-mono text-gray-500 uppercase hover:text-text-main hover:underline transition-colors"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-black bg-white px-4 pl-10 text-sm font-semibold"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-text-main block">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 w-full rounded-xl border-2 border-black bg-white px-4 pl-10 text-sm font-semibold"
                    />
                  </div>
                </div>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-black opacity-10"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                    Secure OAuth
                  </span>
                </div>
              </div>

              {googleClientId && (
                <div ref={googleButtonRef} className="w-full min-h-10 border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"></div>
              )}

              <button 
                type="submit"
                disabled={isProcessing}
                className="relative h-12 w-full rounded-xl border-2 border-black bg-black text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{mode === 'login' ? 'Initialize Session' : 'Create Secure Identity'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            Protected by end-to-end encryption protocols.
          </p>
        </div>
      </div>
    </div>
  );
}
