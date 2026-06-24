import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Lock, User, LogIn, ShieldAlert, MessagesSquare,
  Database, RefreshCw, FileText, LogOut
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

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // ---------------- LOAD DATA ----------------
  const loadDashboardData = async (tokenString: string) => {
    setDataLoading(true);
    setDataError(null);

    try {
      const response = await fetch('/api/contacts');
      const data = await response.json();

      console.log("API RESPONSE:", data);

      if (data.status === 'success') {
        setMessages(data.data || []);
        setStats({
          isSqlite: true,
          count: data.data?.length || 0
        });
      } else {
        setDataError(data.message || 'Failed to load data');
      }
    } catch (err) {
      setDataError('Server connection failed');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn && adminToken) {
      loadDashboardData(adminToken);
    }
  }, [isAdminLoggedIn, adminToken]);

  // ---------------- LOGIN ----------------
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
        localStorage.setItem('adminToken', data.token);
      } else {
        setLoginError(data.message);
      }
    } catch (err) {
      setLoginError('Login server error');
    } finally {
      setLoginLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const handleLogout = () => {
    setAdminToken(null);
    setIsAdminLoggedIn(false);
    setMessages([]);
    setStats(null);
    localStorage.removeItem('adminToken');
  };

  // ---------------- EMAIL MASK ----------------
  const maskEmail = (email: string) => {
    if (!email) return 'N/A';
    const [local, domain] = email.split('@');
    return `${local?.slice(0, 2)}••••@${domain}`;
  };

  // ---------------- LOGIN UI ----------------
  if (!isAdminLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div className="p-6 border rounded-lg w-96 bg-white">

          <h1 className="text-xl font-bold mb-4">Admin Login</h1>

          <input
            placeholder="Username"
            className="border p-2 w-full mb-2"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            className="border p-2 w-full mb-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          {loginError && (
            <p className="text-red-500 text-sm">{loginError}</p>
          )}

          <button
            onClick={handleLogin}
            className="bg-green-600 text-white w-full p-2 mt-2"
            disabled={loginLoading}
          >
            {loginLoading ? "Loading..." : "Login"}
          </button>

        </motion.div>
      </div>
    );
  }

  // ---------------- DASHBOARD UI ----------------
  return (
    <div className="p-6">

      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert /> Admin Dashboard
        </h2>

        <button onClick={handleLogout} className="text-red-600">
          Logout
        </button>
      </div>

      {/* STATS */}
      {stats && (
        <div className="mb-4 p-3 border rounded">
          <p>Total Messages: {messages.length}</p>
        </div>
      )}

      {/* REFRESH */}
      <button
        onClick={() => adminToken && loadDashboardData(adminToken)}
        className="mb-4 bg-blue-500 text-white px-3 py-1"
      >
        Refresh
      </button>

      {/* DATA TABLE */}
      {dataLoading ? (
        <p>Loading...</p>
      ) : messages.length === 0 ? (
        <p>No messages found</p>
      ) : (
        <table className="w-full border">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Message</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {(messages || []).map((m: any) => (
              <tr key={m.id} className="border-t">
                <td>{m.id}</td>
                <td>{m.name}</td>
                <td>{maskEmail(m.email)}</td>
                <td>{m.message}</td>
                <td>
                  {m.created_at
                    ? new Date(m.created_at).toLocaleString()
                    : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}