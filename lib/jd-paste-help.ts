/** Shared copy so users without the extension can paste a full JD. */

export const MIN_JD_CHARS = 40;

type Lang = 'zh' | 'en';

function langOf(language: string): Lang {
  return language === 'zh-TW' || language === 'zh-CN' ? 'zh' : 'en';
}

export function jdPasteSteps(language: string): string {
  return langOf(language) === 'zh'
    ? '在職缺頁打開詳情（LinkedIn 為右側欄）→ 在詳情區全選（Ctrl/Cmd+A）→ 複製 → 回到這裡貼上完整文字，不要只貼連結。'
    : 'Open the job detail (LinkedIn: the right-hand panel) → select all in that panel (Ctrl/Cmd+A) → copy → paste the full text here, not the link.';
}

export function jdEmptyHint(language: string): string {
  return langOf(language) === 'zh'
    ? '請貼職缺正文，不要貼連結。'
    : 'Paste the job text, not the link.';
}

export function jdUrlOnlyMessage(language: string): string {
  return langOf(language) === 'zh'
    ? `⚠️ 請勿只貼網址。${jdPasteSteps(language)} Greenhouse / Lever 可自動解析。`
    : `⚠️ URL only is not accepted. ${jdPasteSteps(language)} Greenhouse / Lever can auto-fetch.`;
}

export function jdTooShortMessage(language: string, length: number): string {
  return langOf(language) === 'zh'
    ? `⚠️ 職缺描述太短（${length}/${MIN_JD_CHARS} 字）。${jdPasteSteps(language)}`
    : `⚠️ Job description is too short (${length}/${MIN_JD_CHARS} characters). ${jdPasteSteps(language)}`;
}

export function jdLaunchBlockedTitle(language: string): string {
  return langOf(language) === 'zh'
    ? '請把網址換成從職缺詳情複製的完整文字，再上傳履歷'
    : 'Replace the URL with the full job text copied from the posting, then upload a resume';
}

export function jdCharProgress(language: string, length: number): string {
  return langOf(language) === 'zh'
    ? `${length}/${MIN_JD_CHARS} 字 — 請繼續貼上完整職缺`
    : `${length}/${MIN_JD_CHARS} characters — keep pasting the full posting`;
}
