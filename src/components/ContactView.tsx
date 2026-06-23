import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, User, RefreshCw, MessageSquare } from 'lucide-react';

export default function ContactView() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please provide values for all input fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.status === 'success') {
        setSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        setError(data.message || 'Failed to submit the contact message.');
      }
    } catch (err) {
      setError('A transmission issue occurred. Please check your connectivity and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4 max-w-4xl mx-auto font-sans text-slate-800">
      {/* Contact Header */}
      <div className="space-y-2 border-l-4 border-emerald-600 pl-4">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 uppercase">
          Get In Touch
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm">
          Have an inquiry, feedback, or a question about housing parameters? Contact us using the form below.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-xl mx-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Mail className="h-4 w-4 text-emerald-600" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">Contact Form</span>
        </div>

        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 flex items-start gap-2.5 text-xs">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block uppercase tracking-wider mb-0.5">Message Sent!</span>
              Your submission was received. Our team will review it and get back to you shortly.
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs shadow-xs">
            <span className="font-bold uppercase tracking-wider block mb-0.5">Submission Error:</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-emerald-600" /> Full Name
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-emerald-600" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-emerald-600" /> Message
            </label>
            <textarea
              name="message"
              rows={4}
              placeholder="Enter your questions or feedback here..."
              value={formData.message}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500 transition-all resize-none font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest shadow-md shadow-emerald-600/10 transition-all hover:bg-emerald-700 cursor-pointer pointer-events-auto"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <Send className="h-3 w-3.5 text-emerald-250" />
                <span>Submit Inquiry</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
