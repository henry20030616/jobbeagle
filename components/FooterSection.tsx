'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, CheckCircle, ChevronDown } from 'lucide-react';

import { AppLanguage } from '@/lib/language-context';
import { isShortsEnabled } from '@/constants/features';
import { createClient } from '@/lib/supabase/browser';

interface FooterSectionProps {
  language: AppLanguage;
}

type FT = {
  contactTitle: string; contactDesc: string; namePlaceholder: string; emailPlaceholder: string;
  messagePlaceholder: string; send: string; sending: string; successTitle: string; successDesc: string;
  errorMsg: string; privacy: string; terms: string; expandHint: string; accountManagement: string;
  careerContext: string;
};
const translations: Record<AppLanguage, FT> = {
  'zh-TW': { contactTitle: '留言給 JobBeagle', contactDesc: '有任何建議或問題，歡迎直接留言，我們會看到！', namePlaceholder: '您的稱呼（選填）', emailPlaceholder: '您的信箱（方便回覆，選填）', messagePlaceholder: '輸入留言內容…', send: '送出留言', sending: '送出中…', successTitle: '留言已送出！', successDesc: '謝謝您的回饋，我們會盡快查看。', errorMsg: '送出失敗，請稍後再試。', privacy: '隱私權政策', terms: '服務條款', expandHint: '滑鼠移近以留言', accountManagement: '帳戶管理', careerContext: 'Career Context' },
  'zh-CN': { contactTitle: '留言给 JobBeagle', contactDesc: '有任何建议或问题，欢迎直接留言，我们会看到！', namePlaceholder: '您的称呼（选填）', emailPlaceholder: '您的邮箱（方便回复，选填）', messagePlaceholder: '输入留言内容…', send: '发送留言', sending: '发送中…', successTitle: '留言已发送！', successDesc: '感谢您的反馈，我们会尽快查看。', errorMsg: '发送失败，请稍后再试。', privacy: '隐私权政策', terms: '服务条款', expandHint: '鼠标移近以留言', accountManagement: '账户管理', careerContext: 'Career Context' },
  en:      { contactTitle: 'Message JobBeagle', contactDesc: 'Have suggestions or feedback? Leave a message—we read every one!', namePlaceholder: 'Your name (optional)', emailPlaceholder: 'Your email so we can reply (optional)', messagePlaceholder: 'Write your message…', send: 'Send Message', sending: 'Sending…', successTitle: 'Message sent!', successDesc: 'Thanks for your feedback. We will check it soon.', errorMsg: 'Failed to send. Please try again later.', privacy: 'Privacy Policy', terms: 'Terms of Service', expandHint: 'Hover to leave a message', accountManagement: 'Account management', careerContext: 'Career Context' },
  es:      { contactTitle: 'Mensaje a JobBeagle', contactDesc: '¿Tienes sugerencias? Deja un mensaje—¡los leemos todos!', namePlaceholder: 'Tu nombre (opcional)', emailPlaceholder: 'Tu email para responder (opcional)', messagePlaceholder: 'Escribe tu mensaje…', send: 'Enviar Mensaje', sending: 'Enviando…', successTitle: '¡Mensaje enviado!', successDesc: 'Gracias por tu opinión. Lo revisaremos pronto.', errorMsg: 'Error al enviar. Inténtalo de nuevo más tarde.', privacy: 'Política de privacidad', terms: 'Términos de servicio', expandHint: 'Pasa el cursor para escribir', accountManagement: 'Gestión de cuenta', careerContext: 'Career Context' },
  hi:      { contactTitle: 'JobBeagle को संदेश', contactDesc: 'सुझाव या प्रतिक्रिया है? संदेश छोड़ें—हम सभी पढ़ते हैं!', namePlaceholder: 'आपका नाम (वैकल्पिक)', emailPlaceholder: 'आपका ईमेल (उत्तर के लिए, वैकल्पिक)', messagePlaceholder: 'अपना संदेश लिखें…', send: 'संदेश भेजें', sending: 'भेज रहे हैं…', successTitle: 'संदेश भेजा गया!', successDesc: 'आपकी प्रतिक्रिया के लिए धन्यवाद। हम जल्द जांचेंगे।', errorMsg: 'भेजने में विफल। कृपया बाद में पुनः प्रयास करें।', privacy: 'गोपनीयता नीति', terms: 'सेवा की शर्तें', expandHint: 'संदेश के लिए होवर करें', accountManagement: 'खाता प्रबंधन', careerContext: 'Career Context' },
  ar:      { contactTitle: 'راسل JobBeagle', contactDesc: 'هل لديك اقتراحات أو ملاحظات؟ اترك رسالة، سنقرأها كلها.', namePlaceholder: 'اسمك (اختياري)', emailPlaceholder: 'بريدك الإلكتروني للرد (اختياري)', messagePlaceholder: 'اكتب رسالتك…', send: 'إرسال الرسالة', sending: 'جارٍ الإرسال…', successTitle: 'تم إرسال الرسالة!', successDesc: 'شكرًا لملاحظاتك. سنراجعها قريبًا.', errorMsg: 'فشل الإرسال. يرجى المحاولة لاحقًا.', privacy: 'سياسة الخصوصية', terms: 'شروط الخدمة', expandHint: 'مرّر للمراسلة', accountManagement: 'إدارة الحساب', careerContext: 'Career Context' },
};

