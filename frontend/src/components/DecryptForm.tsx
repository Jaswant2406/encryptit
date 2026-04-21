import React, { useState, useRef } from 'react';
import { Upload, Unlock, ShieldAlert, RefreshCw, FileText, CheckCircle2, ChevronDown, Zap, Shield } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { decryptFile } from '@/src/services/cryptoService';
import { extractDataFromImage } from '@/src/services/steganographyService';
import { motion } from 'motion/react';

export function DecryptForm() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [decryptedFile, setDecryptedFile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDecrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      if (file.type.startsWith('image/')) {
        const canvas = canvasRef.current;
        if (!canvas) throw new Error("Canvas not found");
        
        const result = await extractDataFromImage(file, password, canvas);
        setDecryptedFile({
          ...result,
          type: 'application/octet-stream',
          isStego: true
        });
      } else {
        const result = await decryptFile(file, password);
        setDecryptedFile({
          ...result
        });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Decryption failed. Check your password.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedFile) return;
    
    let url;
    if (decryptedFile.isStego) {
      url = decryptedFile.data;
    } else {
      const blob = new Blob([decryptedFile.data], { type: decryptedFile.type });
      url = URL.createObjectURL(blob);
    }
    
    const a = document.createElement('a');
    a.href = url;
    a.download = decryptedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    if (!decryptedFile.isStego) {
      URL.revokeObjectURL(url);
    }
  };

  if (decryptedFile) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 border-2 border-black text-emerald-900 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Access Granted</span>
          </div>
          <h1 className="text-4xl font-bold uppercase tracking-tighter leading-tight text-text-main">
            Payload <span className="text-gray-400">Recovered.</span>
          </h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest max-w-md mx-auto">
            Your original data has been extracted from the cryptographic vault and is ready for local access.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="neo-card p-8 space-y-6 bg-white">
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#f5f3f0] border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-12 h-12 bg-black border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <p className="text-lg font-bold uppercase truncate tracking-tight text-text-main">{decryptedFile.name}</p>
                <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{(decryptedFile.size / 1024).toFixed(2)} KB</p>
              </div>
              <button 
                onClick={handleDownload} 
                className="neo-button-primary px-8 py-3 w-full sm:w-auto text-xs"
              >
                Download File
              </button>
            </div>

            <button 
              onClick={() => {setDecryptedFile(null); setFile(null); setPassword('');}}
              className="neo-button-secondary w-full py-3 text-xs"
            >
              Decrypt Another File
            </button>
          </div>

          <div className="bg-emerald-50 border-2 border-black rounded-2xl p-6 flex items-start gap-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-10 h-10 bg-black border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-tight text-text-main">Secure Recovery</h3>
              <p className="text-[9px] font-mono text-gray-500 uppercase leading-relaxed tracking-wider">
                The decryption process was performed entirely on your local machine. No data was transmitted to our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="text-center space-y-1">
        <h1 className="text-[48px] font-abc-bold leading-[0.95] tracking-tight text-text-main mb-1">
          Unlock Secured Data.
        </h1>
        <h1 className="text-[48px] font-abc-bold leading-[0.95] tracking-tight text-white bg-black px-4 py-1 inline-block mt-1">
          Recover effortlessly.
        </h1>
        <p className="text-[9px] font-abc-regular font-mono text-gray-500 uppercase tracking-widest max-w-xl mx-auto leading-relaxed pt-3">
          Enter your private security key to recover your encrypted documents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 pb-8">
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-black bg-white p-6 relative overflow-hidden">
            <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-yellow-400" />
            
            {error && (
              <div className="bg-red-50 border-2 border-black p-3 rounded-xl flex items-center gap-3 text-red-900 text-[10px] font-abc-bold uppercase tracking-widest mb-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-abc-bold text-text-main block">1. Upload Encrypted File</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 group relative",
                    file ? "bg-black border-black text-white" : "bg-gray-50 border-gray-300 hover:bg-white"
                  )}
                >
                  <div className="absolute -left-1.5 -top-1.5 h-10 w-10 rounded-xl bg-blue-600" />
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-10 w-10 rounded-lg border-2 border-black bg-white flex items-center justify-center">
                      <Unlock className="h-5 w-5 text-text-main stroke-[2.5]" />
                    </div>
                    
                    {file ? (
                      <div className="space-y-0.5">
                        <p className="text-base font-abc-bold uppercase truncate max-w-[240px] text-text-main">{file.name}</p>
                        <p className="text-xs font-abc-regular font-medium opacity-60">{(file.size / 1024).toFixed(2)} KB • Ready</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <p className="text-base font-abc-bold text-text-main">
                          Click to <span className="underline decoration-blue-600 decoration-4 underline-offset-4">upload</span>
                        </p>
                        <p className="text-xs font-abc-regular font-medium text-gray-600">Select .enc or stego image</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-abc-bold text-text-main block">2. Security Password</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-black bg-white px-4 pr-10 text-xs font-abc-regular font-semibold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Zap className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  disabled={!file || !password || isProcessing}
                  onClick={handleDecrypt}
                  className="relative h-11 px-12 rounded-xl border-2 border-black bg-black text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                  <span>Decrypt File</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border-2 border-black bg-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg border border-black/10 bg-blue-50 flex items-center justify-center shrink-0">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h3 className="text-[10px] font-bold text-text-main uppercase tracking-wider">Zero Knowledge</h3>
            </div>
            <p className="text-[9px] font-mono text-gray-500 ml-9 leading-relaxed">We never see your password. Decryption happens entirely in your browser.</p>
          </div>

          <div className="rounded-xl border-2 border-black bg-black text-white p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-7 w-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
              </div>
              <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Security Warning</h3>
            </div>
            <p className="text-[9px] font-mono text-gray-400 ml-9 leading-relaxed opacity-60">Ensure you are in a private environment before entering your decryption key.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
