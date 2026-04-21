import React, { useState, useEffect } from 'react';
import { User, Shield, CreditCard, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export function Settings() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setName(data.name || '');
          setEmail(data.email || '');
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-black pb-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tighter">Account Settings</h1>
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.2em] mt-1">
            Manage your cryptographic identity
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="neo-card p-4 bg-white">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)]">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-base font-bold uppercase tracking-tight">Profile Settings</h3>
                <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">Personal information and identity</p>
              </div>

              {message && (
                <div className={`p-2 border-2 border-black rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-top-2 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                  message.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="neo-label text-[9px]">Display Name</label>
                    <input 
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="neo-input h-9 text-xs"
                      placeholder="Your Name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="neo-label text-[9px]">Email Address</label>
                    <input 
                      type="email"
                      value={email}
                      disabled
                      className="neo-input h-9 text-xs bg-[#f5f3f0] cursor-not-allowed opacity-60"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isUpdating}
                  className="neo-button-primary w-full sm:w-auto px-6 py-2 text-[9px]"
                >
                  {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Update Identity'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
