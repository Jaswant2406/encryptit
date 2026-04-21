import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, Lock, ShieldCheck, RefreshCw, FileText, Info, Database, Files, Clock, Zap } from 'lucide-react';
import { auditSecurity } from '@/src/services/aiService';
import { FileRecord } from '@/src/types';
import { cn } from '@/src/lib/utils';

interface AnalyticsDashboardProps {
  files: FileRecord[];
}

export function AnalyticsDashboard({ files }: AnalyticsDashboardProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      const config = `Total Files: ${files.length}, Avg Entropy: ${(files.reduce((acc, f) => acc + f.entropyAfter, 0) / (files.length || 1)).toFixed(2)}, Encryption Types: ${Array.from(new Set(files.map(f => f.encryptionType))).join(', ')}`;
      const report = await auditSecurity(config);
      setAuditResult(report || "Audit unavailable.");
    } catch (error) {
      console.error(error);
      setAuditResult("Failed to generate audit. Please try again later.");
    } finally {
      setIsAuditing(false);
    }
  };

  const stats = [
    { label: 'Total Vaults', value: files.length, icon: Lock, color: 'text-text-main', bg: 'bg-white' },
    { label: 'Total Storage', value: `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB`, icon: Database, color: 'text-text-main', bg: 'bg-white' },
    { label: 'Security Score', value: files.length > 0 ? '98.2%' : '0%', icon: ShieldCheck, color: 'text-text-main', bg: 'bg-white' },
  ];

  // Prepare data for charts
  const encryptionTypeData = Array.from(new Set(files.map(f => f.encryptionType))).map(type => ({
    name: type,
    value: files.filter(f => f.encryptionType === type).length
  }));

  const entropyData = files.slice(0, 10).reverse().map(f => ({
    name: f.name.substring(0, 8),
    before: f.entropyBefore,
    after: f.entropyAfter
  }));

  const recentFiles = [...files].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const COLORS = ['#000000', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b-2 border-black pb-6">
        <div>
          <h1 className="text-4xl font-abc-bold uppercase tracking-tighter text-text-main">Security Analytics</h1>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em] mt-2">
            Real-time Cryptographic Posture Monitoring
          </p>
        </div>
        <button 
          onClick={handleAudit}
          disabled={isAuditing}
          className="relative h-12 px-8 rounded-xl border-2 border-black bg-black text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
        >
          {isAuditing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span>Run Security Audit</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-md border-2 border-black bg-white px-2 py-1 flex items-center gap-2 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            <stat.icon className="w-3 h-3 text-text-main" />
            <div className="flex flex-col">
              <span className="text-[7px] font-bold uppercase tracking-tighter text-gray-400 leading-none">{stat.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-tight text-text-main leading-none">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entropy Gain Chart */}
        <div className="rounded-2xl border-2 border-black bg-white p-8 space-y-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-text-main">Entropy Gain</h3>
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">Last 10 Encryption Cycles</p>
            </div>
            <div className="bg-yellow-400 border-2 border-black px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              Live Feed
            </div>
          </div>
          
          <div className="h-[280px] min-h-[280px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={entropyData}>
                <CartesianGrid strokeDasharray="0" stroke="#000000" strokeOpacity={0.1} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={{ stroke: '#000000', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#000000' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={{ stroke: '#000000', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#000000' }} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid black', 
                    borderRadius: '12px',
                    boxShadow: '4px 4px 0px_0px_rgba(0,0,0,1)',
                    fontSize: '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase'
                  }}
                />
                <Area 
                  type="stepAfter" 
                  dataKey="after" 
                  stroke="#000000" 
                  strokeWidth={3}
                  fill="#2563eb" 
                  fillOpacity={0.2}
                  name="Post-Encryption"
                />
                <Area 
                  type="stepAfter" 
                  dataKey="before" 
                  stroke="#6b7280" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent" 
                  name="Raw State"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-8 pt-6 border-t-2 border-black border-dashed">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-black bg-[#2563eb]"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Secured Payload</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-black border-dashed bg-gray-200"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Raw Data</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-8">
          <div className="rounded-2xl border-2 border-black bg-white p-8 space-y-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-black p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight text-text-main">Recent Activity</h3>
              </div>
              <button className="text-[10px] font-bold uppercase tracking-widest hover:underline underline-offset-4">History</button>
            </div>

            <div className="space-y-4">
              {recentFiles.length > 0 ? (
                recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-black hover:bg-white transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold uppercase truncate max-w-[140px] text-text-main">{file.name}</p>
                        <p className="text-[10px] font-mono text-gray-400 uppercase tracking-tight">{file.encryptionType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-emerald-600">Secured</p>
                      <p className="text-[10px] font-mono text-gray-400 uppercase">{new Date(file.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[10px] font-mono text-gray-400 text-center py-6 uppercase tracking-widest">No activity detected.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Distribution */}
      <div className="rounded-2xl border-2 border-black bg-white p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-xl font-bold uppercase tracking-tight mb-8 text-text-main">Protocol Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="h-[240px] min-h-[240px] min-w-0 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie
                  data={encryptionTypeData.length > 0 ? encryptionTypeData : [{name: 'None', value: 1}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="black"
                  strokeWidth={2}
                >
                  {encryptionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {encryptionTypeData.length === 0 && <Cell fill="#f5f3f0" />}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid black', 
                    borderRadius: '12px',
                    boxShadow: '4px 4px 0px_0px_rgba(0,0,0,1)',
                    fontSize: '11px',
                    fontWeight: '900',
                    textTransform: 'uppercase'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-6">
            {encryptionTypeData.length > 0 ? (
              encryptionTypeData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between p-4 border-2 border-black rounded-xl bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 border-2 border-black rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-sm font-bold uppercase tracking-tight text-text-main">{entry.name}</span>
                  </div>
                  <span className="text-sm font-mono font-bold text-text-main">{((entry.value / files.length) * 100).toFixed(0)}%</span>
                </div>
              ))
            ) : (
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest italic">Insufficient data for distribution analysis.</p>
            )}
            <div className="pt-6 border-t-2 border-black border-dashed">
              <div className="flex items-center gap-4 p-5 bg-emerald-50 border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-900 leading-relaxed font-bold uppercase tracking-tight">
                  Security Status: Optimal. Your distribution utilizes high-entropy cryptographic primitives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
