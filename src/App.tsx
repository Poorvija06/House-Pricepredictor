import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import PredictFormView from './components/PredictFormView';
import FeaturesView from './components/FeaturesView';
import AboutView from './components/AboutView';
import ContactView from './components/ContactView';
import AdminDashboardView from './components/AdminDashboardView';
import ChatbotView from './components/ChatbotView';
import Footer from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Check persistent admin authentication on startup
  useEffect(() => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token === 'ChennaiSecretAdminToken123') {
        setIsAdminLoggedIn(true);
        setAdminToken(token);
      }
    } catch (e) {
      // Ignored browser sandbox security error
    }
  }, []);

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setAdminToken(null);
    try {
      localStorage.removeItem('adminToken');
    } catch (e) {
      // Ignored browser sandbox security error
    }
    setActiveTab('home');
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView 
            onStartPredict={() => setActiveTab('predict')} 
            onGoToAssistant={() => setActiveTab('chatbot')} 
          />
        );
      case 'predict':
        return <PredictFormView />;
      case 'features':
        return <FeaturesView />;
      case 'chatbot':
        return <ChatbotView />;
      case 'about':
        return <AboutView />;
      case 'contact':
        return <ContactView />;
      case 'admin':
        return (
          <AdminDashboardView 
            isAdminLoggedIn={isAdminLoggedIn} 
            setIsAdminLoggedIn={setIsAdminLoggedIn} 
            adminToken={adminToken}
            setAdminToken={setAdminToken}
          />
        );
      default:
        return <HomeView onStartPredict={() => setActiveTab('predict')} onGoToAssistant={() => setActiveTab('chatbot')} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white to-emerald-50/20 text-slate-800 selection:bg-emerald-500/20">
      {/* Dynamic Header Navbar Element */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isAdminLoggedIn={isAdminLoggedIn} 
        onLogout={handleLogout} 
      />

      {/* Main Pages Content with Smooth Transitions */}
      <main className="flex-grow mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="w-full"
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Summary Element */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
