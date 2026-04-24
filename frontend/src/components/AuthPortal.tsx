import React, { useState, useEffect, useRef } from 'react';
import { Shield, RefreshCw, CheckCircle2 } from 'lucide-react';
import { FingerprintLogo } from './Logo';

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
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isGoogleReady, setIsGoogleReady] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) return;
        const config = await response.json();
        setGoogleClientId(config.googleClientId || '');
      } catch (err) {
        console.error('Failed to load app config', err);
        setError('Failed to load Google sign-in configuration.');
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
          auto_select: false,
          cancel_on_tap_outside: true,
          ux_mode: 'redirect',
          login_uri: `${window.location.origin}/api/auth/google/redirect`,
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
        setIsGoogleReady(true);
      }
    };

    return () => {
      document.head.removeChild(script);
      setIsGoogleReady(false);
    };
  }, [googleClientId]);

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
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-3 text-center">
                <h2 className="text-2xl font-abc-bold tracking-tight text-text-main">Sign in with Google</h2>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                  Any Google account can access Encryptit once Google OAuth is configured for this Space.
                </p>
              </div>
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

              {!googleClientId && (
                <div className="rounded-xl border-2 border-black bg-yellow-50 p-4 text-[11px] font-bold uppercase tracking-widest text-text-main">
                  Google sign-in is not configured yet.
                </div>
              )}

              <div className="rounded-xl border-2 border-dashed border-black/20 bg-[#f5f3f0] p-4 text-center">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                  Email/password signup is temporarily disabled to keep authentication free and reliable.
                </p>
              </div>
            </div>
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
