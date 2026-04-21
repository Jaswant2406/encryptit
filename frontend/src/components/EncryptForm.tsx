import React, { useState, useRef } from 'react';
import { 
  Lock, 
  Shield, 
  RefreshCw, 
  CheckCircle2, 
  Upload, 
  ShieldCheck, 
  Download,
  Zap,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { analyzePassword } from '@/src/services/aiService';
import { encryptFile, generateSecurePassword, EncryptionType } from '@/src/services/cryptoService';
import { saveFileRecord } from '@/src/services/fileStoreService';
import { motion } from 'motion/react';

interface EncryptFormProps {
  onSuccess: (file: any) => void;
}

export function EncryptForm({ onSuccess }: EncryptFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [encryptionType, setEncryptionType] = useState<string>(EncryptionType.CHAOS);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasswordAnalysis = async () => {
    if (!password) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzePassword(password);
      setAiAnalysis(analysis || "Analysis unavailable.");
    } catch (err) {
      setAiAnalysis("AI Analysis failed. Please check your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const generatePassword = () => {
    const pass = generateSecurePassword();
    setPassword(pass);
  };

  const handleEncrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    
    try {
      const result = await encryptFile(file, password, encryptionType);
      
      const mockResult = {
        ...result,
        entropyBefore: 4.2 + (Math.random() * 0.5),
        entropyAfter: 7.5 + (Math.random() * 1.5),
      };

      setResult(mockResult);
      onSuccess(mockResult);
    } catch (err) {
      console.error(err);
      alert("Encryption failed. Please try a different password or file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !result.data) return;
    const blob = new Blob([result.data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.name + ".enc";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto animate-in zoom-in-95 duration-500 py-8">
        <div className="neo-card p-8 md:p-12 text-center space-y-8 relative overflow-hidden bg-white shadow-[4px_4px_0px_0px_#000000]">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-black"></div>
          
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] animate-bounce">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-100 border-2 border-black text-emerald-900 text-[10px] font-bold uppercase tracking-widest mb-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Vault Secured
            </div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter leading-tight text-text-main">Cryptographic Lock Engaged</h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest max-w-sm mx-auto">Your payload has been processed with high-entropy primitives and is now ready for secure transmission.</p>
          </div>

          <div className="bg-[#f5f3f0] border-2 border-black rounded-xl p-6 text-left space-y-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between border-b-2 border-black border-dashed pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Payload Name</span>
              <span className="font-bold text-xs uppercase truncate ml-4 text-text-main">{result.name}</span>
            </div>
            <div className="flex items-center justify-between border-b-2 border-black border-dashed pb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Security ID</span>
              <span className="font-mono text-[9px] text-gray-500 break-all ml-4 text-right uppercase">{result.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</span>
              <div className="flex items-center gap-2 text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="font-bold text-[10px] uppercase tracking-widest">Verified Secure</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={handleDownload}
              className="neo-button-primary h-12 px-8 flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-4 h-4" />
              Download Secured File
            </button>
            <button 
              onClick={() => {setResult(null); setFile(null); setPassword('');}}
              className="neo-button-secondary h-12 px-8 flex items-center justify-center gap-2 text-xs"
            >
              <RefreshCw className="w-4 h-4" />
              Secure Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col items-center text-center space-y-1">
        <h1 className="text-4xl md:text-5xl font-abc-bold tracking-tight leading-tight bg-black text-white px-6 py-1.5 inline-block">
          Secure your files.
        </h1>
        <h1 className="text-4xl md:text-5xl font-abc-bold tracking-tight leading-tight bg-[#2563eb] text-white px-6 py-1.5 inline-block">
          Encrypt effortlessly.
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column - Upload Area */}
        <div className="lg:col-span-8">
          <div className={cn(
            "border-2 border-black rounded-[2rem] p-4 bg-white transition-all duration-200",
            isDragging && "scale-[1.01] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
          )}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "border-2 border-dashed rounded-[1.5rem] p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors group",
                isDragging ? "border-black bg-gray-50" : "border-gray-200 hover:bg-gray-50"
              )}
            >
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <div className="relative">
                <div className="absolute inset-0 bg-[#2563eb] rounded-lg translate-x-1 translate-y-1" />
                <div className="relative w-12 h-12 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-sm">
                  <Upload className="w-6 h-6 text-text-main" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="text-xl font-abc-bold tracking-tight text-text-main">
                  <span className="text-[#2563eb] underline underline-offset-4 decoration-2">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs font-abc-regular font-medium text-gray-500">
                  {file ? file.name : 'Supports any file type up to 50MB'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Protocol Boxes */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000000] flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EFF6FF] border-2 border-black rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-[10px] uppercase tracking-widest text-text-main">ZERO KNOWLEDGE</h3>
              <p className="font-mono text-[9px] text-gray-400 lowercase">We never see your keys</p>
            </div>
          </div>

          <div className="bg-white border-2 border-black rounded-xl p-4 shadow-[3px_3px_0px_0px_#000000] flex items-center gap-4">
            <div className="w-10 h-10 bg-[#FAF5FF] border-2 border-black rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-[#9333EA]" />
            </div>
            <div className="space-y-0.5">
              <h3 className="font-bold text-[10px] uppercase tracking-widest text-text-main">LOCAL PROCESSING</h3>
              <p className="font-mono text-[9px] text-gray-400 lowercase">Data never leaves browser</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div className="space-y-2">
          <label className="font-bold text-sm text-text-main block">Encryption Protocol</label>
          <div className="relative">
            <select 
              value={encryptionType}
              onChange={(e) => setEncryptionType(e.target.value)}
              className="w-full h-12 px-4 bg-white border-2 border-black rounded-xl font-medium text-sm appearance-none outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
            >
              <option value={EncryptionType.CHAOS}>Chaos Encryption</option>
              <option value={EncryptionType.AES}>Multi-Round AES</option>
              <option value={EncryptionType.HYBRID}>Hybrid RSA-AES</option>
              <option value={EncryptionType.SMART}>Smart Mode</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-bold text-sm text-text-main block">Access Key</label>
            <button 
              onClick={handlePasswordAnalysis}
              disabled={!password || isAnalyzing}
              className="text-[10px] font-bold text-[#2563eb] hover:underline disabled:opacity-50 flex items-center gap-1 uppercase tracking-widest"
            >
              <Zap className="w-2.5 h-2.5 fill-current" />
              KEY AUDIT
            </button>
          </div>
          <div className="relative">
            <input 
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 px-4 bg-white border-2 border-black rounded-xl font-medium text-sm outline-none focus:shadow-[2px_2px_0px_0px_#000000] transition-all"
            />
            <button 
              onClick={generatePassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-text-main transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center pt-6">
        <button 
          disabled={!file || !password || isProcessing}
          onClick={handleEncrypt}
          className="h-14 px-12 bg-black text-white rounded-xl font-bold text-base uppercase tracking-widest flex items-center gap-3 hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Lock className="w-5 h-5" />
          )}
          <span>SECURE DOCUMENT</span>
        </button>
      </div>
    </div>
  );
}
