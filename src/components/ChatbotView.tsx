import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Bot, User, Send, HelpCircle, ArrowRight, RefreshCw 
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export default function ChatbotView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hello! I am your dedicated chennai Real Estate Assistant.\n\nI can answer questions regarding house pricing factors, layout variables, neighborhood valuations, property appreciation, or how statistical models calculate home valuations.\n\nHow can I help you with your property inquiries today?",
      timestamp: new Date()
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const faqShortcuts = [
    'How does building age affect home value?',
    'What features increase property appreciation?',
    'Why do central locations command pricing premiums?',
    'How does this automated appraiser estimate price?'
  ];

  // Auto scroll to bottom when message list expands
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const triggerAskQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: questionText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {

      const response = await fetch(
  "https://house-price-api.onrender.com/api/chatbot", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: questionText })
      });

      const data = await response.json();
      if (data.status === 'success') {
        const botMsg: Message = {
          id: Math.random().toString(),
          sender: 'bot',
          text: data.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error('Endpoint failure.');
      }
    } catch (err) {
      const botMsg: Message = {
        id: Math.random().toString(),
        sender: 'bot',
        text: "I am having temporary issues retrieving market indices. Please ask your question again, or click one of the property FAQ presets on the right.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAskQuestion(inputMessage);
  };

  return (
    <div className="space-y-6 py-4 max-w-7xl mx-auto font-sans text-slate-800">
      <div className="space-y-2 border-l-4 border-emerald-600 pl-4">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center">
          <Bot className="h-7 w-7 text-emerald-600 mr-2.5 shrink-0" />
          AI Real Estate Assistant
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm">Consult our automated assistant to learn more about housing factors, real estate metrics, and valuation details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-6xl mx-auto pt-2">
        {/* Chat Window Container */}
        <div className="lg:col-span-8 flex flex-col h-[520px] rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Header */}
          <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                AI
              </div>
              <div>
                <span className="block font-bold text-slate-900 text-xs">Property Assistant</span>
                <span className="block text-[9px] text-emerald-600 leading-none flex items-center font-semibold mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Online & Ready
                </span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m) => {
              const isBot = m.sender === 'bot';
              return (
                <div 
                  key={m.id} 
                  className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center font-bold text-xs border ${
                    isBot ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-700 text-white border-slate-600'
                  }`}>
                    {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-xs ${
                      isBot ? 'bg-white text-slate-800 border border-slate-100' : 'bg-emerald-600 text-white font-medium'
                    }`}>
                      {m.text}
                    </div>
                    <span className={`block text-[9px] text-slate-400 font-mono ${isBot ? 'text-left' : 'text-right'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3 max-w-[85%] mr-auto animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Bot className="h-4 w-4 animate-bounce" />
                </div>
                <div className="px-4 py-3.5 rounded-2xl bg-white border border-slate-100 shadow-xs flex items-center space-x-2 text-xs text-slate-550 text-slate-600">
                  <RefreshCw className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                  <span>Preparing advice response...</span>
                </div>
              </div>
            )}
            
            <div ref={scrollRef} />
          </div>

          {/* Action Footer Inputs */}
          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Ask a question about housing variables or price trend drivers..."
              className="flex-1 rounded-xl border border-slate-250 border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm bg-white outline-none focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="bg-emerald-605 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shrink-0 pointer-events-auto"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </form>
        </div>

        {/* Shortcuts Panel */}
        <div className="lg:col-span-4 rounded-xl border border-slate-100 bg-white p-5 shadow-xs h-fit space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <HelpCircle className="h-4.5 w-4.5 text-emerald-600" />
            <span className="font-bold text-slate-805 text-slate-800 text-xs uppercase tracking-wider">Property FAQs</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            Click any of the topic shortcuts below to automatically post inquiries regarding common real estate parameters:
          </p>

          <div className="flex flex-col gap-2 pt-1 font-sans">
            {faqShortcuts.map((faq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => !loading && triggerAskQuestion(faq)}
                className="w-full text-left p-3 rounded-xl border border-slate-205 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-xs text-slate-700 font-medium flex items-center justify-between transition-all group cursor-pointer disabled:opacity-50 pointer-events-auto"
                disabled={loading}
              >
                <span>{faq}</span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
