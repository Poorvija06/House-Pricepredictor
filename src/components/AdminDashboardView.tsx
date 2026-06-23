import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Lock, User, LogIn, ShieldAlert, MessagesSquare, 
  Database, RefreshCw, FileText, LogOut, ShieldCheck 
} from 'lucide-react';
import { ContactMessage } from '../types';

interface AdminDashboardProps {
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
  adminToken: string | null;
  setAdminToken: (val: string | null) => void;
}

export default function AdminDashboardView({ 
  isAdminLoggedIn, 
  setIsAdminLoggedIn, 
  adminToken, 
  setAdminToken 
}: AdminDashboardProps) {
  
  // Login credentials states - kept completely empty and secure
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard Stats/Data States
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Function to load dashboard data
  const loadDashboardData = async (tokenString: string) => {
    setDataLoading(true);
    setDataError(null);
    try {
      const response = await fetch('/api/contacts', {
        headers: { 'Authorization': `Bearer ${tokenString}` }
      });
      const data = await response.json();
      if (data.status === 'success') {
        setMessages(data.messages);
        setStats(data.stats);
      } else {
        setDataError(data.message || 'Failed to fetch contact details.');
        if (response.status === 401) {
          handleLogout();
        }
      }
    } catch (err: any) {
      setDataError('An error occurred while connecting to the database stream.');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn && adminToken) {
      loadDashboardData(adminToken);
    }
  }, [isAdminLoggedIn, adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (data.status === 'success') {
         setAdminToken(data.token);
         setIsAdminLoggedIn(true);
         try {
           localStorage.setItem('adminToken', data.token);
         } catch (e) {
           // Ignored sandbox block
         }
      } else {
        setLoginError(data.message || 'Incorrect credentials. Please verify your administrative login.');
      }
    } catch (err) {
      setLoginError('Authentication server took too long to respond.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setIsAdminLoggedIn(false);
    try {
      localStorage.removeItem('adminToken');
    } catch (e) {
      // Ignored sandbox block
    }
    setMessages([]);
    setStats(null);
  };

  // Mask sensitive submission emails to protect identities and maintain the "no email IDs visible" rule
  const maskEmailAddress = (email: string) => {
    if (!email) return 'N/A';
    const [local, domain] = email.split('@');
    if (!domain) return '••••••••';
    const maskedLocal = local.length > 2 ? `${local.substring(0, 2)}••••` : '••••';
    const [domainName, domainExt] = domain.split('.');
    const maskedDomain = domainName.length > 2 ? `${domainName.substring(0, 2)}••••` : '••••';
    return `${maskedLocal}@${maskedDomain}.${domainExt || '•••'}`;
  };

  // secure Login Screen
  if (!isAdminLoggedIn) {
    return (
      <div className="py-12 flex items-center justify-center font-sans text-slate-800">
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-md space-y-6"
        >
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shadow-xs">
              <Lock className="h-5 w-5" />
            </div>
            <h1 className="font-sans text-xl font-extrabold tracking-tight text-slate-900 uppercase">
              Admin Authentication
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Access the secure dashboard, review user feedback logs, and monitor valuation database records securely.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <User className="h-4 w-4 text-emerald-600" /> Administrative Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-emerald-600" /> Security Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium"
                required
              />
            </div>

            {loginError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 text-[11px] font-medium text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-md shadow-emerald-600/10 transition-all hover:bg-emerald-700 cursor-pointer pointer-events-auto"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                  <span>Validating credentials...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 text-emerald-250" />
                  <span>Administrative Sign In</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard Panel Dashboard View
  return (
    <div className="space-y-6 py-4 font-sans text-slate-800">
      {/* Header and Logout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 border-l-4 border-emerald-600 pl-4">
          <h1 className="font-sans text-2xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center">
            <ShieldAlert className="h-6 w-6 text-emerald-600 mr-2 shrink-0" />
            Administrative Dashboard
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            Review submitted inquiries, check data connector statuses, and map applet performance.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-1.5 self-start sm:self-center bg-rose-50 hover:bg-rose-100 text-rose-750 text-rose-700 border border-rose-200 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer pointer-events-auto"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout Session</span>
        </button>
      </div>

      {stats && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Feedbacks count */}
          <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Inquiries Received</span>
              <span className="block text-xl font-bold text-emerald-600">{messages.length} Records</span>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MessagesSquare className="h-5 w-5" />
            </div>
          </div>

          {/* DB Status */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-xs flex items-center justify-between col-span-1 sm:col-span-2">
            <div className="space-y-1 w-full max-w-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Core Database Driver</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800">
                  {stats.isSqlite ? 'SQLite Engine (contacts.db)' : 'JSON Engine fallback (backup.json)'}
                </span>
                <span className={`text-[8px] font-bold uppercase rounded-full px-2 py-0.5 ${stats.isSqlite ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                  {stats.isSqlite ? 'SQL LIVE' : 'JSON IN-MEMORY'}
                </span>
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Database className="h-5 w-5" />
            </div>
          </div>
        </section>
      )}

      {/* Messages database table */}
      <section className="rounded-xl border border-slate-100 bg-white shadow-xs overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-4 flex items-center justify-between">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-800">User Inquiries</span>
          <button
            onClick={() => adminToken && loadDashboardData(adminToken)}
            disabled={dataLoading}
            className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-emerald-600 hover:text-emerald-750 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${dataLoading ? 'animate-spin' : ''}`} />
            <span>Reload Datastore</span>
          </button>
        </div>

        {dataLoading && messages.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="h-6 w-6 text-emerald-600 animate-spin mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-widest block mt-2">Connecting to SQL database...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FileText className="h-8 w-8 text-slate-350 mx-auto mb-2" />
            <span className="text-xs uppercase font-bold tracking-widest block text-slate-400">No contact histories found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto text-slate-800">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-bold text-[9px] sm:text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-center">ID</th>
                  <th className="px-5 py-3">Inquirer Name</th>
                  <th className="px-5 py-3">Masked Email Profile</th>
                  <th className="px-5 py-3">Message Body</th>
                  <th className="px-5 py-3">Submitted (Local System)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {messages.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50/40 text-xs">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-400 text-center">#{m.id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">{m.name}</td>
                    <td className="px-5 py-3.5 text-emerald-600 font-mono font-medium">{maskEmailAddress(m.email)}</td>
                    <td className="px-5 py-3.5 text-slate-650 max-w-sm whitespace-pre-wrap leading-relaxed">{m.message}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-[10px]">{new Date(m.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
