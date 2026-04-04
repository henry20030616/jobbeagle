'use client';

import React, { useState } from 'react';
import { MessageCircle, Heart, Send, CheckCircle, Coffee } from 'lucide-react';

interface FooterSectionProps {
  language: 'zh' | 'en';
}

const translations = {
  zh: {
    contactTitle: '留言給作者',
    contactDesc: '有任何建議或問題，歡迎直接留言，我會看到！',
    namePlaceholder: '您的稱呼（選填）',
    emailPlaceholder: '您的信箱（方便我回覆，選填）',
    messagePlaceholder: '輸入留言內容…',
    send: '送出留言',
    sending: '送出中…',
    successTitle: '留言已送出！',
    successDesc: '謝謝您的回饋，我會盡快查看。',
    errorMsg: '送出失敗，請稍後再試。',
    sponsorTitle: '支持作者',
    sponsorDesc: '如果 Jobbeagle 對您的求職有幫助，歡迎贊助我繼續維護與改善！',
    sponsorBtn: '贊助一杯咖啡 ☕',
  },
  en: {
    contactTitle: 'Message the Author',
    contactDesc: 'Have suggestions or feedback? Leave a message—I read every one!',
    namePlaceholder: 'Your name (optional)',
    emailPlaceholder: 'Your email so I can reply (optional)',
    messagePlaceholder: 'Write your message…',
    send: 'Send Message',
    sending: 'Sending…',
    successTitle: 'Message sent!',
    successDesc: 'Thanks for your feedback. I will check it soon.',
    errorMsg: 'Failed to send. Please try again later.',
    sponsorTitle: 'Support the Author',
    sponsorDesc: 'If Jobbeagle helped your job search, consider buying me a coffee to keep the project going!',
    sponsorBtn: 'Buy me a coffee ☕',
  },
};

const FooterSection: React.FC<FooterSectionProps> = ({ language }) => {
  const t = translations[language];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error('failed');
      setSubmitted(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setError(t.errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 space-y-6">
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Contact Form ── */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col">
          <h3 className="text-base font-bold text-white flex items-center mb-1">
            <MessageCircle className="w-5 h-5 mr-2 text-indigo-400 shrink-0" />
            {t.contactTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">{t.contactDesc}</p>

          {submitted ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center py-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="font-bold text-emerald-300">{t.successTitle}</p>
              <p className="text-sm text-slate-400">{t.successDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.namePlaceholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none flex-1"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
                {submitting ? t.sending : t.send}
              </button>
            </form>
          )}
        </div>

        {/* ── Sponsorship ── */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col">
          <h3 className="text-base font-bold text-white flex items-center mb-1">
            <Heart className="w-5 h-5 mr-2 text-pink-400 shrink-0" />
            {t.sponsorTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-6">{t.sponsorDesc}</p>

          <div className="flex flex-col gap-3 mt-auto">
            {/* Buy Me a Coffee — 請到 buymeacoffee.com 建立帳號後換掉此連結 */}
            <a
              href="https://www.buymeacoffee.com/jobbeagle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black rounded-xl text-sm transition-all active:scale-95 hover:scale-105 shadow-lg shadow-yellow-500/20"
            >
              <Coffee className="w-5 h-5" />
              {t.sponsorBtn}
            </a>

            {/* PayPal — 請換成你的 PayPal.me 連結 */}
            <a
              href="https://paypal.me/jobbeagle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold rounded-xl text-sm transition-all active:scale-95 hover:scale-105 shadow-lg shadow-blue-500/20"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.79a.771.771 0 0 1 .762-.65h7.227c2.669 0 4.536.623 5.547 1.853.965 1.163 1.175 2.72.623 4.625-.032.111-.064.224-.099.339C17.6 11.63 15.4 13 12.245 13H9.77l-.694 4.337a.641.641 0 0 1-.633.537H7.076zm7.42-13.057c-.018.12-.038.24-.062.361-.51 2.616-2.254 3.52-4.482 3.52H8.47l-.77 4.82h1.52l.694-4.337h2.476c2.254 0 4.01-1.01 4.482-3.52a3.12 3.12 0 0 0-.376-.844z" />
              </svg>
              PayPal
            </a>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-slate-600 pb-4">
        © {new Date().getFullYear()} Jobbeagle · Made with ❤️ to help job seekers
      </p>
    </div>
  );
};

export default FooterSection;
