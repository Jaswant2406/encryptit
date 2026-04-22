import React, { useState } from 'react';
import { EncryptForm } from './components/EncryptForm';
import { DecryptForm } from './components/DecryptForm';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { FileTable } from './components/FileTable';
import { SteganographyForm } from './components/SteganographyForm';
import { Settings as SettingsView } from './components/Settings';
import { AuthPortal } from './components/AuthPortal';
import { View, FileRecord } from './types';
import { Shield, Lock, Unlock, BarChart3, Files, User, LogOut, Image as ImageIcon, Menu, X, Settings } from 'lucide-react';
import { FingerprintLogo } from './components/Logo';
import { cn } from '@/src/lib/utils';

function readCookie(name: string) {
  const prefix = `${name}=`;
  return document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length) || null;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>('encrypt');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [user, setUser] = useState<{ email: string, name: string } | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      const cookieToken = readCookie('encryptit_access_token');
      if (cookieToken) {
        localStorage.setItem('access_token', cookieToken);
        clearCookie('encryptit_access_token');
        window.history.replaceState({}, '', window.location.pathname);
      }

      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await fetch('/api/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data);
            
            // Fetch files after successful auth
            const filesResponse = await fetch('/api/files', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (filesResponse.ok) {
              const filesData = await filesResponse.json();
              setFiles(filesData);
            }
          } else {
            localStorage.removeItem('access_token');
          }
        } catch (err) {
          console.error('Auth check failed', err);
        }
      }
      setIsAuthReady(true);
    };
    checkAuth();
  }, []);

  const handleEncryptionSuccess = async (newFile: FileRecord) => {
    setFiles(prev => [newFile, ...prev]);
    
    // Save to backend
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await fetch('/api/files', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(newFile)
        });
      } catch (err) {
        console.error('Failed to save file record', err);
      }
    }
  };

  const handleDeleteFile = async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    
    // Delete from backend
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        await fetch(`/api/files/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (err) {
        console.error('Failed to delete file record', err);
      }
    }
  };

  const handleLogin = async (email: string) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const meResponse = await fetch('/api/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meResponse.ok) {
          const userData = await meResponse.json();
          setUser(userData);
        }

        const filesResponse = await fetch('/api/files', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setFiles(filesData);
          setCurrentView('files');
        }
      } catch (err) {
        console.error('Failed to fetch data after login', err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    clearCookie('encryptit_access_token');
    setUser(null);
    setFiles([]);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'encrypt':
        return <EncryptForm onSuccess={handleEncryptionSuccess} />;
      case 'steganography':
        return <SteganographyForm onSuccess={handleEncryptionSuccess} />;
      case 'decrypt':
        return <DecryptForm />;
      case 'analytics':
        return <AnalyticsDashboard files={files} />;
      case 'files':
        return <FileTable files={files} onDelete={handleDeleteFile} />;
      case 'settings':
        return <SettingsView />;
      default:
        return <EncryptForm onSuccess={handleEncryptionSuccess} />;
    }
  };

  const navItems = [
    { id: 'encrypt' as View, label: 'Encryption', icon: Lock },
    { id: 'decrypt' as View, label: 'Decryption', icon: Unlock },
    { id: 'steganography' as View, label: 'Steganography', icon: ImageIcon },
    { id: 'files' as View, label: 'Files', icon: Files },
    { id: 'analytics' as View, label: 'Dashboard', icon: BarChart3 },
    { id: 'settings' as View, label: 'Settings', icon: Settings },
  ];

  if (!user) {
    return <AuthPortal onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#eeece8] flex flex-col font-sans">
      {/* Navbar */}
      <header className="h-14 bg-[#f5f5f4] px-4 sm:px-8 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => setCurrentView('encrypt')}
        >
          <div className="bg-gray-100 rounded-xl h-9 w-9 flex items-center justify-center transition-transform group-hover:scale-105">
            <FingerprintLogo className="w-5 h-5 text-text-main stroke-[2.5]" />
          </div>
          <span className="font-abc-bold text-xl tracking-tighter uppercase text-text-main">
            Encryptit
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={cn(
                "px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all border-2",
                currentView === item.id 
                  ? "bg-white text-text-main border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                  : "text-text-main border-transparent hover:border-black hover:rounded-lg"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-[11px] font-bold uppercase tracking-wider leading-none text-text-main">{user.name}</span>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="neo-button-secondary h-6 px-2 text-[8px]"
          >
            Logout
          </button>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 border-2 border-black rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-[#f5f3f0] border-b-2 border-black p-4 md:hidden flex flex-col gap-2 animate-in slide-in-from-top duration-200">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider border-2 transition-all",
                  currentView === item.id 
                    ? "bg-black text-white border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                    : "bg-white text-text-main border-black rounded-xl hover:bg-gray-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#f5f3f0] border-t-2 border-black py-12 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 rounded-lg h-7 w-7 flex items-center justify-center">
                <FingerprintLogo className="w-4 h-4 text-text-main stroke-[2.5]" />
              </div>
              <span className="font-abc-bold text-sm uppercase tracking-tight text-text-main">Encryptit</span>
            </div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Built for absolute privacy. Zero-knowledge by design.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
          </div>

          <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            © 2026 ENCRYPTIT LABS
          </div>
        </div>
      </footer>
    </div>
  );
}
