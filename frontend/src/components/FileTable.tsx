import React from 'react';
import { FileText, Download, Trash2, Shield, Lock, MoreVertical, Image as ImageIcon } from 'lucide-react';
import { FileRecord } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface FileTableProps {
  files: FileRecord[];
  onDelete: (id: string) => void;
}

export function FileTable({ files, onDelete }: FileTableProps) {
  if (files.length === 0) {
    return (
      <div className="neo-card p-16 flex flex-col items-center justify-center text-center space-y-8 bg-white">
        <div className="w-24 h-24 bg-black border-2 border-black flex items-center justify-center rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <Lock className="w-12 h-12 text-white stroke-[2.5]" />
        </div>
        
        <div className="max-w-sm space-y-4">
          <h3 className="text-2xl font-bold uppercase tracking-tight text-text-main">Vault Empty</h3>
          <p className="text-[11px] font-mono text-gray-500 uppercase tracking-widest leading-relaxed">
            Initialize your first encryption protocol to populate this secure storage matrix.
          </p>
          <div className="pt-4">
            <div className="inline-block px-4 py-2 border-2 border-black rounded-lg bg-yellow-200 text-[10px] font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Status: Awaiting Data
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b-2 border-black pb-4">
        <div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-text-main">Secure Vault</h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mt-1">
            Active Encrypted File Records
          </p>
        </div>
        <div className="bg-black text-white px-4 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          {files.length} {files.length === 1 ? 'Record' : 'Records'}
        </div>
      </div>

      <div className="hidden md:block neo-card overflow-hidden bg-white p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f5f3f0] border-b-2 border-black">
                <th className="px-6 py-5 font-serif italic text-xs uppercase tracking-widest text-text-main/50">File Identifier</th>
                <th className="px-6 py-5 font-serif italic text-xs uppercase tracking-widest text-text-main/50">Payload Size</th>
                <th className="px-6 py-5 font-serif italic text-xs uppercase tracking-widest text-text-main/50">Entropy</th>
                <th className="px-6 py-5 font-serif italic text-xs uppercase tracking-widest text-text-main/50">Timestamp</th>
                <th className="px-6 py-5 font-serif italic text-xs uppercase tracking-widest text-text-main/50 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {files.map((file) => (
                <tr key={file.id} className="hover:bg-yellow-50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-white border-2 border-black flex items-center justify-center rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold uppercase truncate max-w-[280px] text-text-main">{file.name}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">{file.encryptionType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-mono font-bold text-text-main">{(file.size / 1024).toFixed(1)} KB</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2.5 h-2.5 border-2 border-black rounded-full",
                        file.entropyAfter > 7.5 ? "bg-emerald-400" : "bg-blue-400"
                      )} />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-text-main">
                        {file.entropyAfter > 7.5 ? "High" : "Standard"}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-mono text-gray-500 uppercase">
                      {new Date(file.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => onDelete(file.id)}
                        className="neo-button-secondary h-9 w-9 p-0 rounded-lg bg-red-50 text-red-600 border-red-600 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)] hover:bg-red-600 hover:text-white transition-all"
                        title="Purge Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-6">
        {files.map((file) => (
          <div key={file.id} className="neo-card p-6 space-y-6 bg-white group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                <FileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold uppercase truncate text-text-main">{file.name}</p>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-0.5">{file.encryptionType}</p>
              </div>
              <button 
                onClick={() => onDelete(file.id)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-600 border-2 border-red-600 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)]"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-black border-dashed">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Size</p>
                <p className="text-xs font-mono font-bold text-text-main">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Entropy</p>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-2 h-2 border border-black rounded-full",
                    file.entropyAfter > 7.5 ? "bg-emerald-400" : "bg-blue-400"
                  )} />
                  <p className="text-[11px] font-bold uppercase text-text-main">
                    {file.entropyAfter > 7.5 ? "High" : "Std"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Date</p>
                <p className="text-xs font-mono text-gray-500 uppercase">
                  {new Date(file.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
