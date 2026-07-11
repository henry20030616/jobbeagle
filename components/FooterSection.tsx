'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, CheckCircle } from 'lucide-react';

import { AppLanguage } from '@/lib/language-context';
import { isShortsEnabled } from '@/constants/features';

interface FooterSectionProps {
  language: AppLanguage;
}

type FT = {
  contactTitle: string; contactDesc: string; namePlaceholder: string; emailPlaceholder: string;
  messagePlaceholder: string; send: string; sending: string; successTitle: string; successDesc: string;
  errorMsg: string; privacy: string; terms: string;
};
const translations: Record<AppLanguage, FT> = {
  'zh-TW': { contactTitle: '留言給作者', contactDesc: '有任何建議或問題，歡迎直接留言，我會看到！', namePlaceholder: '您的稱呼（選填）', emailPlaceholder: '您的信箱（方便我回覆，選填）', messagePlaceholder: '輸入留言內容…', send: '送出留言', sending: '送出中…', successTitle: '留言已送出！', successDesc: '謝謝您的回饋，我會盡快查看。', errorMsg: '送出失敗，請稍後再試。', privacy: '隱私權政策', terms: '服務條款' },
  'zh-CN': { contactTitle: '留言给作者', contactDesc: '有任何建议或问题，欢迎直接留言，我会看到！', namePlaceholder: '您的称呼（选填）', emailPlaceholder: '您的邮箱（方便我回复，选填）', messagePlaceholder: '输入留言内容…', send: '发送留言', sending: '发送中…', successTitle: '留言已发送！', successDesc: '感谢您的反馈，我会尽快查看。', errorMsg: '发送失败，请稍后再试。', privacy: '隐私权政策', terms: '服务条款' },
  en:      { contactTitle: 'Message the Author', contactDesc: 'Have suggestions or feedback? Leave a message—I read every one!', namePlaceholder: 'Your name (optional)', emailPlaceholder: 'Your email so I can reply (optional)', messagePlaceholder: 'Write your message…', send: 'Send Message', sending: 'Sending…', successTitle: 'Message sent!', successDesc: 'Thanks for your feedback. I will check it soon.', errorMsg: 'Failed to send. Please try again later.', privacy: 'Privacy Policy', terms: 'Terms of Service' },
  es:      { contactTitle: 'Mensaje al Autor', contactDesc: '¿Tienes sugerencias? Deja un mensaje—¡los leo todos!', namePlaceholder: 'Tu nombre (opcional)', emailPlaceholder: 'Tu email para responder (opcional)', messagePlaceholder: 'Escribe tu mensaje…', send: 'Enviar Mensaje', sending: 'Enviando…', successTitle: '¡Mensaje enviado!', successDesc: 'Gracias por tu opinión. Lo revisaré pronto.', errorMsg: 'Error al enviar. Inténtalo de nuevo más tarde.', privacy: 'Política de privacidad', terms: 'Términos de servicio' },
  hi:      { contactTitle: 'लेखक को संदेश', contactDesc: 'सुझाव या प्रतिक्रिया है? संदेश छोड़ें—मैं सभी पढ़ता हूँ!', namePlaceholder: 'आपका नाम (वैकल्पिक)', emailPlaceholder: 'आपका ईमेल (उत्तर के लिए, वैकल्पिक)', messagePlaceholder: 'अपना संदेश लिखें…', send: 'संदेश भेजें', sending: 'भेज रहे हैं…', successTitle: 'संदेश भेजा गया!', successDesc: 'आपकी प्रतिक्रिया के लिए धन्यवाद। मैं जल्द जांचूंगा।', errorMsg: 'भेजने में विफल। कृपया बाद में पुनः प्रयास करें।', privacy: 'गोपनीयता नीति', terms: 'सेवा की शर्तें' },
  ar:      { contactTitle: 'راسل المؤسس', contactDesc: 'هل لديك اقتراحات أو ملاحظات؟ اترك رسالة، سأقرأها كلها.', namePlaceholder: 'اسمك (اختياري)', emailPlaceholder: 'بريدك الإلكتروني للرد (اختياري)', messagePlaceholder: 'اكتب رسالتك…', send: 'إرسال الرسالة', sending: 'جارٍ الإرسال…', successTitle: 'تم إرسال الرسالة!', successDesc: 'شكرًا لملاحظاتك. سأراجعها قريبًا.', errorMsg: 'فشل الإرسال. يرجى المحاولة لاحقًا.', privacy: 'سياسة الخصوصية', terms: 'شروط الخدمة' },
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
      const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;
      if (!accessKey) throw new Error('not configured');

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Jobbeagle 用戶留言${name.trim() ? ` — ${name.trim()}` : ''}`,
          name: name.trim() || '（未填寫）',
          email: email.trim() || '（未填寫）',
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error('failed');

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
      <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      <div className="max-w-lg mx-auto">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col">
          <h3 className="text-base font-bold text-white flex items-center mb-1">
            <MessageCircle className="w-5 h-5 mr-2 text-indigo-400 shrink-0" />
            {t.contactTitle}
          </h3>
          <p className="text-sm text-slate-400 mb-4">{t.contactDesc}</p>

          {submitted ? (
            <div className="flex flex-col items-center gap-2 text-center py-6">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
              <p className="font-bold text-emerald-300">{t.successTitle}</p>
              <p className="text-sm text-slate-400">{t.successDesc}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
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
      </div>

      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-500 pb-2">
        <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t.privacy}</Link>
        <span className="text-slate-700">·</span>
        <Link href="/terms" className="hover:text-slate-300 transition-colors">{t.terms}</Link>
        {isShortsEnabled() && (
          <>
            <span className="text-slate-700">·</span>
            <Link href="/shorts" className="hover:text-slate-300 transition-colors">Shorts</Link>
          </>
        )}
      </div>

      <p className="text-center text-xs text-slate-600 pb-4">
        © {new Date().getFullYear()} Jobbeagle · Made with ❤️ to help job seekers
      </p>
    </div>
  );
};

export default FooterSection;
