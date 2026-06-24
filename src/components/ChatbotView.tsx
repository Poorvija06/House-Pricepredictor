import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, HelpCircle, ArrowRight, RefreshCw } from 'lucide-react';

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
      text:
        "Hello! I am your Chennai Real Estate Assistant.\n\nAsk me anything about house pricing, BHK, location impact, or valuation logic.",
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
    'What is BHK in real estate?'
  ];

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // SEND MESSAGE
  const triggerAskQuestion = async (questionText: string) => {
    if (!questionText.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: questionText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch(
  "https://house-price-api.onrender.com/api/chatbot",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userQuestion: questionText })
  }
);

const data = await response.json();

console.log("CHATBOT RESPONSE:", data); // 👈 DEBUG IMPORTANT

const botReply =
  data?.reply ||
  data?.response ||
  data?.message ||
  "Sorry, no valid response from server";

setMessages(prev => [
  ...prev,
  {
    id: Date.now().toString(),
    sender: "bot",
    text: botReply,
    timestamp: new Date()
  }
]);

      const data = await response.json();

      if (!response.ok) throw new Error('Server error');

      const botMsg: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text: data.reply || "Sorry, I couldn't generate a response.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        sender: 'bot',
        text:
          '⚠️ Server not reachable. Please try again later or check backend API.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    triggerAskQuestion(inputMessage);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 text-slate-800 font-sans">
      {/* HEADER */}
      <div className="border-l-4 border-emerald-600 pl-4 mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="text-emerald-600" />
          AI Real Estate Assistant
        </h1>
        <p className="text-sm text-slate-500">
          Ask anything about property pricing and valuation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHAT BOX */}
        <div className="lg:col-span-8 flex flex-col h-[520px] border rounded-xl bg-white overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-3 rounded-xl text-sm max-w-[75%] whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="animate-spin h-4 w-4" />
                Thinking...
              </div>
            )}

            <div ref={scrollRef} />
          </div>

          {/* INPUT */}
          <form
            onSubmit={handleSend}
            className="flex gap-2 p-3 border-t bg-white"
          >
            <input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about house price..."
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              disabled={loading}
            />
            <button
              disabled={!inputMessage.trim() || loading}
              className="bg-emerald-600 text-white px-4 rounded-lg"
            >
              <Send size={18} />
            </button>
          </form>
        </div>

        {/* FAQ PANEL */}
        <div className="lg:col-span-4 border rounded-xl p-4 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <HelpCircle className="text-emerald-600" />
            <span className="font-bold text-sm">FAQs</span>
          </div>

          {faqShortcuts.map((q, i) => (
            <button
              key={i}
              onClick={() => triggerAskQuestion(q)}
              disabled={loading}
              className="w-full text-left text-sm p-2 border rounded-lg hover:bg-emerald-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}