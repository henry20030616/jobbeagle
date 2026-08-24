'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { Trash2 } from 'lucide-react';
import type { AppLanguage } from '@/lib/language-context';

const copy: Record<AppLanguage, { label: string; confirm: string; deleting: string; error: string }> = {
  'zh-TW': {
    label: '刪除帳戶',
    confirm: '確定永久刪除帳戶與所有分析紀錄？此操作無法復原。',
    deleting: '刪除中…',
    error: '刪除失敗，請稍後再試',
  },
  'zh-CN': {
    label: '删除账户',
    confirm: '确定永久删除账户与所有分析记录？此操作无法恢复。',
    deleting: '删除中…',
    error: '删除失败，请稍后再试',
  },
  en: {
    label: 'Delete account',
    confirm: 'Permanently delete your account and all reports? This cannot be undone.',
    deleting: 'Deleting…',
    error: 'Delete failed. Try again later.',
  },
  es: {
    label: 'Eliminar cuenta',
    confirm: '¿Eliminar permanentemente tu cuenta y todos los informes? No se puede deshacer.',
    deleting: 'Eliminando…',
    error: 'Error al eliminar. Inténtalo más tarde.',
  },
  hi: {
    label: 'खाता हटाएं',
    confirm: 'अपना खाता और सभी रिपोर्ट स्थायी रूप से हटाएं? यह पूर्ववत नहीं हो सकता।',
    deleting: 'हटाया जा रहा है…',
    error: 'हटाना विफल। बाद में पुनः प्रयास करें।',
  },
  ar: {
    label: 'حذف الحساب',
    confirm: 'حذف حسابك وجميع التقارير نهائيًا؟ لا يمكن التراجع.',
    deleting: 'جارٍ الحذف…',
    error: 'فشل الحذف. حاول لاحقًا.',
  },
};

export default function DeleteAccountButton({ language = 'en' }: { language?: AppLanguage }) {
  const t = copy[language] ?? copy.en;
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t.confirm)) return;
    setBusy(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      if (!res.ok) {
        alert(t.error);
        return;
      }
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch {
      alert(t.error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="inline-flex items-center gap-2 text-lg text-red-400/80 hover:text-red-300 transition-colors disabled:opacity-50"
    >
      <Trash2 className="w-5 h-5" />
      {busy ? t.deleting : t.label}
    </button>
  );
}
