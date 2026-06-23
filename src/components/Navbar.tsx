import React from 'react';
import { Home, Brain, Sparkles, HelpCircle, Info, Mail, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Navbar({ activeTab, setActiveTab, isAdminLoggedIn, onLogout }: NavbarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'predict', label: 'Predict Price', icon: Sparkles },
    { id: 'features', label: 'Features', icon: Brain },
    { id: 'chatbot', label: 'AI Assistant', icon: HelpCircle },
    { id: 'about', label: 'About', icon: Info },
    { id: 'contact', label: 'Contact', icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo matching Design HTML */}
        <div 
          className="flex cursor-pointer items-center space-x-3"
          onClick={() => setActiveTab('home')}
        >
          <div className="w-9 h-9 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-emerald-600/10">
            HP
          </div>
          <div>
            <span className="font-sans text-sm font-bold tracking-tight text-slate-900 block">
             Chennai House Price  <span className="text-emerald-600 font-medium font-sans">Prediction System</span>
            </span>
            <span className="block text-[8px] font-sans font-medium text-slate-400 tracking-wider leading-none">
              Chennai House Price Prediction System
            </span>
          </div>
        </div>

        {/* Navigation and Actions */}
        <nav className="hidden md:flex space-x-1 lg:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50/70 border-b-2 border-emerald-500'
                    : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-slate-400 group-hover:text-emerald-550'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin and Status Badge */}
        <div className="flex items-center space-x-4">
          {isAdminLoggedIn ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border ${
                  activeTab === 'admin' 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Admin Panel</span>
              </button>
              <button
                onClick={onLogout}
                className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider text-rose-600 hover:text-rose-700 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all border cursor-pointer ${
                activeTab === 'admin'
                  ? 'border-emerald-500 bg-emerald-600 text-white'
                  : 'border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-650'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 text-slate-450" />
              <span>Admin Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Bar tabs list wrapper */}
      <div className="flex md:hidden border-t border-slate-100 bg-white overflow-x-auto py-2 px-3 space-x-2 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex shrink-0 items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
