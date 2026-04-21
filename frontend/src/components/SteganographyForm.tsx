import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Shield, Download, RefreshCw, CheckCircle2, FileText, AlertCircle, Zap, ShieldAlert } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { embedDataInImage } from '@/src/services/steganographyService';
import { saveFileRecord } from '@/src/services/fileStoreService';
import { motion } from 'motion/react';
import { FileRecord } from '@/src/types';

interface SteganographyFormProps {
  onSuccess?: (file: FileRecord) => void;
}

export function SteganographyForm({ onSuccess }: SteganographyFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
      setError(null);
    }
  };

  const handleProcess = async () => {
    if (!file || !coverImage || !password) return;
    setIsProcessing(true);
    setError(null);
    
    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");
      
      const result = await embedDataInImage(file, coverImage, password, canvas);
      
      const stegoRecord = {
        id: Math.random().toString(36).substring(2, 11),
        name: `${file.name} (Hidden)`,
        size: file.size,
        type: 'image/png',
        date: new Date().toISOString(),
        encryptionType: 'Pixel Steganography',
        entropyBefore: 0,
        entropyAfter: 0
      };

      if (onSuccess) {
        onSuccess(stegoRecord);
      }

      setResultImage(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during steganography process.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `secure_${file?.name || 'vault'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (resultImage) {
    return (
      <div className="max-w-3xl mx-auto space-y-10 py-12 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-emerald-100 border-2 border-black text-emerald-900 text-[11px] font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CheckCircle2 className="w-4 h-4" />
            <span>Success</span>
          </div>
          <h1 className="text-5xl font-bold uppercase tracking-tighter leading-tight">
            Data <span className="text-gray-400">Cloaked.</span>
          </h1>
          <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest max-w-lg mx-auto">
            Your data is now hidden inside the image pixels and ready for secure distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="neo-card p-10 space-y-8 bg-white">
            <div className="p-10 bg-[#f5f3f0] border-2 border-black rounded-2xl flex justify-center shadow-[inset_4px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <img 
                src={resultImage} 
                alt="Steganography Result" 
                className="max-h-[320px] border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={handleDownload} 
                className="neo-button-primary flex-1 py-4 text-sm font-bold uppercase tracking-widest"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Secure Image
              </button>
              
              <button 
                onClick={() => {setResultImage(null); setFile(null); setCoverImage(null); setPassword('');}}
                className="neo-button-secondary flex-1 py-4 text-sm font-bold uppercase tracking-widest"
              >
                Hide Another File
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 border-2 border-black rounded-3xl p-8 flex items-start gap-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="w-12 h-12 bg-black border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-tight">Pixel Stealth</h3>
              <p className="text-[10px] font-mono text-gray-500 uppercase leading-relaxed tracking-wider">
                Your data is embedded in the least significant bits of the image. It is visually indistinguishable from the original.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-500">
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="text-center space-y-2">
        <h1 className="text-[56px] font-abc-bold leading-[0.95] tracking-tight text-text-main mb-2">
          Pixel Stealth Mode.
        </h1>
        <h1 className="text-[56px] font-abc-bold leading-[0.95] tracking-tight text-white bg-emerald-600 px-4 py-1 inline-block mt-2">
          Hide in plain sight.
        </h1>
        <p className="text-[10px] font-abc-regular font-mono text-gray-500 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed pt-4">
          Hide sensitive files inside images without changing their appearance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 pb-12">
        <div className="space-y-6">
          <div className="rounded-2xl border-2 border-black bg-white p-6 relative overflow-hidden">
            <div className="absolute right-6 top-6 h-12 w-12 rounded-full bg-yellow-400" />
            
            {error && (
              <div className="bg-red-50 border-2 border-black p-4 rounded-xl flex items-center gap-4 text-red-900 text-[11px] font-abc-bold uppercase tracking-widest mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Step 1: Payload */}
                <div className="space-y-3">
                  <label className="text-sm font-abc-bold text-text-main block">1. File to Hide</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 group relative h-48 flex flex-col items-center justify-center",
                      file ? "bg-black border-black text-white" : "bg-gray-50 border-gray-300 hover:bg-white"
                    )}
                  >
                    <div className="absolute -left-2 -top-2 h-10 w-10 rounded-xl bg-blue-600" />
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-10 w-10 rounded-xl border-2 border-black bg-white flex items-center justify-center">
                        <FileText className="h-5 w-5 text-text-main stroke-[2.5]" />
                      </div>
                      
                      {file ? (
                        <div className="space-y-1">
                          <p className="text-sm font-abc-bold uppercase truncate max-w-[140px] text-text-main">{file.name}</p>
                          <p className="text-[10px] font-abc-regular font-medium opacity-60">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-abc-bold text-text-main">
                            Choose <span className="underline decoration-blue-600 decoration-2 underline-offset-2">file</span>
                          </p>
                          <p className="text-[10px] font-abc-regular font-medium text-gray-600">Any format</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Step 2: Cover */}
                <div className="space-y-3">
                  <label className="text-sm font-abc-bold text-text-main block">2. Cover Image</label>
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className={cn(
                      "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 group relative h-48 flex flex-col items-center justify-center",
                      coverImage ? "bg-black border-black text-white" : "bg-gray-50 border-gray-300 hover:bg-white"
                    )}
                  >
                    <div className="absolute -left-2 -top-2 h-10 w-10 rounded-xl bg-yellow-400" />
                    <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={handleImageChange} />
                    
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-10 w-10 rounded-xl border-2 border-black bg-white flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-text-main stroke-[2.5]" />
                      </div>
                      
                      {coverImage ? (
                        <div className="space-y-1">
                          <p className="text-sm font-abc-bold uppercase truncate max-w-[140px] text-text-main">{coverImage.name}</p>
                          <p className="text-[10px] font-abc-regular font-medium opacity-60">{(coverImage.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-abc-bold text-text-main">
                            Choose <span className="underline decoration-yellow-400 decoration-2 underline-offset-2">image</span>
                          </p>
                          <p className="text-[10px] font-abc-regular font-medium text-gray-600">PNG, JPG, WEBP</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-abc-bold text-text-main block">3. Encryption Password</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-xl border-2 border-black bg-white px-4 pr-10 text-sm font-abc-regular font-semibold"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Zap className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <button 
                  disabled={!file || !coverImage || !password || isProcessing}
                  onClick={handleProcess}
                  className="relative h-12 px-14 rounded-xl border-2 border-black bg-black text-white text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4" />
                  )}
                  <span>Hide Data</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-black">
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-bold text-text-main uppercase tracking-widest">LSB</p>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Pixel-level</p>
                </div>
                <div className="text-center space-y-1 border-x-2 border-black">
                  <p className="text-[11px] font-bold text-text-main uppercase tracking-widest">Stealth</p>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Undetectable</p>
                </div>
                <div className="text-center space-y-1">
                  <p className="text-[11px] font-bold text-text-main uppercase tracking-widest">Secure</p>
                  <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">XOR Encrypted</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border-2 border-black bg-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-lg border border-black/10 bg-blue-50 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-[11px] font-bold text-text-main uppercase tracking-wider">Stealth Mode</h3>
            </div>
            <p className="text-[10px] font-mono text-gray-500 ml-11 leading-relaxed">Steganography allows you to hide data in plain sight. Functional and visually unchanged.</p>
          </div>

          <div className="rounded-xl border-2 border-black bg-black text-white p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                <ShieldAlert className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="text-[11px] font-bold text-red-500 uppercase tracking-wider">Capacity Note</h3>
            </div>
            <p className="text-[10px] font-mono text-gray-400 ml-11 leading-relaxed opacity-60">Maximum capacity depends on resolution. Larger images hide larger files.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