const FooterSection: React.FC<FooterSectionProps> = ({ language }) => {
  const t = translations[language];

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const closeIfIdle = () => {
    if (submitting) return;
    const active = document.activeElement;
    if (active && panelRef.current?.contains(active)) return;
    setOpen(false);
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setSignedIn(!!user));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

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

      <div className="w-full max-w-3xl mx-auto">
        <div
          ref={panelRef}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={closeIfIdle}
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              closeIfIdle();
            }
          }}
        >
          <div
            className="w-full flex items-center gap-3 px-5 py-4 text-left"
            aria-expanded={open}
          >
            <MessageCircle className="w-6 h-6 text-indigo-400 shrink-0" />
            <span className="flex-1 min-w-0">
              <span className="block text-2xl font-bold text-white">{t.contactTitle}</span>
              <span className="mt-0.5 block text-lg leading-snug text-slate-400 whitespace-normal break-words">
                {open ? t.contactDesc : t.expandHint}
              </span>
            </span>
            <ChevronDown
              className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </div>

          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
          >
            <div className="overflow-hidden">
              <div className="px-5 pb-5 pt-1 border-t border-slate-700/80">
                {submitted ? (
                  <div className="flex flex-col items-center gap-2 text-center py-4">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                    <p className="font-bold text-emerald-300">{t.successTitle}</p>
                    <p className="text-lg text-slate-400">{t.successDesc}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                    <textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t.messagePlaceholder}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    />
                    {error && <p className="text-lg text-red-400">{error}</p>}
                    <button
                      type="submit"
                      disabled={submitting || !message.trim()}
                      className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-lg text-xl transition-all active:scale-95"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? t.sending : t.send}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-lg text-slate-500 pb-2">
        <Link href="/career-context" className="hover:text-slate-300 transition-colors">{t.careerContext}</Link>
        <span className="text-slate-700">·</span>
        <Link href="/privacy" className="hover:text-slate-300 transition-colors">{t.privacy}</Link>
        <span className="text-slate-700">·</span>
        <Link href="/terms" className="hover:text-slate-300 transition-colors">{t.terms}</Link>
        {isShortsEnabled() && (
          <>
            <span className="text-slate-700">·</span>
            <Link href="/shorts" className="hover:text-slate-300 transition-colors">Shorts</Link>
          </>
        )}
        {signedIn && (
          <>
            <span className="text-slate-700">·</span>
            <Link href="/account" className="hover:text-slate-300 transition-colors">
              {t.accountManagement}
            </Link>
          </>
        )}
      </div>

      <p className="text-center text-base text-slate-500 pb-4">
        © {new Date().getFullYear()} Jobbeagle. All rights reserved.
      </p>
    </div>
  );
};

export default FooterSection;
